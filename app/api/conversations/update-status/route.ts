/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * API Route: Update Conversation Status
 *
 * Atualiza status da conversa de forma genérica (open/closed)
 * POST /api/conversations/update-status
 *
 * - Update direto no Supabase (sem chamar n8n)
 * - Permite TODAS as transições de status
 * - Focada em controle manual rápido via UI
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const VALID_STATUSES = ['open', 'closed'] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
  try {
    // 1. Autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validar payload
    const body = await request.json();
    const { conversationId, status, tenantId } = body;

    if (!conversationId || !status || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId, status e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se status é válido
    if (!VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        { error: `Status inválido. Valores permitidos: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    // 3. Validar tenant do usuário
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if ((userData as any)?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Buscar conversa e validar que pertence ao tenant
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, tenant_id, status')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 5. Update direto no Supabase (sem n8n)
    const { data: updatedConversation, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: status as ValidStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating conversation status:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da conversa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Status atualizado com sucesso',
      conversation: updatedConversation,
    });

  } catch (error) {
    console.error('Error in update-status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
