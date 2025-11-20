/**
 * API Route: Send Message
 *
 * NOVA ABORDAGEM: Salvar no banco PRIMEIRO, depois chamar n8n de forma assíncrona
 * POST /api/n8n/send-message
 *
 * Fluxo:
 * 1. Validar auth + tenant
 * 2. Inserir mensagem no Supabase com status='pending'
 * 3. Retornar sucesso imediatamente (Realtime atualiza UI)
 * 4. Chamar n8n em background (atualiza status para 'sent' ou 'failed')
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((userData as any)?.tenant_id !== tenantId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 4. Buscar dados da conversa (contact_id, channel_id)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, tenant_id, contact_id, channel_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError || !conversation || !conversation.contact_id || !conversation.channel_id) {
      return NextResponse.json({ error: 'Conversa não encontrada ou incompleta' }, { status: 404 });
    }

    // 5. Inserir mensagem no banco ANTES de chamar n8n
    // Type assertion temporário até regenerar types do Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageData: any = {
      conversation_id: conversationId,
      content: content.trim(),
      sender_type: 'attendant',
      sender_user_id: user.id,
      status: 'pending', // Indica que está sendo enviada
      timestamp: new Date().toISOString(),
    };

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (insertError || !message) {
      console.error('Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Erro ao salvar mensagem' },
        { status: 500 }
      );
    }

    // 6. Chamar n8n de forma ASSÍNCRONA (fire-and-forget)
    // Não aguardamos resposta para não bloquear o cliente
    sendToN8nAsync(message.id, conversationId, content, tenantId, user.id, conversation.contact_id, conversation.channel_id);

    // 7. Retornar sucesso imediatamente
    // Realtime do Supabase já notificou o cliente sobre a nova mensagem
    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('Error in send-message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Função auxiliar para chamar n8n em background
 * Atualiza status da mensagem após envio
 */
async function sendToN8nAsync(
  messageId: string,
  conversationId: string,
  content: string,
  tenantId: string,
  userId: string,
  contactId: string,
  channelId: string
) {
  try {
    const result = await callN8nWebhook(N8N_SEND_MESSAGE_WEBHOOK, {
      messageId, // n8n usará para atualizar status
      conversationId,
      contactId,
      channelId,
      content,
      tenantId,
      userId,
    });

    // n8n deve atualizar o status da mensagem:
    // - Sucesso: status='sent', external_message_id=[ID do WhatsApp]
    // - Falha: status='failed'

    if (!result.success) {
      console.error('n8n webhook failed:', result.error);
      // Fallback: atualizar status manualmente se n8n não responder
      await updateMessageStatus(messageId, 'failed');
    }
  } catch (error) {
    console.error('Error calling n8n async:', error);
    await updateMessageStatus(messageId, 'failed');
  }
}

/**
 * Atualiza status da mensagem (fallback se n8n falhar)
 */
async function updateMessageStatus(messageId: string, status: 'sent' | 'failed') {
  try {
    const supabase = await createClient();
    await supabase
      .from('messages')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update({ status } as any) // Type assertion temporário até regenerar types do Supabase
      .eq('id', messageId);
  } catch (error) {
    console.error('Error updating message status:', error);
  }
}
