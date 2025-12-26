'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ContactList } from './contact-list';
import { ConversationView } from './conversation-view';
import { CustomerDataPanel } from './customer-data-panel';
import { MessagesSkeleton } from './messages-skeleton';
import type { ConversationWithContact, MessageWithSender } from '@/types/livechat';
import type { Conversation, Tag } from '@/types/database-helpers';

interface LivechatContentProps {
  conversations: ConversationWithContact[];
  selectedConversationId?: string;
  tenantId: string;
  selectedConversation: ConversationWithContact | null;
  conversation: Conversation | null;
  messages: MessageWithSender[] | null;
  categories: Tag[];
}

export function LivechatContent({
  conversations,
  selectedConversationId,
  tenantId,
  selectedConversation,
  conversation,
  messages,
  categories,
}: LivechatContentProps) {
  const router = useRouter();
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  // Handler que dispara ANTES da navegação
  const handleConversationClick = (conversationId: string) => {
    // Feedback instantâneo
    setLoadingConversationId(conversationId);

    // Navegação (que vai demorar 1-2s)
    router.push(`/livechat?conversation=${conversationId}`);
  };

  // Resetar loading quando a conversa correta for carregada
  useEffect(() => {
    if (loadingConversationId && conversation?.id === loadingConversationId) {
      setLoadingConversationId(null);
    }
  }, [conversation?.id, loadingConversationId]);

  // Detecta se está em transição de loading
  const isLoading = loadingConversationId && conversation?.id !== loadingConversationId;

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="w-96 border-r flex flex-col h-full">
        <div className="p-4 border-b flex-shrink-0">
          <h2 className="text-lg font-semibold">Conversas</h2>
          <p className="text-sm text-muted-foreground">
            Atendimentos ativos • WhatsApp
          </p>
        </div>
        <div className="flex-1 overflow-hidden">
          <ContactList
            initialConversations={conversations}
            selectedConversationId={selectedConversationId}
            tenantId={tenantId}
            onConversationClick={handleConversationClick}
            categories={categories}
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {isLoading ? (
          // Skeleton aparece INSTANTANEAMENTE
          <div className="flex flex-col h-full">
            <div className="p-4 border-b">
              <div className="h-6 w-48 bg-muted animate-pulse rounded" />
            </div>
            <MessagesSkeleton />
          </div>
        ) : conversation && messages && selectedConversation ? (
          <ConversationView
            initialConversation={conversation}
            initialMessages={messages}
            tenantId={tenantId}
            contactName={selectedConversation.contact.name}
            contactPhone={selectedConversation.contact.phone}
            currentCategory={selectedConversation.category}
            categories={categories}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">Selecione uma conversa</h2>
              <p className="text-muted-foreground">
                Escolha uma conversa para visualizar as mensagens
              </p>
            </div>
          </div>
        )}
      </main>

      {selectedConversation && (
        <aside className="w-80 border-l flex flex-col h-full overflow-hidden">
          <CustomerDataPanel
            contactId={selectedConversation.contact.id}
            tenantId={tenantId}
          />
        </aside>
      )}
    </div>
  );
}
