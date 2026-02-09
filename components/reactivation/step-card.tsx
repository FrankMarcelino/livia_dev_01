'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { DragHandle } from '@/components/agents/sortable/drag-handle';
import { StepTagSelector } from './step-tag-selector';
import type { ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';

interface StepCardProps {
  id: string;
  index: number;
  form: UseFormReturn<ReactivationFormDataValidated>;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  availableTags: { id: string; tag_name: string; tag_type: string; color: string | null }[];
}

const actionTypeLabels: Record<string, string> = {
  send_message: 'Enviar Mensagem',
  close_conversation: 'Encerrar Conversa',
  transfer_to_human: 'Transferir para Humano',
};

export function StepCard({
  id,
  index,
  form,
  onRemove,
  isExpanded,
  onToggleExpanded,
  availableTags,
}: StepCardProps) {
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

  const actionType = form.watch(`steps.${index}.action_type`);
  const waitTime = form.watch(`steps.${index}.wait_time_minutes`);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'border rounded-lg p-4 bg-card transition-all',
        isDragging && 'opacity-50 ring-2 ring-primary'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="mt-1">
          <DragHandle />
        </div>

        {/* Expand/Collapse */}
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

        {/* Conteudo */}
        <div className="flex-1 min-w-0">
          {/* Header colapsado */}
          <button
            type="button"
            onClick={onToggleExpanded}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2 text-sm">
              <span className="font-semibold text-muted-foreground">#{index + 1}</span>
              <span className="text-muted-foreground">|</span>
              <span>{waitTime || '?'}min</span>
              <span className="text-muted-foreground">&rarr;</span>
              <span className="font-medium">
                {actionTypeLabels[actionType] || actionType}
              </span>
            </div>
          </button>

          {/* Campos expandidos */}
          {isExpanded && (
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Tempo de espera */}
                <FormField
                  control={form.control}
                  name={`steps.${index}.wait_time_minutes`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tempo de espera (minutos)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={10080}
                          placeholder="30"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? undefined : Number(val));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tipo de acao */}
                <FormField
                  control={form.control}
                  name={`steps.${index}.action_type`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Acao</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(actionTypeLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Mensagem (condicional) */}
              {actionType === 'send_message' && (
                <FormField
                  control={form.control}
                  name={`steps.${index}.action_parameter`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mensagem</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite a mensagem de reativacao..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Janela de horario */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name={`steps.${index}.start_time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario inicio (opcional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`steps.${index}.end_time`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario fim (opcional)</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Tag Selector */}
              <StepTagSelector
                form={form}
                stepIndex={index}
                availableTags={availableTags}
              />
            </div>
          )}
        </div>

        {/* Botao Remover */}
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
