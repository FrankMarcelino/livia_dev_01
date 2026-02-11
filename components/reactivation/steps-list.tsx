'use client';

import { useState } from 'react';
import type { UseFormReturn, UseFieldArrayReturn } from 'react-hook-form';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { Plus, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepCard } from './step-card';
import type { ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';

interface StepsListProps {
  form: UseFormReturn<ReactivationFormDataValidated>;
  fieldArray: UseFieldArrayReturn<ReactivationFormDataValidated, 'steps'>;
  availableTags: { id: string; tag_name: string; tag_type: string; color: string | null }[];
}

export function StepsList({ form, fieldArray, availableTags }: StepsListProps) {
  const { fields, append, remove, move } = fieldArray;
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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

  function toggleExpanded(id: string) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function addStep() {
    append({
      wait_time_minutes: 30,
      action_type: 'send_message',
      action_parameter: '',
      start_time: '',
      end_time: '',
      tag_ids: [],
    });
  }

  // Erro global do array de steps
  const stepsError = form.formState.errors.steps;
  const stepsRootError = stepsError?.root?.message || (stepsError as { message?: string })?.message;

  return (
    <div className="space-y-4">
      {/* Header da lista */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Sequencia de etapas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Arraste para reordenar a sequencia de acoes.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Adicionar Etapa
        </Button>
      </div>

      {stepsRootError && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3">
          <p className="text-destructive text-sm">{stepsRootError}</p>
        </div>
      )}

      {fields.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-16 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-4">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="font-medium">Nenhuma etapa configurada</p>
          <p className="text-sm mt-1">
            Clique em &quot;Adicionar Etapa&quot; para comecar.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={fields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {fields.map((field, index) => (
                <StepCard
                  key={field.id}
                  id={field.id}
                  index={index}
                  form={form}
                  onRemove={() => remove(index)}
                  isExpanded={expandedSteps.has(field.id)}
                  onToggleExpanded={() => toggleExpanded(field.id)}
                  availableTags={availableTags}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
