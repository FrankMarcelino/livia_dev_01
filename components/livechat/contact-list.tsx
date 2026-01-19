'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ContactItem } from './contact-item';
import { TagSelector } from '@/components/tags/tag-selector';
import { Search, MessageCircle } from 'lucide-react';
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
    'ia' | 'manual' | 'closed'
  >('ia');
  const [selectedTagIds, setSelectedTagIds] = useState<Set<string>>(new Set());
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Filtros
  const filteredConversations = conversations.filter((conversation) => {
    const displayName = getContactDisplayName(
      conversation.contact.name,
      conversation.contact.phone
    );
    const matchesSearch = displayName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());

    // Lógica de filtro baseada em ia_active
    let matchesStatus = false;
    if (statusFilter === 'ia') {
      // IA Ativa: conversas com IA respondendo
      matchesStatus = conversation.ia_active && conversation.status !== 'closed';
    } else if (statusFilter === 'manual') {
      // Modo Manual: TODAS conversas sem IA (inclui open com ia_active=false)
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

    // Filtro de não lidas (UX fluida: mantém conversa selecionada visível)
    // Só se aplica no modo manual quando toggle está ativo
    const matchesUnread =
      statusFilter !== 'manual' || // Não aplica fora do modo manual
      !showOnlyUnread || // Toggle desligado = mostra todas
      conversation.has_unread || // Tem não lidas
      conversation.id === selectedConversationId; // É a selecionada (UX fluida)

    return matchesSearch && matchesStatus && matchesTags && matchesUnread;
  });

  // Contadores de status (consolidados)
  const statusCounts = {
    ia: conversations.filter((c) => c.ia_active && c.status !== 'closed')
      .length,
    manual: conversations.filter((c) => !c.ia_active && c.status !== 'closed')
      .length,
    closed: conversations.filter((c) => c.status === 'closed').length,
  };

  // Contador de não lidas no modo manual
  const unreadInManualCount = conversations.filter(
    (c) => !c.ia_active && c.status !== 'closed' && c.has_unread
  ).length;

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
            {unreadInManualCount > 0 && (
              <MessageCircle className="ml-1 h-3.5 w-3.5 fill-green-500 text-green-500" />
            )}
          </Badge>
          <Badge
            variant={statusFilter === 'closed' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setStatusFilter('closed')}
          >
            Encerradas ({statusCounts.closed})
          </Badge>
        </div>

        {/* Toggle de não lidas - só aparece no modo manual */}
        {statusFilter === 'manual' && (
          <>
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
              <Label htmlFor="unread-toggle" className="text-sm text-muted-foreground">
                Apenas não lidas
              </Label>
              <Switch
                id="unread-toggle"
                checked={showOnlyUnread}
                onCheckedChange={setShowOnlyUnread}
              />
            </div>
          </>
        )}

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
