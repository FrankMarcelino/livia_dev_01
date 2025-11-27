'use client';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { replaceQuickReplyVariables } from '@/lib/utils/quick-replies';
import { useQuickRepliesCache } from '@/hooks/use-quick-replies-cache';
import type { QuickReply } from '@/types/livechat';
import type { QuickReplyMode } from '@/hooks/use-quick-reply-command';
import { toast } from 'sonner';

interface QuickReplyCommandProps {
  isOpen: boolean;
  onClose: () => void;
  mode: QuickReplyMode;
  tenantId: string;
  contactName: string;
  conversationId: string;
  onSelect: (content: string, quickReplyId: string) => void;
}

/**
 * Command Palette para seleção de respostas rápidas.
 *
 * Modos:
 * - 'all': Exibe todas as respostas rápidas ativas
 * - 'popular': Exibe apenas as 5 respostas mais populares
 */
export function QuickReplyCommand({
  isOpen,
  onClose,
  mode,
  tenantId,
  contactName,
  conversationId,
  onSelect,
}: QuickReplyCommandProps) {
  // Hook otimizado com cache inteligente
  const {
    quickReplies: allQuickReplies,
    popularQuickReplies,
    isLoading,
    isError,
  } = useQuickRepliesCache({
    tenantId,
    enabled: isOpen, // Só carrega quando command está aberto
    onError: (error) => {
      console.error('Erro ao carregar respostas rápidas:', error);
      toast.error('Erro ao carregar respostas rápidas');
    },
  });

  // Seleciona dados baseado no modo
  const quickReplies = mode === 'popular' ? popularQuickReplies : allQuickReplies;

  const handleSelect = (quickReply: QuickReply) => {
    // Processa variáveis no conteúdo
    const processedContent = replaceQuickReplyVariables(quickReply.content, {
      contactName,
      conversationId,
    });

    // Chama callback de seleção
    onSelect(processedContent, quickReply.id);

    // Incrementa contador de uso (fire-and-forget)
    incrementUsage(quickReply.id);

    // Fecha o command
    onClose();
  };

  const incrementUsage = async (quickReplyId: string) => {
    try {
      await fetch('/api/quick-replies/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quickReplyId,
          tenantId,
        }),
      });
    } catch (error) {
      // Fire-and-forget, não mostra erro ao usuário
      console.error('Erro ao incrementar uso:', error);
    }
  };

  const getTitle = () => {
    if (mode === 'popular') {
      return 'Respostas Rápidas Populares';
    }
    return 'Respostas Rápidas';
  };

  const getDescription = () => {
    if (mode === 'popular') {
      return 'Selecione uma das respostas mais utilizadas';
    }
    return 'Busque e selecione uma resposta rápida';
  };

  const getGroupLabel = () => {
    if (mode === 'popular') {
      return '⚡ Mais Utilizadas';
    }
    return 'Todas as Respostas';
  };

  return (
    <CommandDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={getTitle()}
      description={getDescription()}
    >
      <CommandInput
        placeholder={
          mode === 'popular'
            ? 'Buscar nas populares...'
            : 'Buscar resposta rápida...'
        }
      />
      <CommandList>
        {isLoading ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            Carregando...
          </div>
        ) : isError ? (
          <div className="py-6 text-center text-sm text-destructive">
            Erro ao carregar respostas. Tente novamente.
          </div>
        ) : (
          <>
            <CommandEmpty>Nenhuma resposta encontrada.</CommandEmpty>
            <CommandGroup heading={getGroupLabel()}>
              {quickReplies.map((reply) => (
                <CommandItem
                  key={reply.id}
                  value={`${reply.title} ${reply.content}`}
                  onSelect={() => handleSelect(reply)}
                  className="flex items-start gap-2 cursor-pointer"
                >
                  {/* Emoji ou ícone padrão */}
                  <span className="text-lg flex-shrink-0 mt-0.5">
                    {reply.emoji || (mode === 'popular' ? '⚡' : '💬')}
                  </span>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reply.title}</span>
                      {mode === 'popular' && (
                        <span className="text-xs text-muted-foreground">
                          {reply.usage_count}x
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {reply.content.length > 60
                        ? `${reply.content.substring(0, 60)}...`
                        : reply.content}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
