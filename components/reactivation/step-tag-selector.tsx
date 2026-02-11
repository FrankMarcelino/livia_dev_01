'use client';

import { useMemo, useCallback } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { Plus, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FormLabel } from '@/components/ui/form';
import type { ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';

interface StepTagSelectorProps {
  form: UseFormReturn<ReactivationFormDataValidated>;
  stepIndex: number;
  availableTags: { id: string; tag_name: string; tag_type: string; color: string | null }[];
}

const tagTypeLabels: Record<string, string> = {
  description: 'Intencao',
  success: 'Checkout',
  fail: 'Falha',
};

export function StepTagSelector({ form, stepIndex, availableTags }: StepTagSelectorProps) {
  const rawTagIds = form.watch(`steps.${stepIndex}.tag_ids`);
  const selectedTagIds = useMemo(() => rawTagIds || [], [rawTagIds]);

  const selectedTagIdsSet = useMemo(() => new Set(selectedTagIds), [selectedTagIds]);

  const selectedTags = useMemo(
    () => availableTags.filter((t) => selectedTagIdsSet.has(t.id)),
    [availableTags, selectedTagIdsSet]
  );

  // Agrupar tags disponiveis por tipo
  const tagsByType = useMemo(() => {
    const grouped: Record<string, typeof availableTags> = {};
    for (const tag of availableTags) {
      const type = tag.tag_type || 'other';
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(tag);
    }
    return grouped;
  }, [availableTags]);

  const addTag = useCallback((tagId: string) => {
    const current = form.getValues(`steps.${stepIndex}.tag_ids`) || [];
    if (!current.includes(tagId)) {
      form.setValue(`steps.${stepIndex}.tag_ids`, [...current, tagId]);
    }
  }, [form, stepIndex]);

  const removeTag = useCallback((tagId: string) => {
    const current = form.getValues(`steps.${stepIndex}.tag_ids`) || [];
    form.setValue(`steps.${stepIndex}.tag_ids`, current.filter((id) => id !== tagId));
  }, [form, stepIndex]);

  return (
    <div className="space-y-2">
      <FormLabel>Tags (opcional)</FormLabel>
      <p className="text-xs text-muted-foreground">
        Atribuir tags a conversa quando esta etapa for executada.
      </p>

      {/* Tags selecionadas */}
      <div className="flex flex-wrap gap-1.5">
        {selectedTags.map((tag) => (
          <Badge
            key={tag.id}
            variant="secondary"
            className="gap-1 pr-1"
            style={tag.color ? { backgroundColor: `${tag.color}20`, borderColor: tag.color } : undefined}
          >
            <span className="text-xs">{tag.tag_name}</span>
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}

        {/* Botao adicionar */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-6 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <div className="p-3 border-b">
              <h4 className="font-semibold text-sm">Tags Disponiveis</h4>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="p-3 space-y-3">
                {Object.entries(tagsByType).map(([type, tags], typeIdx) => {
                  const unselectedTags = tags.filter((t) => !selectedTagIdsSet.has(t.id));
                  if (unselectedTags.length === 0) return null;

                  return (
                    <div key={type}>
                      {typeIdx > 0 && <Separator className="mb-3" />}
                      <p className="text-xs font-semibold text-muted-foreground mb-2">
                        {tagTypeLabels[type] || type}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {unselectedTags.map((tag) => (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => addTag(tag.id)}
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs hover:bg-accent transition-colors cursor-pointer"
                            style={tag.color ? { borderColor: tag.color } : undefined}
                          >
                            {tag.color && (
                              <span
                                className="w-2 h-2 rounded-full mr-1.5"
                                style={{ backgroundColor: tag.color }}
                              />
                            )}
                            {tag.tag_name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {availableTags.length === 0 && (
                  <p className="text-center py-4 text-muted-foreground text-sm">
                    Nenhuma tag disponivel
                  </p>
                )}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
