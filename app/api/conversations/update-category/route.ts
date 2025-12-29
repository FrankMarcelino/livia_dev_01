/**
 * API Route: Update Category
 *
 * Atualiza a categoria de uma conversa
 * POST /api/conversations/update-category
 *
 * Fluxo:
 * 1. Validar auth + tenant
 * 2. Validar conversa
 * 3. Buscar neurocore_id do tenant
 * 4. Validar categoria (se fornecida) - tags são associadas ao neurocore
 * 5. Remover categoria antiga (se existir)
 * 6. Adicionar nova categoria (se fornecida)
 * 7. Retornar sucesso
 *
 * Categoria = Tag com is_category=true
 * Uma conversa pode ter apenas UMA categoria (mas pode ter múltiplas tags regulares)
 * Tags são associadas ao neurocore (não ao tenant)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Parse payload
    const body = await request.json();
    const { conversationId, categoryId, tenantId } = body;

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
      console.error('[update-category] Conversation not found:', fetchError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 4. Buscar neurocore_id do tenant
    const { data: tenantData, error: tenantDataError } = await supabase
      .from('tenants')
      .select('neurocore_id')
      .eq('id', tenantId)
      .single();

    if (tenantDataError || !tenantData?.neurocore_id) {
      console.error('[update-category] Tenant neurocore not found:', tenantDataError);
      return NextResponse.json({ error: 'Neurocore não encontrado' }, { status: 404 });
    }

    const neurocoreId = tenantData.neurocore_id;

    // 5. Se categoryId fornecido, validar que é uma categoria válida
    if (categoryId) {
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .select('id, is_category, active')
        .eq('id', categoryId)
        .eq('id_neurocore', neurocoreId)
        .single();

      if (tagError || !tag) {
        console.error('[update-category] Category not found:', tagError);
        return NextResponse.json({ error: 'Categoria não encontrada' }, { status: 404 });
      }

      if (!tag.is_category) {
        return NextResponse.json({ error: 'Tag especificada não é uma categoria' }, { status: 400 });
      }

      if (!tag.active) {
        return NextResponse.json({ error: 'Categoria está inativa' }, { status: 400 });
      }
    }

    const validationTime = Date.now() - startTime;
    console.error(`[update-category] ✅ Validation took ${validationTime}ms`);

    // 6. Remover todas as categorias antigas da conversa
    // (mantém tags regulares, remove apenas is_category=true)
    const { data: oldCategories, error: fetchOldError } = await supabase
      .from('conversation_tags')
      .select('id, tag:tags!inner(id, is_category)')
      .eq('conversation_id', conversationId);

    if (fetchOldError) {
      console.error('[update-category] Error fetching old categories:', fetchOldError);
    }

    // Filtrar apenas conversation_tags que são categorias
    const oldCategoryIds = (oldCategories || [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((ct: any) => ct.tag?.is_category)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((ct: any) => ct.id);

    if (oldCategoryIds.length > 0) {
      const { error: deleteError } = await supabase
        .from('conversation_tags')
        .delete()
        .in('id', oldCategoryIds);

      if (deleteError) {
        console.error('[update-category] Error deleting old categories:', deleteError);
        throw deleteError;
      }
    }

    // 7. Adicionar nova categoria (se fornecida)
    if (categoryId) {
      const { error: insertError } = await supabase
        .from('conversation_tags')
        .insert({
          conversation_id: conversationId,
          tag_id: categoryId,
        });

      if (insertError) {
        // Se já existir, ignorar (upsert-like behavior)
        if (insertError.code !== '23505') {
          console.error('[update-category] Error inserting new category:', insertError);
          throw insertError;
        }
      }
    }

    const totalTime = Date.now() - startTime;
    console.error(`[update-category] ⏱️ Total time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: categoryId ? 'Categoria atualizada com sucesso' : 'Categoria removida com sucesso',
    });

  } catch (error) {
    console.error('[update-category] ❌ Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
