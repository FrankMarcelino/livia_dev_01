/**
 * API Route: Send Message
 *
 * Envia mensagem manual via n8n
 * POST /api/n8n/send-message
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callN8nWebhook } from '@/lib/n8n/client';

const N8N_SEND_MESSAGE_WEBHOOK = process.env.N8N_SEND_MESSAGE_WEBHOOK!;

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
    const { conversationId, content, tenantId } = body;

    if (!conversationId || !content || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId, content e tenantId são obrigatórios' },
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

    // 4. Validar que conversa pertence ao tenant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id, tenant_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    // 5. Chamar webhook n8n
    const result = await callN8nWebhook(N8N_SEND_MESSAGE_WEBHOOK, {
      conversationId,
      content,
      tenantId,
      userId: user.id,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erro ao enviar mensagem' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);

  } catch (error) {
    console.error('Error in send-message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
