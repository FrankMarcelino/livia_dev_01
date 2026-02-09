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
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Etapas de Reativacao</CardTitle>
            <CardDescription>
              Configure a sequencia de acoes executadas quando o contato nao responde.
              Arraste para reordenar.
            </CardDescription>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addStep}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar Etapa
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {stepsRootError && (
          <p className="text-destructive text-sm mb-4">{stepsRootError}</p>
        )}

        {fields.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>Nenhuma etapa configurada.</p>
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
      </CardContent>
    </Card>
  );
}
