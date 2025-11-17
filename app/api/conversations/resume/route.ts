/**
 * API Route: Resume Conversation
 *
 * Retoma conversa pausada (status -> open, ia_active -> true)
 * POST /api/conversations/resume
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callN8nWebhook } from '@/lib/n8n/client';

const N8N_RESUME_CONVERSATION_WEBHOOK = process.env.N8N_RESUME_CONVERSATION_WEBHOOK!;

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
    const { conversationId, tenantId } = body;

    if (!conversationId || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId e tenantId são obrigatórios' },
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

    // 4. Buscar conversa e validar estado
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, tenant_id, status')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError || !conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conv = conversation as any;
    if (conv.status === 'open') {
      return NextResponse.json({ error: 'Conversa já está ativa' }, { status: 400 });
    }

    // 5. Chamar webhook n8n para retomar conversa
    const result = await callN8nWebhook(N8N_RESUME_CONVERSATION_WEBHOOK, {
      conversationId,
      tenantId,
      userId: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao retomar conversa' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Conversa retomada com sucesso',
      conversation: result.data,
    });

  } catch (error) {
    console.error('Error in resume conversation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
