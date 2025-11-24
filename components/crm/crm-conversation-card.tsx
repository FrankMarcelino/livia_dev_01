'use client';

import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';
import { formatRelativeTime, formatMessagePreview } from '@/lib/utils/contact-list';
import type { CRMConversationCardProps } from '@/types/crm';
import { cn } from '@/lib/utils';

/**
 * CRMConversationCard - Card de preview de conversa no Kanban
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza um card de conversa
 * - Open/Closed: Extensível via props, fechado para modificação
 * - Liskov Substitution: Pode ser usado em qualquer lista de cards
 *
 * Features:
 * - Preview da última mensagem (truncado)
 * - Timestamp relativo (há 5min, há 2h)
 * - Badge de status (Ativa, Aguardando, Encerrada)
 * - Ícone IA ativa/pausada
 * - Click navega para livechat
 */
export function CRMConversationCard({ conversation }: CRMConversationCardProps) {
  const router = useRouter();

  // Buscar última mensagem (pode não existir)
  const lastMessageContent = conversation.lastMessage?.content || 'Sem mensagens';
  const lastMessageTimestamp = conversation.last_message_at || conversation.created_at;

  // Determinar ícone: Bot se IA ativa, User caso contrário
  const Icon = conversation.ia_active ? Bot : User;

  // Badge variant baseado no status
  const statusConfig = {
    open: { variant: 'default' as const, label: 'Ativa', className: 'bg-green-500' },
    paused: { variant: 'secondary' as const, label: 'Aguardando', className: 'bg-yellow-500' },
    closed: { variant: 'outline' as const, label: 'Encerrada', className: 'bg-gray-500' },
  };

  const status = statusConfig[conversation.status] || statusConfig.open;

  const handleClick = () => {
    router.push(`/livechat?conversation=${conversation.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-3 border rounded-lg cursor-pointer',
        'transition-all duration-200',
        'hover:border-primary hover:shadow-md hover:scale-[1.02]',
        'bg-card'
      )}
    >
      {/* Nome do contato */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium truncate">{conversation.contact.name}</h4>
      </div>

      {/* Preview da mensagem */}
      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
        {formatMessagePreview(lastMessageContent, 80)}
      </p>

      {/* Footer: Ícone + Timestamp | Badge Status */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icon className="h-3 w-3" />
          <span>{formatRelativeTime(lastMessageTimestamp)}</span>
        </div>

        <Badge variant={status.variant} className={cn('text-[10px] px-2 py-0', status.className)}>
          {status.label}
        </Badge>
      </div>
    </div>
  );
}
