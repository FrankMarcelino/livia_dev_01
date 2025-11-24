'use client';

import { CRMConversationCard } from './crm-conversation-card';
import type { CRMKanbanColumnProps } from '@/types/crm';
import { useMemo } from 'react';

/**
 * CRMKanbanColumn - Coluna do Kanban representando uma tag
 *
 * Princípios SOLID:
 * - Single Responsibility: Renderiza uma coluna com seus cards
 * - Open/Closed: Extensível via props, fechado para modificação
 * - Liskov Substitution: Pode ser usada em qualquer grid de colunas
 *
 * Features:
 * - Header com nome da tag e contador
 * - Lista scrollable de cards
 * - Filtro por status de conversa
 * - Empty state quando não há conversas
 * - Indicador para tags inativas
 */
export function CRMKanbanColumn({
  tag,
  conversations,
  currentFilter,
}: CRMKanbanColumnProps) {
  // Filtrar conversas desta coluna que possuem esta tag
  const conversationsInThisColumn = useMemo(() => {
    return conversations.filter((conv) => {
      // Verificar se a conversa tem esta tag
      const hasTag = conv.conversation_tags?.some((ct) => ct.tag.id === tag.id);

      if (!hasTag) return false;

      // Aplicar filtro de status
      if (currentFilter === 'all') return true;

      return conv.status === currentFilter;
    });
  }, [conversations, tag.id, currentFilter]);

  const count = conversationsInThisColumn.length;

  return (
    <div className="flex flex-col w-80 border rounded-lg bg-card flex-shrink-0">
      {/* Header da coluna */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm truncate" title={tag.tag_name}>
            {tag.tag_name}
          </h3>
          {!tag.active && (
            <span className="text-xs text-muted-foreground ml-2">(Inativa)</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {count} {count === 1 ? 'conversa' : 'conversas'}
        </p>
      </div>

      {/* Body da coluna - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 scroll-smooth max-h-[calc(100vh-280px)]">
        {count === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">📭</p>
            <p className="text-xs mt-2">
              {tag.active ? 'Nenhuma conversa com esta tag' : 'Tag inativa'}
            </p>
          </div>
        ) : (
          conversationsInThisColumn.map((conversation) => (
            <CRMConversationCard
              key={conversation.id}
              conversation={conversation}
            />
          ))
        )}
      </div>
    </div>
  );
}
