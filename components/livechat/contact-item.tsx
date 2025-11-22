'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  formatMessagePreview,
  formatRelativeTime,
  getConversationLastTimestamp,
} from '@/lib/utils/contact-list';
import type { ContactWithConversations } from '@/types/livechat';

interface ContactItemProps {
  contact: ContactWithConversations;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ContactItem({
  contact,
  isSelected = false,
  onClick,
}: ContactItemProps) {
  const activeConversation = contact.activeConversations?.[0];
  const lastMessage = activeConversation?.lastMessage;

  // Usar utilities para formatação (Single Responsibility)
  const messagePreview = formatMessagePreview(lastMessage?.content);
  const lastTimestamp = getConversationLastTimestamp(activeConversation);
  const timeDisplay = formatRelativeTime(lastTimestamp);

  const initials = contact.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const statusColors = {
    open: 'bg-green-600',
    paused: 'bg-yellow-600',
    closed: 'bg-gray-400',
  };

  const statusLabels = {
    open: 'Conversa Ativa',
    paused: 'Conversa Aguardando',
    closed: 'Encerrada',
  };

  return (
    <Card
      className={cn(
        'p-4 cursor-pointer hover:bg-accent transition-colors',
        isSelected && 'bg-accent border-primary'
      )}
      onClick={onClick}
    >
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium truncate">{contact.name}</span>
            {timeDisplay && (
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {timeDisplay}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground truncate mb-2">
            {messagePreview}
          </p>

          <div className="flex items-center gap-2">
            {activeConversation && (
              <>
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-white',
                    statusColors[activeConversation.status]
                  )}
                >
                  {statusLabels[activeConversation.status]}
                </Badge>
                {!activeConversation.ia_active && (
                  <Badge variant="outline">IA Desativada</Badge>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
