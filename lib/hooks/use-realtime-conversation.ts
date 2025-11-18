'use client';

/**
 * Hook: useRealtimeConversation
 *
 * Subscreve em tempo real às mudanças de estado de uma conversa
 * (status, ia_active, etc)
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Conversation } from '@/types/database';

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
          setConversation(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversation.id]);

  return { conversation };
}
