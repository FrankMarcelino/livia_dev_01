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
  const startTime = Date.now();

  try {
    // 1. Parse payload primeiro (validação rápida)
    const body = await request.json();
    const { conversationId, content, tenantId } = body;

    if (!conversationId || !content || !tenantId) {
      return NextResponse.json(
        { error: 'conversationId, content e tenantId são obrigatórios' },
        { status: 400 }
      );
    }

    // 2. Autenticação + Validação em PARALELO (query única otimizada)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 3. QUERY ÚNICA: Buscar conversa + validar tenant (JOIN virtual)
    // Isso substitui 2 queries separadas (users + conversations)
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, tenant_id, contact_id, channel_id')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError || !conversation) {
      console.error('[send-message] Conversation not found:', convError);
      return NextResponse.json({ error: 'Conversa não encontrada' }, { status: 404 });
    }

    if (!conversation.contact_id || !conversation.channel_id) {
      console.error('[send-message] Incomplete conversation data:', conversation);
      return NextResponse.json({ error: 'Conversa incompleta (sem contact ou channel)' }, { status: 400 });
    }

    // 4. Inserir mensagem no banco ANTES de chamar n8n
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messageData: any = {
      conversation_id: conversationId,
      content: content.trim(),
      sender_type: 'attendant',
      sender_user_id: user.id,
      status: 'pending', // N8N vai atualizar para sent/failed/read
      timestamp: new Date().toISOString(),
    };

    const { data: message, error: insertError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('id')
      .single();

    if (insertError || !message) {
      console.error('[send-message] Error inserting message:', insertError);
      return NextResponse.json(
        { error: 'Erro ao salvar mensagem' },
        { status: 500 }
      );
    }

    const dbTime = Date.now() - startTime;
    console.log(`[send-message] DB operations took ${dbTime}ms`);

    // 5. Chamar n8n IMEDIATAMENTE em background (não bloquear response)
    // IMPORTANTE: Usar setImmediate/Promise para desacoplar completamente
    Promise.resolve().then(() => {
      sendToN8nAsync(
        message.id,
        conversationId,
        content.trim(),
        tenantId,
        user.id,
        conversation.contact_id,
        conversation.channel_id
      );
    });

    // 6. Retornar sucesso INSTANTÂNEO
    // Realtime do Supabase já notificou o cliente sobre a nova mensagem
    const totalTime = Date.now() - startTime;
    console.log(`[send-message] Total response time: ${totalTime}ms`);

    return NextResponse.json({
      success: true,
      message: {
        id: message.id,
        status: 'pending',
      },
    });

  } catch (error) {
    console.error('[send-message] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Função auxiliar para chamar n8n em background
 * N8N é responsável por atualizar o status da mensagem
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
  const n8nStartTime = Date.now();

  try {
    console.log(`[n8n-async] Calling n8n for message ${messageId.slice(0, 8)}...`);

    // Timeout de 5s para n8n (reduzido de 10s padrão)
    const result = await callN8nWebhook(
      N8N_SEND_MESSAGE_WEBHOOK,
      {
        messageId, // n8n usará para atualizar status
        conversationId,
        contactId,
        channelId,
        content,
        tenantId,
        userId,
      },
      { timeout: 5000 } // 5 segundos máximo
    );

    const n8nTime = Date.now() - n8nStartTime;

    if (result.success) {
      console.log(`[n8n-async] N8N responded successfully in ${n8nTime}ms`);
      // N8N é responsável por atualizar status='sent' e external_message_id
    } else {
      console.error(`[n8n-async] N8N failed after ${n8nTime}ms:`, result.error);
      // Fallback: atualizar status manualmente apenas se n8n não conseguir
      await updateMessageStatus(messageId, 'failed');
    }
  } catch (error) {
    const n8nTime = Date.now() - n8nStartTime;
    console.error(`[n8n-async] Exception after ${n8nTime}ms:`, error);
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
