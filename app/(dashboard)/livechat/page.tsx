import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getConversationsWithContact,
  getConversation,
  getMessages,
} from '@/lib/queries/livechat';
import { ContactList, ConversationView } from '@/components/livechat';
import { CustomerDataPanel } from '@/components/livechat/customer-data-panel';

interface LivechatPageProps {
  searchParams: Promise<{ conversation?: string }>;
}

export default async function LivechatPage({
  searchParams,
}: LivechatPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name, email, avatar_url')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (userData as any)?.tenant_id;
  if (!tenantId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Usuário sem tenant associado
        </p>
      </div>
    );
  }

  // Buscar TODAS conversas (incluindo encerradas) para permitir filtro client-side
  const conversations = await getConversationsWithContact(tenantId, {
    includeClosedConversations: true,
  });

  const resolvedParams = await searchParams;
  const selectedConversationId = resolvedParams.conversation;

  let selectedConversation = null;
  let conversation = null;
  let messages = null;

  if (selectedConversationId) {
    // Encontrar conversa selecionada
    selectedConversation = conversations.find((c) => c.id === selectedConversationId);
    if (selectedConversation) {
      conversation = await getConversation(selectedConversation.id, tenantId);
      if (conversation) {
        messages = await getMessages(conversation.id);
      }
    }
  }

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
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {conversation && messages && selectedConversation ? (
          <ConversationView
            initialConversation={conversation}
            initialMessages={messages}
            tenantId={tenantId}
            contactName={selectedConversation.contact.name}
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
