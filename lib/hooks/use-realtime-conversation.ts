'use client';

/**
 * Hook: useRealtimeConversation
 *
 * Subscreve em tempo real às mudanças de estado de uma conversa
 * (status, ia_active, etc)
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/database-helpers';

export function useRealtimeConversation(initialConversation: Conversation) {
  const [conversation, setConversation] = useState<Conversation>(initialConversation);
  const supabase = createClient();

  // Reset conversation when it changes
  useEffect(() => {
    setConversation(initialConversation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversation.id]);

  useEffect(() => {
    const channel = supabase
      .channel(`conversation:${initialConversation.id}:state`)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `id=eq.${initialConversation.id}`,
        },
        (payload) => {
          console.log('[realtime-conversation] UPDATE received:', {
            conversationId: initialConversation.id,
            old: payload.old,
            new: payload.new,
            ia_active: payload.new.ia_active,
            pause_notes: payload.new.pause_notes,
          });
          setConversation(payload.new);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-conversation] ✅ Subscribed to conversation:', initialConversation.id);
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-conversation] ❌ Channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('[realtime-conversation] ⏱️ Subscription timed out');
        } else if (status === 'CLOSED') {
          console.log('[realtime-conversation] 🔌 Channel closed');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversation.id]);

  return { conversation };
}
