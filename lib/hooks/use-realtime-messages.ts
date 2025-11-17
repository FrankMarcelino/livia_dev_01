'use client';

/**
 * Hook: useRealtimeMessages
 *
 * Subscreve em tempo real às novas mensagens de uma conversa
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { MessageWithSender } from '@/types/livechat';
import type { Message } from '@/types/database';

export function useRealtimeMessages(conversationId: string, initialMessages: MessageWithSender[]) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new messages
    const channel = supabase
      .channel(`conversation:${conversationId}:messages`)
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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages };
}
