'use client';

import { Separator } from '@/components/ui/separator';
import { MessageItem } from './message-item';
import { MessageInput } from './message-input';
import { ConversationHeader } from './conversation-header';
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
      <ConversationHeader
        contactName={contactName}
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
              <MessageItem
                key={message.id}
                message={message}
                conversationId={conversation.id}
                tenantId={tenantId}
              />
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
        conversation={conversation}
        tenantId={tenantId}
        contactName={contactName}
        disabled={conversation.status === 'closed'}
      />
    </div>
  );
}
