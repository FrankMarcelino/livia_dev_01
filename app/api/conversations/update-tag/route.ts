/**
 * API Route: Update Conversation Tag
 *
 * Atualiza tags de uma conversa por tipo (description, success, fail)
 * POST /api/conversations/update-tag
 *
 * Fluxo:
 * 1. Validar auth + tenant
 * 2. Validar conversa
 * 3. Buscar neurocore_id do tenant
 * 4. Validar tag (se fornecida) - tags são associadas ao neurocore
 * 5. Remover tag antiga do MESMO tipo (se existir)
 * 6. Adicionar nova tag (se fornecida)
 * 7. Retornar sucesso
 *
 * Regra de Negócio:
 * - Uma conversa pode ter apenas UMA tag por tipo
 * - Tipos: 'description' (intenção), 'success' (checkout), 'fail' (falha)
 * - Uma conversa PODE ter tags de tipos diferentes simultaneamente
 *   Exemplo: tag de intenção + tag de checkout ao mesmo tempo
 * - Tags são associadas ao neurocore (não ao tenant)
 *   Múltiplos tenants do mesmo neurocore compartilham as mesmas tags
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface UpdateTagPayload {
  conversationId: string;
  tagId: string | null; // ID da tag a adicionar (null se apenas removendo)
  tagIdToRemove?: string | null; // ID específico da tag a remover
  tenantId: string;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Parse payload
    const body: UpdateTagPayload = await request.json();
    const { conversationId, tagId, tagIdToRemove, tenantId } = body;

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // 2. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. Validar conversa
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, tenant_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !conversation) {
      console.error('[update-tag] Conversation not found:', fetchError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 4. Buscar neurocore_id do tenant para validar tag
    const { data: tenantData, error: tenantDataError } = await supabase
      .from('tenants')
      .select('neurocore_id')
      .eq('id', tenantId)
      .single();

    if (tenantDataError || !tenantData?.neurocore_id) {
      console.error('[update-tag] Tenant neurocore not found:', tenantDataError);
      return NextResponse.json({ error: 'Neurocore não encontrado' }, { status: 404 });
    }

    const neurocoreId = tenantData.neurocore_id;

    // 5. Se tagId fornecido, validar e buscar tipo da tag
    let tagType: 'description' | 'success' | 'fail' | null = null;

    if (tagId) {
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id, tag_type, active')
        .eq('id', tagId)
        .eq('id_neurocore', neurocoreId)
        .single();

      if (tagError || !tag) {
        console.error('[update-tag] Tag not found:', tagError);
        return NextResponse.json({ error: 'Tag não encontrada' }, { status: 404 });
      }

      if (!tag.active) {
        return NextResponse.json({ error: 'Tag está inativa' }, { status: 400 });
      }

      tagType = tag.tag_type as 'description' | 'success' | 'fail';

      if (!tagType) {
        return NextResponse.json({ error: 'Tag sem tipo definido' }, { status: 400 });
      }
    }

    // 6a. Se tagIdToRemove especificado, remover essa tag específica
    if (tagIdToRemove) {
      const { error: deleteSpecificError } = await supabase
        .from('conversation_tags')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('tag_id', tagIdToRemove);

      if (deleteSpecificError) {
        console.error('[update-tag] Error deleting specific tag:', deleteSpecificError);
        throw deleteSpecificError;
      }

      // Se só está removendo (sem adicionar nova), retornar aqui
      if (!tagId) {
        
        return NextResponse.json({
          success: true,
          message: 'Tag removida com sucesso',
        });
      }
    }

    // 6b. Remover tag antiga do MESMO tipo (se existir e estiver adicionando nova)
    // IMPORTANTE: Apenas remove tags do mesmo tipo, permitindo múltiplos tipos simultaneamente
    if (tagType) {
      const { data: oldTags, error: fetchOldError } = await supabase
        .from('conversation_tags')
        .select('id, tag:tags!inner(id, tag_type)')
        .eq('conversation_id', conversationId);

      if (fetchOldError) {
        console.error('[update-tag] Error fetching old tags:', fetchOldError);
      }

      // Filtrar apenas conversation_tags do MESMO tipo
      const oldTagIds = (oldTags || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((ct: any) => ct.tag?.tag_type === tagType)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((ct: any) => ct.id);

      if (oldTagIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('conversation_tags')
          .delete()
          .in('id', oldTagIds);

        if (deleteError) {
          console.error('[update-tag] Error deleting old tags:', deleteError);
          throw deleteError;
        }
      }
    }

    // 7. Adicionar nova tag (se fornecida)
    if (tagId) {
      const { error: insertError } = await supabase
        .from('conversation_tags')
        .insert({
          conversation_id: conversationId,
          tag_id: tagId,
        });

      if (insertError) {
        // Se já existir (duplicate), ignorar
        if (insertError.code !== '23505') {
          console.error('[update-tag] Error inserting new tag:', insertError);
          throw insertError;
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: tagId
        ? `Tag de ${tagType === 'description' ? 'intenção' : tagType === 'success' ? 'checkout' : 'falha'} atualizada com sucesso`
        : 'Tag removida com sucesso',
      tagType,
    });

  } catch (error) {
    console.error('[update-tag] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
