'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Trash2, MessageSquare, PhoneForwarded, XCircle, Clock } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
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

const actionTypeIcons: Record<string, typeof MessageSquare> = {
  send_message: MessageSquare,
  close_conversation: XCircle,
  transfer_to_human: PhoneForwarded,
};

const actionTypeColors: Record<string, string> = {
  send_message: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  close_conversation: 'bg-red-500/10 text-red-600 dark:text-red-400',
  transfer_to_human: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
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
  const startTime = form.watch(`steps.${index}.start_time`);
  const endTime = form.watch(`steps.${index}.end_time`);

  const Icon = actionTypeIcons[actionType] || MessageSquare;
  const iconColor = actionTypeColors[actionType] || 'bg-muted text-muted-foreground';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group rounded-xl border bg-card shadow-sm transition-all hover:shadow-md',
        isDragging && 'opacity-50 ring-2 ring-primary shadow-lg',
        isExpanded && 'ring-1 ring-border'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <div {...attributes} {...listeners} className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DragHandle />
        </div>

        {/* Step Number + Icon */}
        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>

        {/* Info */}
        <button
          type="button"
          onClick={onToggleExpanded}
          className="flex-1 min-w-0 text-left"
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Etapa {index + 1}</span>
            <Badge variant="outline" className="text-xs font-normal gap-1">
              <Clock className="h-3 w-3" />
              {waitTime || '?'}min
            </Badge>
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {actionTypeLabels[actionType] || actionType}
            </span>
            {startTime && endTime && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                {startTime}-{endTime}
              </span>
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onRemove}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={onToggleExpanded}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Campos expandidos */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4 space-y-4">
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
                      placeholder="Deixe vazio para o agente IA gerar automaticamente..."
                      className="min-h-[80px] resize-none"
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
  );
}
