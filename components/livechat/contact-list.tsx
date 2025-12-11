'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactItem } from './contact-item';
import { TagBadge } from './tag-badge';
import { Search } from 'lucide-react';
import { useRealtimeConversations } from '@/lib/hooks/use-realtime-conversations';
import type { ConversationWithContact } from '@/types/livechat';
import type { ConversationStatus, Tag } from '@/types/database-helpers';

interface ContactListProps {
  initialConversations: ConversationWithContact[];
  selectedConversationId?: string;
  tenantId: string;
  onConversationClick?: (conversationId: string) => void;
  categories: Tag[];
}

export function ContactList({
  initialConversations,
  selectedConversationId,
  tenantId,
  onConversationClick,
  categories,
}: ContactListProps) {
  // ✅ Hook simplificado - trabalha direto com conversas (sem transformações)
  const { conversations } = useRealtimeConversations(tenantId, initialConversations);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<ConversationStatus | 'all'>('open');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');

  // Filtros
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.contact.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' || conversation.status === statusFilter;

    const matchesCategory =
      categoryFilter === 'all' || conversation.category?.id === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Contadores de status
  const statusCounts = {
    all: conversations.length,
    open: conversations.filter((c) => c.status === 'open').length,
    paused: conversations.filter((c) => c.status === 'paused').length,
    closed: conversations.filter((c) => c.status === 'closed').length,
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('open')}
          >
            Ativas ({statusCounts.open})
          </Badge>
          <Badge
            variant={statusFilter === 'paused' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('paused')}
          >
            Aguardando ({statusCounts.paused})
          </Badge>
          <Badge
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('closed')}
          >
            Encerradas ({statusCounts.closed})
          </Badge>
          <Badge
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            Todas ({statusCounts.all})
          </Badge>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 flex-wrap items-center">
            <span className="text-xs text-muted-foreground">Categorias:</span>
            <Badge
              variant={categoryFilter === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategoryFilter('all')}
            >
              Todas
            </Badge>
            {categories.map((category) => (
              <div
                key={category.id}
                className="cursor-pointer"
                onClick={() => setCategoryFilter(category.id)}
              >
                <TagBadge
                  tag={category}
                  size="sm"
                  className={
                    categoryFilter === category.id
                      ? 'ring-2 ring-offset-1 ring-primary'
                      : 'opacity-70 hover:opacity-100'
                  }
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'Nenhuma conversa encontrada'
              : 'Nenhuma conversa ativa'}
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <ContactItem
              key={conversation.id}
              conversation={conversation}
              isSelected={selectedConversationId === conversation.id}
              onClick={() => {
                if (onConversationClick) {
                  onConversationClick(conversation.id);
                } else {
                  router.push(`/livechat?conversation=${conversation.id}`);
                }
              }}
            />
          ))
        )}
      </div>
    </div>
  );
}
