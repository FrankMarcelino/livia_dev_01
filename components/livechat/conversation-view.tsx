'use client';

import { Separator } from '@/components/ui/separator';
import { MessageItem } from './message-item';
import { MessageInput } from './message-input';
import { ConversationControls } from './conversation-controls';
import { ScrollToBottomButton } from './scroll-to-bottom-button';
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages';
import { useRealtimeConversation } from '@/lib/hooks/use-realtime-conversation';
import { useChatScroll } from '@/lib/hooks/use-chat-scroll';
import type { Conversation } from '@/types/database';
import type { MessageWithSender } from '@/types/livechat';

interface ConversationViewProps {
  initialConversation: Conversation;
  initialMessages: MessageWithSender[];
  tenantId: string;
  contactName: string;
}

export function ConversationView({
  initialConversation,
  initialMessages,
  tenantId,
  contactName,
}: ConversationViewProps) {
  const { messages } = useRealtimeMessages(
    initialConversation.id,
    initialMessages
  );
  const { conversation } = useRealtimeConversation(initialConversation);

  const { scrollRef, isAtBottom, unreadCount, scrollToBottom } =
    useChatScroll(messages);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">{contactName}</h2>
        <p className="text-sm text-muted-foreground">
          WhatsApp • {conversation.external_id}
        </p>
      </div>

      <ConversationControls
        conversation={conversation}
        tenantId={tenantId}
      />

      <div className="flex-1 relative overflow-hidden">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-4 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma mensagem ainda
            </div>
          ) : (
            messages.map((message) => (
              <MessageItem key={message.id} message={message} />
            ))
          )}
        </div>

        <ScrollToBottomButton
          show={!isAtBottom}
          unreadCount={unreadCount}
          onClick={() => scrollToBottom()}
        />
      </div>

      <Separator />

      <MessageInput
        conversationId={conversation.id}
        tenantId={tenantId}
        contactName={contactName}
        disabled={conversation.status === 'closed'}
      />
    </div>
  );
}
