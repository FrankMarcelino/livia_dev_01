'use client';

/**
 * Hook: useCRMRealtime
 *
 * Subscreve em tempo real:
 * - Mudanças em conversations (status, last_message_at)
 * - Mudanças em conversation_tags (adição/remoção de tags)
 * - Mudanças em tags (nome, ativo, ordem)
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia subscrições realtime do CRM
 * - Open/Closed: Extensível via novos listeners
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Tag, Conversation, ConversationTag } from '@/types/database-helpers';
import type { ConversationWithTagsAndContact } from '@/types/crm';

interface UseCRMRealtimeProps {
  tenantId: string;
  initialTags: Tag[];
  initialConversations: ConversationWithTagsAndContact[];
}

export function useCRMRealtime({
  tenantId,
  initialTags,
  initialConversations,
}: UseCRMRealtimeProps) {
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [conversations, setConversations] = useState<ConversationWithTagsAndContact[]>(
    initialConversations
  );

  const supabase = createClient();
  const conversationsRef = useRef(conversations);
  const tagsRef = useRef(tags);

  // Manter refs atualizadas
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    tagsRef.current = tags;
  }, [tags]);

  useEffect(() => {
    // Channel 1: Mudanças em TAGS
    const tagsChannel = supabase
      .channel(`tenant:${tenantId}:tags`)
      .on<Tag>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tags',
          filter: `id_tenant=eq.${tenantId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTags((prev) => [...prev, payload.new].sort((a, b) =>
              (a.order_index || 0) - (b.order_index || 0)
            ));
          } else if (payload.eventType === 'UPDATE') {
            setTags((prev) =>
              prev.map((t) => (t.id === payload.new.id ? payload.new : t))
                .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
            );
          } else if (payload.eventType === 'DELETE') {
            setTags((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Channel 2: Mudanças em CONVERSATIONS
    const conversationsChannel = supabase
      .channel(`tenant:${tenantId}:conversations`)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          setConversations((prev) => {
            const index = prev.findIndex((c) => c.id === payload.new.id);
            if (index === -1) return prev;

            const updated = [...prev];
            const existing = updated[index];
            if (!existing) return prev;

            updated[index] = {
              ...existing,
              ...payload.new,
              contact: existing.contact,
              conversation_tags: existing.conversation_tags,
            };

            return updated;
          });
        }
      )
      .subscribe();

    // Channel 3: Mudanças em CONVERSATION_TAGS
    const conversationTagsChannel = supabase
      .channel('conversation_tags')
      .on<ConversationTag>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_tags',
        },
        async (payload) => {
          // Re-fetch conversation com tags atualizadas
          // TODO: Otimizar para não fazer fetch completo
          console.warn('Conversation tags changed:', payload);
        }
      )
      .subscribe();

    return () => {
      tagsChannel.unsubscribe();
      conversationsChannel.unsubscribe();
      conversationTagsChannel.unsubscribe();
    };
  }, [tenantId, supabase]);

  return { tags, conversations };
}
