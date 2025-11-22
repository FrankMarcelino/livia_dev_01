'use client';

import { useState, useEffect } from 'react';
import { Zap, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { replaceQuickReplyVariables } from '@/lib/utils/quick-replies';
import type { QuickReply } from '@/types/livechat';

interface QuickRepliesPanelProps {
  conversationId: string;
  tenantId: string;
  contactName: string;
  onSelect: (message: string) => void;
  disabled?: boolean;
}

export function QuickRepliesPanel({
  conversationId,
  tenantId,
  contactName,
  onSelect,
  disabled = false,
}: QuickRepliesPanelProps) {
  const [open, setOpen] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Carregar quick replies ao abrir o popover
  useEffect(() => {
    const loadQuickReplies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/quick-replies?tenantId=${tenantId}`
        );
        if (!response.ok) throw new Error('Erro ao carregar quick replies');

        const data = await response.json();
        setQuickReplies(data.data || []);
      } catch (error) {
        console.error('Erro ao carregar quick replies:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open && quickReplies.length === 0) {
      loadQuickReplies();
    }
  }, [open, tenantId, quickReplies.length]);

  const handleSelect = (quickReply: QuickReply) => {
    // Substituir variáveis dinâmicas
    const processedMessage = replaceQuickReplyVariables(quickReply.message, {
      contactName,
      conversationId,
    });

    // Inserir mensagem no input
    onSelect(processedMessage);

    // Incrementar contador de uso (fire-and-forget)
    fetch('/api/quick-replies/usage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quickReplyId: quickReply.id,
        tenantId,
      }),
    }).catch((error) => {
      console.error('Erro ao registrar uso:', error);
    });

    // Fechar popover
    setOpen(false);
    setSearch('');
  };

  // Filtrar quick replies baseado na busca
  const filteredReplies = quickReplies.filter((reply) => {
    const searchLower = search.toLowerCase();
    return (
      reply.title.toLowerCase().includes(searchLower) ||
      reply.message.toLowerCase().includes(searchLower)
    );
  });

  // Top 3 mais usadas
  const top3Ids = quickReplies
    .slice(0, 3)
    .map((reply) => reply.id);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={disabled}
          title="Quick Replies (Respostas Rápidas)"
          className="h-[60px] w-[60px]"
        >
          <Zap className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0"
        align="start"
        side="top"
      >
        <Command shouldFilter={false}>
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 opacity-50" />
            <input
              placeholder="Buscar quick reply..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            {isLoading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Carregando...
              </div>
            ) : filteredReplies.length === 0 ? (
              <CommandEmpty>
                {search
                  ? 'Nenhuma resposta rápida encontrada.'
                  : 'Nenhuma resposta rápida cadastrada.'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {filteredReplies.map((reply) => {
                  const isPopular = top3Ids.includes(reply.id);

                  return (
                    <CommandItem
                      key={reply.id}
                      onSelect={() => handleSelect(reply)}
                      className="flex flex-col items-start gap-1 py-3"
                    >
                      <div className="flex items-center gap-2 w-full">
                        {reply.icon && (
                          <span className="text-lg">{reply.icon}</span>
                        )}
                        <span className="font-medium">{reply.title}</span>
                        {isPopular && (
                          <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Popular
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground line-clamp-2">
                        {reply.message}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
