'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactItem } from './contact-item';
import { Search } from 'lucide-react';
import type { ContactWithConversations } from '@/types/livechat';
import type { ConversationStatus } from '@/types/database';

interface ContactListProps {
  contacts: ContactWithConversations[];
  selectedContactId?: string;
}

export function ContactList({
  contacts,
  selectedContactId,
}: ContactListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] =
    useState<ConversationStatus | 'all'>('all');

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch = contact.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    if (statusFilter === 'all') return matchesSearch;

    const activeConversation = contact.activeConversations?.[0];
    return matchesSearch && activeConversation?.status === statusFilter;
  });

  const statusCounts = {
    all: contacts.length,
    active: contacts.filter((c) => c.activeConversations?.[0]?.status === 'open')
      .length,
    waiting: contacts.filter((c) => c.activeConversations?.[0]?.status === 'paused')
      .length,
    ended: contacts.filter((c) => c.activeConversations?.[0]?.status === 'closed')
      .length,
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
            variant={statusFilter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('all')}
          >
            Todos ({statusCounts.all})
          </Badge>
          <Badge
            variant={statusFilter === 'open' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('open')}
          >
            Ativas ({statusCounts.active})
          </Badge>
          <Badge
            variant={statusFilter === 'paused' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('paused')}
          >
            Aguardando ({statusCounts.waiting})
          </Badge>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredContacts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery
              ? 'Nenhum contato encontrado'
              : 'Nenhuma conversa ativa'}
          </div>
        ) : (
          filteredContacts.map((contact) => (
            <ContactItem
              key={contact.id}
              contact={contact}
              isSelected={selectedContactId === contact.id}
              onClick={() => router.push(`/livechat?contact=${contact.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
