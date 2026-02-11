'use client';

import type { UseFormReturn } from 'react-hook-form';
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
import { StepTagSelector } from './step-tag-selector';
import type { ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';

const actionTypeLabels: Record<string, string> = {
  send_message: 'Enviar Mensagem',
  close_conversation: 'Encerrar Conversa',
  transfer_to_human: 'Transferir para Humano',
};

interface StepCardFieldsProps {
  form: UseFormReturn<ReactivationFormDataValidated>;
  index: number;
  actionType: string;
  availableTags: { id: string; tag_name: string; tag_type: string; color: string | null }[];
}

export function StepCardFields({ form, index, actionType, availableTags }: StepCardFieldsProps) {
  return (
    <div className="border-t bg-muted/20 p-4 space-y-4">
      <div className="grid grid-cols-2 gap-4">
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
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

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

      <StepTagSelector form={form} stepIndex={index} availableTags={availableTags} />
    </div>
  );
}
