// Sortable Sub-Instruction Component
// Feature: Nested Drag and Drop para Sub-instruções

'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DragHandle } from './drag-handle';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';

interface SortableSubInstructionProps {
  id: string;
  stepIndex: number;
  subIndex: number;
  fieldName: 'limitations' | 'instructions' | 'guide_line' | 'rules' | 'others_instructions';
  form: UseFormReturn<AgentPromptFormData>;
  onRemove: () => void;
}

export function SortableSubInstruction({
  id,
  stepIndex,
  subIndex,
  fieldName,
  form,
  onRemove,
}: SortableSubInstructionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const activeValue = form.watch(`${fieldName}.${stepIndex}.sub.${subIndex}.active`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-start gap-2 p-2 rounded border bg-card transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary',
      )}
    >
      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="mt-2">
        <DragHandle />
      </div>

      {/* Textarea de conteúdo */}
      <div className="flex-1">
        <Textarea
          placeholder="Conteúdo da sub-instrução..."
          rows={2}
          {...form.register(`${fieldName}.${stepIndex}.sub.${subIndex}.content`)}
          className="text-sm"
        />
      </div>

      {/* Switch Ativo */}
      <div className="flex items-center gap-2 mt-2">
        <Switch
          checked={activeValue ?? true}
          onCheckedChange={(checked) =>
            form.setValue(`${fieldName}.${stepIndex}.sub.${subIndex}.active`, checked)
          }
        />
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {activeValue ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      {/* Botão de Remover */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-1"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
