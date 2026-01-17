'use client';

/**
 * Hook: useRealtimeMessages
 *
 * Subscreve em tempo real às novas mensagens de uma conversa
 *
 * Inclui reconexão automática com backoff exponencial
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { MessageWithSender } from '@/types/livechat';
import type { Message } from '@/types/database-helpers';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;

export function useRealtimeMessages(conversationId: string, initialMessages: MessageWithSender[]) {
  const [messages, setMessages] = useState<MessageWithSender[]>(initialMessages);
  const supabase = createClient();

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset messages when conversation changes
  useEffect(() => {
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Handler for new messages (INSERT)
  const handleInsert = useCallback(async (payload: { new: Message }) => {
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
  }, [supabase]);

  // Handler for message updates (UPDATE)
  const handleUpdate = useCallback((payload: { new: Message }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === payload.new.id
          ? { ...msg, ...payload.new }
          : msg
      )
    );
  }, []);

  // Subscribe with retry logic
  const subscribe = useCallback(() => {
    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`conversation:${conversationId}:messages`)
      // Listener for INSERT (new message)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        handleInsert
      )
      // Listener for UPDATE (status update)
      .on<Message>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        handleUpdate
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-messages] Connected');
          retryCountRef.current = 0; // Reset retry count on success
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[realtime-messages] Error:', err);

          if (retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);
            console.log(`[realtime-messages] Reconnecting in ${delay}ms...`);

            retryTimeoutRef.current = setTimeout(() => {
              retryCountRef.current++;
              subscribe();
            }, delay);
          } else {
            console.error('[realtime-messages] Max retries reached');
          }
        }

        if (status === 'CLOSED') {
          console.log('[realtime-messages] Channel closed');
        }
      });

    channelRef.current = channel;
  }, [supabase, conversationId, handleInsert, handleUpdate]);

  useEffect(() => {
    subscribe();

    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  return { messages };
}
