'use client';

/**
 * Hook: useRealtimeConversations
 * 
 * Versão simplificada que trabalha DIRETAMENTE com ConversationWithContact[]
 * sem transformações de dados desnecessárias.
 * 
 * Subscreve em tempo real:
 * - Mudanças de status (UPDATE em conversations)
 * - Novas conversas (INSERT em conversations)
 * - Novas mensagens (INSERT em messages - para atualizar preview/timestamp)
 * 
 * Mantém lista sempre ordenada por última mensagem (mais recente primeiro)
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ConversationWithContact, ConversationTagWithTag } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database-helpers';

export function useRealtimeConversations(
  tenantId: string,
  initialConversations: ConversationWithContact[]
) {
  // Inicializar com lista ordenada
  const [conversations, setConversations] = useState<ConversationWithContact[]>(
    sortByLastMessage(initialConversations)
  );
  
  const supabase = createClient();
  
  // Ref para acessar estado atual dentro dos callbacks sem recriar subscrição
  const conversationsRef = useRef(conversations);

  // Reset quando initialConversations mudar (e reordena)
  useEffect(() => {
    setConversations(sortByLastMessage(initialConversations));
  }, [initialConversations]);

  // Manter ref atualizada
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    // ========================================
    // Channel 1: Mudanças em CONVERSATIONS
    // ========================================
    const conversationsChannel = supabase
      .channel(`tenant:${tenantId}:conversations`)
      
      // Listener para UPDATE (mudança de status, ia_active, etc)
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
            // Encontrar conversa na lista
            const index = prev.findIndex(c => c.id === payload.new.id);
            
            if (index === -1) {
              // Não está na lista (filtro ou conversa de outro tenant)
              return prev;
            }

            // Criar nova lista com conversa atualizada
            const updated = [...prev];
            const existing = updated[index];
            if (!existing) return prev; // Safety check
            
            updated[index] = {
              ...existing,
              ...payload.new,
              // IMPORTANTE: Preservar dados que não vêm no payload realtime
              contact: existing.contact,
              lastMessage: existing.lastMessage,
              conversation_tags: existing.conversation_tags, // FIX: Preservar tags
              category: existing.category, // FIX: Preservar categoria
            };

            // Reordenar lista
            return sortByLastMessage(updated);
          });
        }
      )
      
      // Listener para INSERT (novas conversas)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          // Verificar tenant (segurança extra)
          if (payload.new.tenant_id !== tenantId) {
            return;
          }

          // Buscar dados completos da conversa (com contato e tags)
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
            console.error('Erro ao buscar conversa completa:', error);
            return;
          }

          setConversations((prev) => {
            // Evitar duplicatas
            if (prev.some(c => c.id === data.id)) {
              return prev;
            }

            // Criar nova conversa com estrutura correta
            const dataAny = data as unknown as Record<string, unknown>;
            const tags = (dataAny.conversation_tags || []) as unknown as ConversationTagWithTag[];
            const category = (tags
              .map((ct) => ct.tag)
              .filter((tag) => tag && tag.is_category)
              .sort((a, b) => (a?.order_index || 0) - (b?.order_index || 0))[0] || null) as ConversationWithContact['category'];

            const newConv: ConversationWithContact = {
              ...data,
              contact: dataAny.contacts as unknown as ConversationWithContact['contact'], // Supabase retorna como objeto aninhado
              lastMessage: null,
              conversation_tags: tags,
              category,
            };

            // Adicionar no início e reordenar
            return sortByLastMessage([newConv, ...prev]);
          });
        }
      )
      .subscribe();

    // ========================================
    // Channel 2: Novas MENSAGENS
    // ========================================
    const messagesChannel = supabase
      .channel(`messages:tenant:${tenantId}`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // NOTA: messages não tem tenant_id, filtramos no callback
        },
        (payload) => {
          setConversations((prev) => {
            // Encontrar conversa pela message.conversation_id
            const index = prev.findIndex(c => c.id === payload.new.conversation_id);
            
            if (index === -1) {
              // Mensagem não pertence a este tenant ou conversa filtrada
              return prev;
            }

            // Criar nova lista com preview atualizado
            const updated = [...prev];
            const existing = updated[index];
            if (!existing) return prev; // Safety check
            
            updated[index] = {
              ...existing,
              lastMessage: payload.new,
              last_message_at: payload.new.timestamp || payload.new.created_at,
            };

            // Reordenar lista (conversa com nova mensagem vai para o topo)
            return sortByLastMessage(updated);
          });
        }
      )
      .subscribe();

    // ========================================
    // Channel 3: Mudanças em CONVERSATION_TAGS
    // ========================================
    const tagsChannel = supabase
      .channel(`conversation_tags:tenant:${tenantId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'conversation_tags',
        },
        async (payload) => {
          // Buscar conversation_id do payload
          const conversationId =
            payload.eventType === 'DELETE'
              ? (payload.old as { conversation_id?: string })?.conversation_id
              : (payload.new as { conversation_id?: string })?.conversation_id;

          if (!conversationId) return;

          // Buscar tags atualizadas da conversa
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
            console.error('Erro ao buscar tags atualizadas:', tagsError);
            return;
          }

          // Atualizar conversa na lista
          setConversations((prev) => {
            const index = prev.findIndex(c => c.id === conversationId);

            if (index === -1) {
              // Conversa não está na lista
              return prev;
            }

            const existing = prev[index];
            if (!existing) return prev; // Safety check

            // Calcular categoria
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
        }
      )
      .subscribe();

    // Cleanup: remover channels ao desmontar
    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(tagsChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]); // Apenas tenantId - supabase é estável

  return { conversations };
}

// ========================================
// Helper: Ordenar por última mensagem
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
