'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MessageFeedbackButtons } from './message-feedback-buttons';
import type { MessageWithSender } from '@/types/livechat';

interface MessageItemProps {
  message: MessageWithSender;
  conversationId?: string;
  tenantId?: string;
}

export function MessageItem({ message, conversationId, tenantId }: MessageItemProps) {
  const isCustomer = message.sender_type === 'customer';
  const isAttendant = message.sender_type === 'attendant';
  const isIA = message.sender_type === 'ai';

  const senderName = isCustomer
    ? 'Cliente'
    : isIA
      ? 'IA'
      : message.senderUser?.full_name || 'Atendente';

  const initials = senderName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={cn(
        'flex gap-3 mb-4',
        isCustomer ? 'flex-row' : 'flex-row-reverse'
      )}
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={message.senderUser?.avatar_url || undefined} />
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>

      <div
        className={cn(
          'flex flex-col gap-1 max-w-[70%]',
          isCustomer ? 'items-start' : 'items-end'
        )}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{senderName}</span>
          {isIA && <Badge variant="secondary">IA</Badge>}
          {isAttendant && <Badge variant="outline">Atendente</Badge>}
        </div>

        <div
          className={cn(
            'rounded-lg px-4 py-2',
            isCustomer
              ? 'bg-muted text-foreground'
              : 'bg-primary text-primary-foreground'
          )}
        >
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>

          {isIA && conversationId && tenantId && (
            <MessageFeedbackButtons
              messageId={message.id}
              conversationId={conversationId}
              tenantId={tenantId}
            />
          )}
        </div>
      </div>
    </div>
  );
}
