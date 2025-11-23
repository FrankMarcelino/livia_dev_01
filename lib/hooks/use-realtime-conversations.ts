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
import type { ConversationWithContact } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database';

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
    console.log('🚀 [REALTIME] Inicializando subscrições para tenant:', tenantId);
    console.log('📝 [REALTIME] Conversas iniciais:', initialConversations.length);
    
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

          // Buscar dados completos da conversa (com contato)
          const { data, error } = await supabase
            .from('conversations')
            .select(`
              *,
              contacts!inner(*)
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
            const newConv: ConversationWithContact = {
              ...data,
              contact: (data as any).contacts, // Supabase retorna como objeto aninhado
              lastMessage: null,
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
          console.log('🔔 [REALTIME] Nova mensagem recebida:', payload.new);
          
          setConversations((prev) => {
            // Encontrar conversa pela message.conversation_id
            const index = prev.findIndex(c => c.id === payload.new.conversation_id);
            
            console.log('🔍 [REALTIME] Procurando conversa:', payload.new.conversation_id);
            console.log('📊 [REALTIME] Índice encontrado:', index);
            console.log('📋 [REALTIME] Total de conversas:', prev.length);
            
            if (index === -1) {
              // Mensagem não pertence a este tenant ou conversa filtrada
              console.log('⚠️ [REALTIME] Mensagem ignorada - conversa não encontrada na lista');
              return prev;
            }

            // Criar nova lista com preview atualizado
            const updated = [...prev];
            const existing = updated[index];
            if (!existing) return prev; // Safety check
            
            console.log('✅ [REALTIME] Atualizando lastMessage da conversa:', existing.id);
            
            updated[index] = {
              ...existing,
              lastMessage: payload.new,
              last_message_at: payload.new.timestamp || payload.new.created_at,
            };

            console.log('🔄 [REALTIME] Preview atualizado:', {
              conversationId: updated[index].id,
              messageContent: payload.new.content?.substring(0, 50),
              timestamp: updated[index].last_message_at,
            });

            // Reordenar lista (conversa com nova mensagem vai para o topo)
            const sorted = sortByLastMessage(updated);
            console.log('📍 [REALTIME] Lista reordenada - conversa agora no índice:', 
              sorted.findIndex(c => c.id === existing.id)
            );
            
            return sorted;
          });
        }
      )
      .subscribe();

    console.log('✅ [REALTIME] Channel de mensagens subscrito:', `messages:tenant:${tenantId}`);

    // Cleanup: remover channels ao desmontar
    return () => {
      console.log('🔌 [REALTIME] Desconectando channels...');
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
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
