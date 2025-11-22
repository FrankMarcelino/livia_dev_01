'use client';

/**
 * Hook: useRealtimeContactList
 *
 * Subscreve em tempo real às mudanças na lista de contatos/conversas:
 * - Mudanças de status (UPDATE em conversations)
 * - Novas mensagens (INSERT em messages - para atualizar preview/timestamp)
 *
 * Mantém lista sempre ordenada por última mensagem (mais recente primeiro)
 */

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { sortContactsByLastMessage } from '@/lib/utils/contact-list';
import type { ContactWithConversations } from '@/types/livechat';
import type { Conversation, Message } from '@/types/database';

export function useRealtimeContactList(
  tenantId: string,
  initialContacts: ContactWithConversations[]
) {
  // Inicializar com lista ordenada
  const [contacts, setContacts] = useState<ContactWithConversations[]>(
    sortContactsByLastMessage(initialContacts)
  );
  const supabase = createClient();

  // Reset contacts when initialContacts changes (e reordena)
  useEffect(() => {
    setContacts(sortContactsByLastMessage(initialContacts));
  }, [initialContacts]);

  // Ref para acessar o estado atual dentro dos callbacks do realtime sem recriar a subscrição
  const contactsRef = useRef(contacts);

  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  useEffect(() => {

    // Channel para mudanças em conversations
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
        async (payload) => {
          // Verificar se a conversa já existe na lista
          const currentContacts = contactsRef.current;
          const exists = currentContacts.some((c: ContactWithConversations) => 
            c.activeConversations.some((conv: Conversation) => conv.id === payload.new.id)
          );

          if (!exists) {
            
            // Buscar dados do contato para adicionar a conversa
            const { data: contactData, error } = await supabase
              .from('contacts')
              .select('*') // Select all to avoid missing fields type error
              .eq('id', payload.new.contact_id)
              .single();

            if (error || !contactData) {
              return;
            }

            setContacts((prev) => {
              // Double check inside setter
              if (prev.some(c => c.activeConversations.some(conv => conv.id === payload.new.id))) {
                return prev;
              }

              const newConversation = {
                ...payload.new,
                lastMessage: null,
              } as any;

              const existingContactIndex = prev.findIndex(c => c.id === contactData.id);

              if (existingContactIndex >= 0) {
                const updated = [...prev];
                updated[existingContactIndex] = {
                  ...updated[existingContactIndex],
                  activeConversations: [
                    newConversation,
                    ...updated[existingContactIndex].activeConversations
                  ]
                };
                return sortContactsByLastMessage(updated);
              } else {
                const newContact = {
                  ...contactData,
                  activeConversations: [newConversation]
                } as unknown as ContactWithConversations;
                return sortContactsByLastMessage([newContact, ...prev]);
              }
            });
            return;
          }

          setContacts((prev) => {
            const updated = prev.map((contact) => {
              const hasConversation = contact.activeConversations?.some(
                (conv) => conv.id === payload.new.id
              );

              if (!hasConversation) {
                return contact;
              }

              return {
                ...contact,
                activeConversations: contact.activeConversations?.map((conv) =>
                  conv.id === payload.new.id
                    ? ({ ...conv, ...payload.new } as any) // eslint-disable-line @typescript-eslint/no-explicit-any
                    : conv
                ),
              };
            });

            return sortContactsByLastMessage(updated);
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
          // Verificar se o tenantId bate (segurança extra)
          if (payload.new.tenant_id !== tenantId) {
            return;
          }

          // Buscar dados completos do contato para a nova conversa
          const { data: contactData, error } = await supabase
            .from('contacts')
            .select('*')
            .eq('id', payload.new.contact_id)
            .single();

          if (error || !contactData) {
            return;
          }

          setContacts((prev) => {
            // Verificar se já existe (evitar duplicatas)
            const alreadyExists = prev.some(c => c.activeConversations.some(conv => conv.id === payload.new.id));
            if (alreadyExists) {
              return prev;
            }

            const newConversation = {
              ...payload.new,
              lastMessage: null,
            } as any;

            // Verificar se o contato já existe na lista
            const existingContactIndex = prev.findIndex(c => c.id === contactData.id);

            if (existingContactIndex >= 0) {
              // Atualizar contato existente com nova conversa
              const updated = [...prev];
              updated[existingContactIndex] = {
                ...updated[existingContactIndex],
                activeConversations: [
                  newConversation,
                  ...updated[existingContactIndex].activeConversations
                ]
              };
              return sortContactsByLastMessage(updated);
            } else {
              // Adicionar novo contato com a conversa
              const newContact = {
                ...contactData,
                activeConversations: [newConversation]
              } as unknown as ContactWithConversations;
              
              return sortContactsByLastMessage([newContact, ...prev]);
            }
          });
        }
      )
      .subscribe();



    // Channel para mudanças em messages (para atualizar preview/timestamp)
    // NOTA: messages não tem tenant_id, então filtramos manualmente no callback
    const messagesChannel = supabase
      .channel(`messages:all`)
      .on<Message>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          // SEM filtro de tenant_id pois a tabela não tem esse campo
        },
        (payload) => {
          setContacts((prev) => {
            // Verificar se a conversa pertence a este tenant
            const belongsToTenant = prev.some(contact => 
              contact.activeConversations?.some(conv => conv.id === payload.new.conversation_id)
            );

            if (!belongsToTenant) return prev;

            const updated = prev.map((contact) => {
              const hasConversation = contact.activeConversations?.some(
                (conv) => conv.id === payload.new.conversation_id
              );

              if (!hasConversation) {
                return contact;
              }

              return {
                ...contact,
                activeConversations: contact.activeConversations?.map((conv) => {
                  if (conv.id === payload.new.conversation_id) {
                    
                    return {
                      ...conv,
                      last_message_at: payload.new.timestamp || payload.new.created_at,
                      lastMessage: payload.new as Message,
                    };
                  }
                  return conv;
                }),
              };
            });

            return sortContactsByLastMessage(updated);
          });
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[realtime-contact-list] ❌ Messages channel error:', err);
        } else if (status === 'TIMED_OUT') {
          console.error('[realtime-contact-list] ⏱️ Messages subscription timed out');
        } else if (status === 'CLOSED') {
          console.warn('[realtime-contact-list] 🔌 Messages channel closed');
        }
      });

    return () => {
      supabase.removeChannel(conversationsChannel);
      supabase.removeChannel(messagesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantId]); // Apenas tenantId - supabase é estável

  return { contacts };
}
