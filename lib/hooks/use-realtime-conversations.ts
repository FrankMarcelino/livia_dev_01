'use client';

/**
 * Hook: useRealtimeConversations
 *
 * Versão otimizada que trabalha DIRETAMENTE com ConversationWithContact[]
 *
 * Subscreve em tempo real:
 * - Mudanças de status (UPDATE em conversations)
 * - Novas conversas (INSERT em conversations)
 * - Conversas deletadas (DELETE em conversations)
 * - Novas mensagens (INSERT em messages - para atualizar preview/timestamp)
 * - Mudanças em tags (INSERT/UPDATE/DELETE em conversation_tags)
 *
 * Inclui:
 * - Reconexão automática com backoff exponencial
 * - Proteção contra race condition (initialData vs realtime)
 * - Debounce no re-sort para performance
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useDebouncedCallback } from 'use-debounce';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresDeletePayload, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { ConversationWithContact, ConversationTagWithTag } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database-helpers';

const MAX_RETRIES = 5;
const BASE_DELAY = 1000;
const SORT_DEBOUNCE_MS = 300;

export function useRealtimeConversations(
  tenantId: string,
  initialConversations: ConversationWithContact[]
) {
  // State
  const [conversations, setConversations] = useState<ConversationWithContact[]>(
    sortByLastMessage(initialConversations)
  );

  const supabase = createClient();

  // Refs for managing subscriptions and state
  const conversationsChannelRef = useRef<RealtimeChannel | null>(null);
  const messagesChannelRef = useRef<RealtimeChannel | null>(null);
  const tagsChannelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Race condition protection: track if subscription is ready
  const subscriptionReadyRef = useRef(false);
  const hasReceivedInitialDataRef = useRef(false);

  // Debounced sort function to avoid re-sorting on every message
  const debouncedSort = useDebouncedCallback(() => {
    setConversations((prev) => sortByLastMessage([...prev]));
  }, SORT_DEBOUNCE_MS);

  // Reset when initialConversations changes, but respect subscription state
  useEffect(() => {
    // Only update if subscription is not ready OR this is the first time
    if (!subscriptionReadyRef.current || !hasReceivedInitialDataRef.current) {
      setConversations(sortByLastMessage(initialConversations));
      hasReceivedInitialDataRef.current = true;
    }
  }, [initialConversations]);

  // ========================================
  // Handlers
  // ========================================

  // Handle conversation UPDATE
  const handleConversationUpdate = useCallback((payload: { new: Conversation }) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === payload.new.id);

      if (index === -1) {
        return prev;
      }

      const updated = [...prev];
      const existing = updated[index];
      if (!existing) return prev;

      updated[index] = {
        ...existing,
        ...payload.new,
        // Preserve data that doesn't come in realtime payload
        contact: existing.contact,
        lastMessage: existing.lastMessage,
        conversation_tags: existing.conversation_tags,
        category: existing.category,
      };

      return updated; // Sort will be triggered by debouncedSort
    });
    debouncedSort();
  }, [debouncedSort]);

  // Handle conversation INSERT
  const handleConversationInsert = useCallback(async (payload: { new: Conversation }) => {
    // Verify tenant
    if (payload.new.tenant_id !== tenantId) {
      return;
    }

    // Fetch complete conversation data
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        *,
        contacts!inner(*),
        conversation_tags(
          tag:tags(
            id,
            tag_name,
            color,
            is_category,
            order_index
          )
        )
      `)
      .eq('id', payload.new.id)
      .single();

    if (error || !data) {
      console.error('[realtime-conversations] Error fetching new conversation:', error);
      return;
    }

    setConversations((prev) => {
      // Avoid duplicates
      if (prev.some((c) => c.id === data.id)) {
        return prev;
      }

      const dataAny = data as unknown as Record<string, unknown>;
      const tags = (dataAny.conversation_tags || []) as unknown as ConversationTagWithTag[];
      const category = (tags
        .map((ct) => ct.tag)
        .filter((tag) => tag && tag.is_category)
        .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0))[0] || null) as ConversationWithContact['category'];

      const newConv: ConversationWithContact = {
        ...data,
        contact: dataAny.contacts as unknown as ConversationWithContact['contact'],
        lastMessage: null,
        conversation_tags: tags,
        category,
      };

      return sortByLastMessage([newConv, ...prev]);
    });
  }, [tenantId, supabase]);

  // Handle conversation DELETE
  const handleConversationDelete = useCallback((payload: RealtimePostgresDeletePayload<{ id: string }>) => {
    setConversations((prev) => prev.filter((c) => c.id !== payload.old.id));
  }, []);

  // Handle message INSERT
  const handleMessageInsert = useCallback((payload: { new: Message }) => {
    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === payload.new.conversation_id);

      if (index === -1) {
        return prev;
      }

      const updated = [...prev];
      const existing = updated[index];
      if (!existing) return prev;

      updated[index] = {
        ...existing,
        lastMessage: payload.new,
        last_message_at: payload.new.timestamp || payload.new.created_at,
      };

      return updated; // Sort will be triggered by debouncedSort
    });
    debouncedSort();
  }, [debouncedSort]);

  // Handle tags changes
  const handleTagsChange = useCallback(async (payload: RealtimePostgresChangesPayload<{ conversation_id: string }>) => {
    const conversationId =
      payload.eventType === 'DELETE'
        ? payload.old?.conversation_id
        : payload.new?.conversation_id;

    if (!conversationId) return;

    // Fetch updated tags for the conversation
    const { data: tagsData, error: tagsError } = await supabase
      .from('conversation_tags')
      .select(`
        id,
        tag_id,
        tag:tags(
          id,
          tag_name,
          color,
          is_category,
          order_index,
          active,
          created_at,
          id_tenant,
          prompt_to_ai
        )
      `)
      .eq('conversation_id', conversationId);

    if (tagsError) {
      console.error('[realtime-conversations] Error fetching tags:', tagsError);
      return;
    }

    setConversations((prev) => {
      const index = prev.findIndex((c) => c.id === conversationId);

      if (index === -1) {
        return prev;
      }

      const existing = prev[index];
      if (!existing) return prev;

      const tags = (tagsData || []) as unknown as ConversationTagWithTag[];
      const category = (tags
        .map((ct) => ct.tag)
        .filter((tag) => tag && tag.is_category)
        .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0))[0] || null) as ConversationWithContact['category'];

      const updated = [...prev];
      updated[index] = {
        ...existing,
        conversation_tags: tags,
        category,
      };
      return updated;
    });
  }, [supabase]);

  // ========================================
  // Subscribe with retry logic
  // ========================================
  const subscribe = useCallback(() => {
    // Clean up existing channels
    if (conversationsChannelRef.current) {
      supabase.removeChannel(conversationsChannelRef.current);
      conversationsChannelRef.current = null;
    }
    if (messagesChannelRef.current) {
      supabase.removeChannel(messagesChannelRef.current);
      messagesChannelRef.current = null;
    }
    if (tagsChannelRef.current) {
      supabase.removeChannel(tagsChannelRef.current);
      tagsChannelRef.current = null;
    }

    // ========================================
    // Channel 1: Conversations
    // ========================================
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
        handleConversationUpdate
      )
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        handleConversationInsert
      )
      .on<{ id: string }>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        handleConversationDelete
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-conversations] Conversations channel connected');
          subscriptionReadyRef.current = true;
          retryCountRef.current = 0;
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error('[realtime-conversations] Conversations channel error:', err);
          subscriptionReadyRef.current = false;

          if (retryCountRef.current < MAX_RETRIES) {
            const delay = Math.min(BASE_DELAY * Math.pow(2, retryCountRef.current), 30000);
            console.log(`[realtime-conversations] Reconnecting in ${delay}ms...`);

            retryTimeoutRef.current = setTimeout(() => {
              retryCountRef.current++;
              subscribe();
            }, delay);
          } else {
            console.error('[realtime-conversations] Max retries reached');
          }
        }
      });

    conversationsChannelRef.current = conversationsChannel;

    // ========================================
    // Channel 2: Messages
    // ========================================
    const messagesChannel = supabase
      .channel(`messages:tenant:${tenantId}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        handleMessageInsert
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-conversations] Messages channel connected');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-conversations] Messages channel error:', err);
        }
      });

    messagesChannelRef.current = messagesChannel;

    // ========================================
    // Channel 3: Tags
    // ========================================
    const tagsChannel = supabase
      .channel(`conversation_tags:tenant:${tenantId}`)
      .on<{ conversation_id: string }>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_tags',
        },
        handleTagsChange
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-conversations] Tags channel connected');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-conversations] Tags channel error:', err);
        }
      });

    tagsChannelRef.current = tagsChannel;
  }, [
    supabase,
    tenantId,
    handleConversationUpdate,
    handleConversationInsert,
    handleConversationDelete,
    handleMessageInsert,
    handleTagsChange,
  ]);

  useEffect(() => {
    subscribe();

    return () => {
      // Cleanup on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (conversationsChannelRef.current) {
        supabase.removeChannel(conversationsChannelRef.current);
      }
      if (messagesChannelRef.current) {
        supabase.removeChannel(messagesChannelRef.current);
      }
      if (tagsChannelRef.current) {
        supabase.removeChannel(tagsChannelRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]);

  return { conversations };
}

// ========================================
// Helper: Sort by last message
// ========================================
function sortByLastMessage(
  convs: ConversationWithContact[]
): ConversationWithContact[] {
  return [...convs].sort((a, b) => {
    const timeA = a.last_message_at || a.created_at;
    const timeB = b.last_message_at || b.created_at;
    return new Date(timeB).getTime() - new Date(timeA).getTime();
  });
}
