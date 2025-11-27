'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactItem } from './contact-item';
import { Search } from 'lucide-react';
import { useRealtimeConversations } from '@/lib/hooks/use-realtime-conversations';
import type { ConversationWithContact } from '@/types/livechat';
import type { ConversationStatus } from '@/types/database';

interface ContactListProps {
  initialConversations: ConversationWithContact[];
  selectedConversationId?: string;
  tenantId: string;
}

export function ContactList({
  initialConversations,
  selectedConversationId,
  tenantId,
}: ContactListProps) {
  // ✅ Hook simplificado - trabalha direto com conversas (sem transformações)
  const { conversations } = useRealtimeConversations(tenantId, initialConversations);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<ConversationStatus | 'open'>('open');

  // Filtros
  const filteredConversations = conversations.filter((conversation) => {
    const matchesSearch = conversation.contact.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    return matchesSearch && conversation.status === statusFilter;
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
              onClick={() => router.push(`/livechat?conversation=${conversation.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
