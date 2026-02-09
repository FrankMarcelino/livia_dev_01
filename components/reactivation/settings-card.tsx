'use client';

import type { UseFormReturn } from 'react-hook-form';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import type { ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';

interface SettingsCardProps {
  form: UseFormReturn<ReactivationFormDataValidated>;
}

const fallbackActionLabels: Record<string, string> = {
  end_conversation: 'Encerrar Conversa',
  transfer_to_human: 'Transferir para Humano',
  do_nothing: 'Nao fazer nada',
};

export function SettingsCard({ form }: SettingsCardProps) {
  const exhaustedAction = form.watch('settings.exhausted_action');
  const maxWindowAction = form.watch('settings.max_window_action');

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configuracoes Gerais</CardTitle>
        <CardDescription>
          Defina o comportamento quando todas as etapas forem executadas ou a janela maxima for atingida.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Secao: Etapas Esgotadas */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Etapas Esgotadas</h3>
          <p className="text-xs text-muted-foreground">
            O que fazer quando todas as etapas de reativacao forem executadas sem resposta do contato.
          </p>

          <FormField
            control={form.control}
            name="settings.exhausted_action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acao</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma acao" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(fallbackActionLabels).map(([value, label]) => (
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

          {exhaustedAction !== 'do_nothing' && (
            <FormField
              control={form.control}
              name="settings.exhausted_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mensagem enviada antes de executar a acao..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <Separator />

        {/* Secao: Janela Maxima */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold">Janela Maxima de Reativacao</h3>
          <p className="text-xs text-muted-foreground">
            Tempo maximo total para tentar reativar uma conversa. Deixe em branco para nao limitar.
          </p>

          <FormField
            control={form.control}
            name="settings.max_reactivation_window_minutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tempo Maximo (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ex: 1440 (24h)"
                    value={field.value ?? ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      field.onChange(val === '' ? null : Number(val));
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Exemplos: 60 (1h), 1440 (24h), 4320 (3 dias)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="settings.max_window_action"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Acao ao atingir janela</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione uma acao" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(fallbackActionLabels).map(([value, label]) => (
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

          {maxWindowAction !== 'do_nothing' && (
            <FormField
              control={form.control}
              name="settings.max_window_message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mensagem (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Mensagem enviada antes de executar a acao..."
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
