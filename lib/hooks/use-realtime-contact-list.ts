'use client';

/**
 * Hook: useRealtimeContactList
 *
 * Subscreve em tempo real às mudanças na lista de contatos/conversas:
 * - Novas conversas (INSERT em conversations)
 * - Mudanças de status (UPDATE em conversations)
 * - Novas mensagens (INSERT em messages - para atualizar preview/timestamp)
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { ContactWithConversations } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database';

export function useRealtimeContactList(
  tenantId: string,
  initialContacts: ContactWithConversations[]
) {
  const [contacts, setContacts] = useState<ContactWithConversations[]>(initialContacts);
  const supabase = createClient();

  // Reset contacts when initialContacts changes
  useEffect(() => {
    setContacts(initialContacts);
  }, [initialContacts]);

  useEffect(() => {
    // Channel para mudanças em conversations
    const conversationsChannel = supabase
      .channel(`tenant:${tenantId}:conversations`)
      // Listener para INSERT (nova conversa)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        async (payload) => {
          console.log('[realtime-contact-list] New conversation:', payload.new.id);

          // Buscar contato relacionado
          const { data: contact } = await supabase
            .from('contacts')
            .select('id, name, phone, email')
            .eq('id', payload.new.contact_id)
            .single();

          if (!contact) return;

          // Adicionar nova conversa à lista
          setContacts((prev) => {
            // Verificar se contato já existe
            const existingContactIndex = prev.findIndex((c) => c.id === contact.id);

            if (existingContactIndex >= 0) {
              // Atualizar conversa do contato existente
              const updated = [...prev];
              updated[existingContactIndex] = {
                ...updated[existingContactIndex],
                activeConversations: [payload.new as Conversation],
              };
              return updated;
            } else {
              // Adicionar novo contato com conversa
              return [
                {
                  ...contact,
                  activeConversations: [payload.new as Conversation],
                },
                ...prev,
              ];
            }
          });
        }
      )
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
          console.log('[realtime-contact-list] Conversation updated:', {
            id: payload.new.id,
            status: payload.new.status,
            ia_active: payload.new.ia_active,
          });

          setContacts((prev) =>
            prev.map((contact) => {
              const hasConversation = contact.activeConversations?.some(
                (conv) => conv.id === payload.new.id
              );

              if (!hasConversation) return contact;

              return {
                ...contact,
                activeConversations: contact.activeConversations?.map((conv) =>
                  conv.id === payload.new.id
                    ? ({ ...conv, ...payload.new } as Conversation)
                    : conv
                ),
              };
            })
          );
        }
      )
      // Listener para DELETE (conversa removida - raro, mas possível)
      .on<Conversation>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversations',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[realtime-contact-list] Conversation deleted:', payload.old.id);

          setContacts((prev) =>
            prev
              .map((contact) => ({
                ...contact,
                activeConversations: contact.activeConversations?.filter(
                  (conv) => conv.id !== payload.old.id
                ),
              }))
              // Remover contatos sem conversas ativas
              .filter((contact) => contact.activeConversations && contact.activeConversations.length > 0)
          );
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-contact-list] ✅ Subscribed to conversations');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-contact-list] ❌ Conversations channel error:', err);
        }
      });

    // Channel para mudanças em messages (para atualizar preview/timestamp)
    const messagesChannel = supabase
      .channel(`tenant:${tenantId}:messages`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `tenant_id=eq.${tenantId}`,
        },
        (payload) => {
          console.log('[realtime-contact-list] New message in conversation:', payload.new.conversation_id);

          // Atualizar timestamp da conversa para reordenar lista
          setContacts((prev) =>
            prev.map((contact) => {
              const hasConversation = contact.activeConversations?.some(
                (conv) => conv.id === payload.new.conversation_id
              );

              if (!hasConversation) return contact;

              return {
                ...contact,
                activeConversations: contact.activeConversations?.map((conv) =>
                  conv.id === payload.new.conversation_id
                    ? {
                        ...conv,
                        last_message_at: payload.new.created_at,
                      }
                    : conv
                ),
              };
            })
          );
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('[realtime-contact-list] ✅ Subscribed to messages');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-contact-list] ❌ Messages channel error:', err);
        }
      });

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [tenantId, supabase]);

  return { contacts };
}
