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
import {
  getContactDisplayName,
  getContactInitials,
} from '@/lib/utils/contact-helpers';
import type { ConversationWithContact } from '@/types/livechat';
import { TagBadge } from './tag-badge';

interface ContactItemProps {
  conversation: ConversationWithContact;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ContactItem({
  conversation,
  isSelected = false,
  onClick,
}: ContactItemProps) {
  const { contact, lastMessage, status, ia_active, category, conversation_tags } = conversation;

  // Usar utilities para formatação (Single Responsibility)
  const messagePreview = formatMessagePreview(lastMessage?.content);
  const lastTimestamp = getConversationLastTimestamp(conversation);
  const timeDisplay = formatRelativeTime(lastTimestamp);

  // Usar função utilitária para obter nome de exibição e iniciais com fallback
  const displayName = getContactDisplayName(contact.name, contact.phone);
  const initials = getContactInitials(contact.name, contact.phone);

  // Extrair tags da conversa EXCLUINDO a category (que já é mostrada ao lado do nome)
  const tags = conversation_tags?.map(ct => ct.tag).filter(tag => tag && tag.id && tag.id !== category?.id) || [];

  // Determinar label e cor baseado em status + ia_active
  const getStatusDisplay = () => {
    if (status === 'closed') {
      return { label: 'Encerrada', color: 'bg-gray-400' };
    }
    // status === 'open' (único status ativo agora)
    if (ia_active) {
      return { label: 'IA Ativa', color: 'bg-green-600' };
    } else {
      return { label: 'Modo Manual', color: 'bg-blue-600' };
    }
  };

  const statusDisplay = getStatusDisplay();

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
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium truncate">{displayName}</span>
              {category && <TagBadge tag={category} size="sm" />}
            </div>
            {timeDisplay && (
              <span className="text-xs text-muted-foreground shrink-0 ml-2">
                {timeDisplay}
              </span>
            )}
          </div>

          <p className="text-sm text-muted-foreground truncate mb-2">
            {messagePreview}
          </p>

          {/* Tags da conversa */}
          {tags.length > 0 && (
            <div className="flex flex-wrap items-start gap-1 mb-2 min-h-fit">
              {tags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('text-white', statusDisplay.color)}
            >
              {statusDisplay.label}
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}
