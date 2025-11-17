'use client';

import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageItem } from './message-item';
import { MessageInput } from './message-input';
import { ConversationControls } from './conversation-controls';
import { useRealtimeMessages } from '@/lib/hooks/use-realtime-messages';
import { useRealtimeConversation } from '@/lib/hooks/use-realtime-conversation';
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
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages } = useRealtimeMessages(
    initialConversation.id,
    initialMessages
  );
  const { conversation } = useRealtimeConversation(initialConversation);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhuma mensagem ainda
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem key={message.id} message={message} />
          ))
        )}
      </ScrollArea>

      <Separator />

      <MessageInput
        conversationId={conversation.id}
        tenantId={tenantId}
        disabled={conversation.status === 'closed'}
      />
    </div>
  );
}
