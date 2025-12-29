'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TagBadge } from '@/components/livechat/tag-badge';
import { toast } from 'sonner';
import type { Tag } from '@/types/database-helpers';
import { TagTypeSection } from './tag-type-section';

export type TagSelectorMode = 'assign' | 'filter';

interface TagSelectorProps {
  // Modo de operação
  mode: TagSelectorMode;

  // Tags selecionadas (assign: tags da conversa, filter: tags do filtro)
  selectedTags: Tag[];

  // Todas as tags disponíveis do neurocore
  availableTags: Tag[];

  // Callback quando tag é adicionada/removida
  onTagToggle: (tagId: string) => void | Promise<void>;

  // Loading state global
  isLoading?: boolean;

  // Desabilitar interação
  disabled?: boolean;

  // Placeholder do botão
  placeholder?: string;

  // ID da conversa (apenas para modo assign)
  conversationId?: string;

  // ID do tenant (apenas para modo assign)
  tenantId?: string;
}

export function TagSelector({
  mode,
  selectedTags,
  availableTags,
  onTagToggle,
  isLoading = false,
  disabled = false,
  placeholder,
  conversationId,
  tenantId,
}: TagSelectorProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTags, setLoadingTags] = useState<Set<string>>(new Set());

  // Agrupar tags disponíveis por tipo
  const tagsByType = {
    description: availableTags.filter(t => t.tag_type === 'description'),
    success: availableTags.filter(t => t.tag_type === 'success'),
    fail: availableTags.filter(t => t.tag_type === 'fail'),
  };

  // IDs das tags selecionadas para busca rápida
  const selectedTagIds = new Set(selectedTags.map(t => t.id));

  // Filtrar tags disponíveis (remover as já selecionadas em modo assign)
  const getAvailableTagsForType = (type: 'description' | 'success' | 'fail') => {
    const tags = tagsByType[type];
    if (mode === 'assign') {
      return tags.filter(t => !selectedTagIds.has(t.id));
    }
    return tags;
  };

  // Handle toggle de tag
  const handleTagToggle = async (tagId: string) => {
    // Se já está carregando, ignorar
    if (loadingTags.has(tagId) || isLoading) return;

    if (mode === 'assign') {
      // Modo assign: chamar API
      setLoadingTags(prev => new Set([...prev, tagId]));

      try {
        // Verificar se está adicionando ou removendo
        const isRemoving = selectedTagIds.has(tagId);

        // Chamar API
        const response = await fetch('/api/conversations/update-tag', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId,
            tagId: isRemoving ? null : tagId,
            tenantId,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erro ao atualizar tag');
        }

        toast.success(data.message);

        // Revalidar
        router.refresh();

        // Fechar popover após adicionar tag (opcional)
        if (!isRemoving) {
          // setIsOpen(false);
        }
      } catch (error) {
        console.error('[TagSelector] Error:', error);
        toast.error(
          error instanceof Error ? error.message : 'Erro ao atualizar tag'
        );
      } finally {
        setLoadingTags(prev => {
          const next = new Set(prev);
          next.delete(tagId);
          return next;
        });
      }
    } else {
      // Modo filter: apenas callback local
      onTagToggle(tagId);
    }
  };

  // Placeholder padrão
  const defaultPlaceholder = mode === 'assign'
    ? 'Adicionar tags'
    : 'Filtrar por tags';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 flex-wrap border rounded-lg p-2 min-h-[44px] cursor-pointer hover:bg-accent/50 transition-colors">
          {/* Tags selecionadas */}
          {selectedTags.length > 0 ? (
            selectedTags.map((tag) => (
              <div
                key={tag.id}
                className="group relative"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagToggle(tag.id);
                }}
              >
                {loadingTags.has(tag.id) ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-muted">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="text-xs">{tag.tag_name}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-destructive/10 transition-colors cursor-pointer">
                    <TagBadge tag={tag} size="sm" />
                    <X className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            ))
          ) : null}

          {/* Botão adicionar */}
          <Button
            variant="ghost"
            size="sm"
            className="h-auto py-1 px-2"
            disabled={disabled || isLoading}
          >
            <Plus className="h-4 w-4 mr-1" />
            <span className="text-sm">{placeholder || defaultPlaceholder}</span>
          </Button>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <h4 className="font-semibold text-sm">
            {mode === 'assign' ? 'Tags Disponíveis' : 'Filtrar por Tags'}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === 'assign'
              ? 'Clique para adicionar à conversa'
              : 'Selecione as tags para filtrar'}
          </p>
        </div>

        <ScrollArea className="h-[400px]">
          <div className="p-3 space-y-4">
            {/* Seção: Intenção */}
            <TagTypeSection
              type="description"
              label="Intenção"
              tags={getAvailableTagsForType('description')}
              selectedTagIds={selectedTagIds}
              loadingTags={loadingTags}
              mode={mode}
              onTagClick={handleTagToggle}
            />

            {/* Separator */}
            {tagsByType.success.length > 0 && (
              <Separator className="my-2" />
            )}

            {/* Seção: Checkout */}
            <TagTypeSection
              type="success"
              label="Checkout"
              tags={getAvailableTagsForType('success')}
              selectedTagIds={selectedTagIds}
              loadingTags={loadingTags}
              mode={mode}
              onTagClick={handleTagToggle}
            />

            {/* Separator */}
            {tagsByType.fail.length > 0 && (
              <Separator className="my-2" />
            )}

            {/* Seção: Falha */}
            <TagTypeSection
              type="fail"
              label="Falha"
              tags={getAvailableTagsForType('fail')}
              selectedTagIds={selectedTagIds}
              loadingTags={loadingTags}
              mode={mode}
              onTagClick={handleTagToggle}
            />

            {/* Mensagem se não houver tags */}
            {availableTags.length === 0 && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Nenhuma tag disponível
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
