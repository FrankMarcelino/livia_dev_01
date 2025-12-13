// Seção: Regras com Drag and Drop
// Feature: Meus Agentes IA - DnD Implementation

'use client';

import { useState } from 'react';
import { useFieldArray } from 'react-hook-form';
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import type { GuidelineStep } from '@/types/agents';
import { SortableGuidelineStep } from '../sortable/sortable-guideline-step';

interface RulesSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function RulesSectionV2({ form }: RulesSectionProps) {
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: 'rules',
  });

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((field) => field.id === active.id);
      const newIndex = fields.findIndex((field) => field.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        move(oldIndex, newIndex);
      }
    }
  }

  function addStep() {
    const newStep: GuidelineStep = {
      title: '',
      type: 'markdown',
      active: true,
      sub: [],
    };
    append(newStep);
    const newFields = form.getValues('rules');
    if (newFields && newFields.length > 0) {
      setExpandedSteps(prev => new Set([...prev, String(newFields.length - 1)]));
    }
  }

  function toggleExpanded(fieldId: string) {
    setExpandedSteps(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fieldId)) {
        newSet.delete(fieldId);
      } else {
        newSet.add(fieldId);
      }
      return newSet;
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Regras</h3>
        <p className="text-sm text-muted-foreground">
          Defina as regras do agent. Arraste para reordenar.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={fields.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {fields.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Nenhuma regra configurada. Clique em "Adicionar Regra" para começar.
              </p>
            )}

            {fields.map((field, index) => (
              <SortableGuidelineStep
                key={field.id}
                id={field.id}
                index={index}
                fieldName="rules"
                form={form}
                onRemove={() => remove(index)}
                isExpanded={expandedSteps.has(field.id)}
                onToggleExpanded={() => toggleExpanded(field.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        onClick={addStep}
        variant="outline"
        className="w-full"
      >
        <Plus className="w-4 h-4 mr-2" />
        Adicionar Regra
      </Button>
    </div>
  );
}
