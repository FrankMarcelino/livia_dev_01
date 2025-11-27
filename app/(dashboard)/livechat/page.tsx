import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import {
  getConversationsWithContact,
  getConversation,
  getMessages,
} from '@/lib/queries/livechat';
import { LivechatContent } from '@/components/livechat/livechat-content';

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
    <LivechatContent
      conversations={conversations}
      selectedConversationId={selectedConversationId}
      tenantId={tenantId}
      selectedConversation={selectedConversation || null}
      conversation={conversation}
      messages={messages}
    />
  );
}
