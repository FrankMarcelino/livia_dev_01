// Sortable Guideline Step Component
// Feature: Drag and Drop para Prompts

'use client';

import { useFieldArray } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ChevronDown, ChevronRight, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { DragHandle } from './drag-handle';
import { SortableSubInstruction } from './sortable-sub-instruction';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import type { GuidelineSubInstruction } from '@/types/agents';

interface SortableGuidelineStepProps {
  id: string;
  index: number;
  fieldName: 'limitations' | 'instructions' | 'guide_line' | 'rules' | 'others_instructions';
  form: UseFormReturn<AgentPromptFormData>;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}

export function SortableGuidelineStep({
  id,
  index,
  fieldName,
  form,
  onRemove,
  isExpanded,
  onToggleExpanded,
}: SortableGuidelineStepProps) {
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

  const titleValue = form.watch(`${fieldName}.${index}.title`);
  const typeValue = form.watch(`${fieldName}.${index}.type`);
  const activeValue = form.watch(`${fieldName}.${index}.active`);

  // useFieldArray para sub-instruções
  const { fields: subFields, append: appendSub, remove: removeSub, move: moveSub } = useFieldArray({
    control: form.control,
    name: `${fieldName}.${index}.sub`,
  });

  // Sensors para nested DnD
  const subSensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  function handleSubDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = subFields.findIndex((field) => field.id === active.id);
      const newIndex = subFields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        moveSub(oldIndex, newIndex);
      }
    }
  }

  function addSubInstruction() {
    const newSub: GuidelineSubInstruction = {
      content: '',
      active: true,
    };
    appendSub(newSub);
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border rounded-lg p-4 bg-card transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary',
      )}
    >
      {/* Header com drag handle e controles */}
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="mt-1">
          <DragHandle />
        </div>

        {/* Botão de Expandir/Colapsar */}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="mt-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {/* Conteúdo do formulário */}
        <div className="flex-1 space-y-3">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor={`${fieldName}.${index}.title`}>Título</Label>
            <Input
              id={`${fieldName}.${index}.title`}
              placeholder="Digite o título da instrução..."
              {...form.register(`${fieldName}.${index}.title`)}
            />
          </div>

          {/* Tipo e Ativo (lado a lado) */}
          <div className="grid grid-cols-2 gap-3">
            {/* Tipo */}
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                value={typeValue || 'rank'}
                onValueChange={(value) =>
                  form.setValue(`${fieldName}.${index}.type`, value as 'rank' | 'markdown')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Numerado</SelectItem>
                  <SelectItem value="markdown">Markdown</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Ativo */}
            <div className="space-y-1.5">
              <Label>Ativo</Label>
              <div className="flex items-center h-10">
                <Switch
                  checked={activeValue ?? true}
                  onCheckedChange={(checked) =>
                    form.setValue(`${fieldName}.${index}.active`, checked)
                  }
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {activeValue ? 'Sim' : 'Não'}
                </span>
              </div>
            </div>
          </div>

          {/* Sub-instruções (expandível com nested DnD) */}
          {isExpanded && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Sub-instruções ({subFields.length})
                </Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={addSubInstruction}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Adicionar
                </Button>
              </div>

              {subFields.length > 0 ? (
                <DndContext
                  sensors={subSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleSubDragEnd}
                >
                  <SortableContext
                    items={subFields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2 ml-6">
                      {subFields.map((subField, subIndex) => (
                        <SortableSubInstruction
                          key={subField.id}
                          id={subField.id}
                          stepIndex={index}
                          subIndex={subIndex}
                          fieldName={fieldName}
                          form={form}
                          onRemove={() => removeSub(subIndex)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              ) : (
                <p className="text-sm text-muted-foreground ml-6 italic">
                  Nenhuma sub-instrução. Clique em "Adicionar" acima.
                </p>
              )}
            </div>
          )}

          {/* Preview do título quando colapsado */}
          {!isExpanded && titleValue && (
            <p className="text-sm text-muted-foreground truncate">
              {titleValue}
            </p>
          )}
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
    </div>
  );
}
