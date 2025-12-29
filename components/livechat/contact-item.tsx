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

  // Extrair tags da conversa (excluindo categorias antigas)
  const tags = conversation_tags?.map(ct => ct.tag).filter(tag => !tag.is_category) || [];
  const maxVisibleTags = 2;
  const visibleTags = tags.slice(0, maxVisibleTags);
  const remainingTagsCount = Math.max(0, tags.length - maxVisibleTags);

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
            <div className="flex items-center gap-1 mb-2 flex-wrap">
              {visibleTags.map((tag) => (
                <TagBadge key={tag.id} tag={tag} size="sm" />
              ))}
              {remainingTagsCount > 0 && (
                <Badge variant="secondary" className="text-xs h-5 px-1.5">
                  +{remainingTagsCount}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={cn(
                'text-white',
                statusColors[status]
              )}
            >
              {statusLabels[status]}
            </Badge>
            {!ia_active && (
              <Badge variant="outline">IA Desativada</Badge>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
