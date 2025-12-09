'use client';

/**
 * Hook: useRealtimeMessages
 *
 * Subscreve em tempo real às novas mensagens de uma conversa
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender } from '@/types/livechat';
import type { Message } from '@/types/database-helpers';

export function useRealtimeMessages(conversationId: string, initialMessages: MessageWithSender[]) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const supabase = createClient();

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    // Subscribe to new messages (INSERT) and status updates (UPDATE)
    const channel = supabase
      .channel(`conversation:${conversationId}:messages`)
      // Listener para INSERT (nova mensagem)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          // Fetch sender info if needed
          let senderUser = null;
          if (payload.new.sender_type === 'attendant' && payload.new.sender_user_id) {
            const { data } = await supabase
              .from('users')
              .select('id, full_name, avatar_url')
              .eq('id', payload.new.sender_user_id)
              .single();
            senderUser = data;
          }

          const newMessage: MessageWithSender = {
            ...payload.new,
            senderUser,
          };

          setMessages((prev) => [...prev, newMessage]);
        }
      )
      // Listener para UPDATE (atualização de status)
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Atualizar mensagem existente no state local
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === payload.new.id
                ? { ...msg, ...payload.new }
                : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages };
}
