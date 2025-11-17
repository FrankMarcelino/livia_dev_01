import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getContactsWithConversations,
  getConversation,
  getMessages,
} from '@/lib/queries/livechat';
import { ContactList, ConversationView } from '@/components/livechat';
import { Header } from '@/components/auth/header';

interface LivechatPageProps {
  searchParams: Promise<{ contact?: string }>;
}

export default async function LivechatPage({
  searchParams,
}: LivechatPageProps) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/login');
  }

  // TEMPORÁRIO: Usando admin client para bypass RLS
  const { createAdminClient } = await import('@/lib/supabase/admin');
  const adminClient = createAdminClient();

  const { data: userData } = await adminClient
    .from('users')
    .select('tenant_id, full_name, email, avatar_url')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (userData as any)?.tenant_id;
  if (!tenantId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Usuário sem tenant associado
        </p>
      </div>
    );
  }

  const contacts = await getContactsWithConversations(tenantId);

  const resolvedParams = await searchParams;
  const selectedContactId = resolvedParams.contact;

  let selectedContact = null;
  let conversation = null;
  let messages = null;

  if (selectedContactId) {
    selectedContact = contacts.find((c) => c.id === selectedContactId);
    if (selectedContact) {
      const activeConversation = selectedContact.activeConversations?.[0];
      if (activeConversation) {
        conversation = await getConversation(activeConversation.id, tenantId);
        if (conversation) {
          messages = await getMessages(conversation.id);
        }
      }
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header
        userName={(userData as any)?.full_name || 'Usuário'}
        userEmail={(userData as any)?.email}
        avatarUrl={(userData as any)?.avatar_url}
      />

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-96 border-r">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Conversas</h2>
            <p className="text-sm text-muted-foreground">
              Atendimentos ativos • WhatsApp
            </p>
          </div>
          <ContactList
            contacts={contacts}
            selectedContactId={selectedContactId}
          />
        </aside>

        <main className="flex-1">
          {conversation && messages && selectedContact ? (
            <ConversationView
              initialConversation={conversation}
              initialMessages={messages}
              tenantId={tenantId}
              contactName={selectedContact.name}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-2">
                <h2 className="text-xl font-semibold">Selecione uma conversa</h2>
                <p className="text-muted-foreground">
                  Escolha um contato para visualizar as mensagens
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
