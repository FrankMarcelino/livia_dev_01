'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactItem } from './contact-item';
import { TagSelector } from '@/components/tags/tag-selector';
import { Search } from 'lucide-react';
import { useRealtimeConversations } from '@/lib/hooks/use-realtime-conversations';
import { getContactDisplayName } from '@/lib/utils/contact-helpers';
import type { ConversationWithContact } from '@/types/livechat';
import type { Tag } from '@/types/database-helpers';

interface ContactListProps {
  initialConversations: ConversationWithContact[];
  selectedConversationId?: string;
  tenantId: string;
  onConversationClick?: (conversationId: string) => void;
  allTags: Tag[];
}

export function ContactList({
  initialConversations,
  selectedConversationId,
  tenantId,
  onConversationClick,
  allTags,
}: ContactListProps) {
  // ✅ Hook simplificado - trabalha direto com conversas (sem transformações)
  const { conversations } = useRealtimeConversations(tenantId, initialConversations);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ia' | 'manual' | 'closed' | 'all'
  >('ia');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());

  // Filtros
  const filteredConversations = conversations.filter((conversation) => {
    const displayName = getContactDisplayName(
      conversation.contact.name,
      conversation.contact.phone
    );
    const matchesSearch = displayName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Nova lógica de filtro baseada em ia_active
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'ia') {
      // IA Ativa: conversas com IA respondendo (geralmente open, mas pode ter outros status)
      matchesStatus = conversation.ia_active && conversation.status !== 'closed';
    } else if (statusFilter === 'manual') {
      // Modo Manual: TODAS conversas sem IA (inclui open com ia_active=false E paused)
      matchesStatus = !conversation.ia_active && conversation.status !== 'closed';
    } else if (statusFilter === 'closed') {
      // Encerradas
      matchesStatus = conversation.status === 'closed';
    }

    // Filtro de tags: se nenhuma tag selecionada, mostra todas
    // Se há tags selecionadas, mostra apenas conversas que têm PELO MENOS UMA das tags
    const matchesTags =
      selectedTagIds.size === 0 ||
      (conversation.conversation_tags?.some((ct) =>
        selectedTagIds.has(ct.tag.id)
      ) ?? false);

    return matchesSearch && matchesStatus && matchesTags;
  });

  // Contadores de status (consolidados)
  const statusCounts = {
    all: conversations.length,
    ia: conversations.filter((c) => c.ia_active && c.status !== 'closed')
      .length,
    manual: conversations.filter((c) => !c.ia_active && c.status !== 'closed')
      .length,
    closed: conversations.filter((c) => c.status === 'closed').length,
  };

  // Handler para toggle de tags (modo filtro)
  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  };

  // Converter selectedTagIds para array de Tags para o TagSelector
  const selectedTags = allTags.filter((tag) => selectedTagIds.has(tag.id));

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
            variant={statusFilter === 'ia' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('ia')}
          >
            IA ({statusCounts.ia})
          </Badge>
          <Badge
            variant={statusFilter === 'manual' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('manual')}
          >
            Modo Manual ({statusCounts.manual})
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

        {/* Filtro de tags */}
        {allTags.length > 0 && (
          <div>
            <span className="text-xs text-muted-foreground mb-2 block">
              Filtrar por Tags:
            </span>
            <TagSelector
              mode="filter"
              selectedTags={selectedTags}
              availableTags={allTags}
              onTagToggle={handleTagToggle}
              placeholder="Filtrar por tags"
            />
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
