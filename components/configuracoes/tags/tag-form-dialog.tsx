'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TagForManagement } from '@/lib/queries/tags-crud';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const formSchema = z.object({
  tag_name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  tag_type: z.enum(['description', 'success', 'fail'], {
    message: 'Tipo é obrigatório',
  }),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida'),
  active: z.boolean(),
  prompt_to_ai: z.string().max(2000).optional().nullable(),
  is_category: z.boolean(),
  change_conversation_status: z.string().optional().nullable(),
  send_text: z.boolean(),
  send_text_message: z.string().max(1000).optional().nullable(),
}).refine(
  (data) => !data.send_text || (data.send_text_message && data.send_text_message.trim().length > 0),
  { message: 'Mensagem obrigatória quando envio de texto está ativo', path: ['send_text_message'] }
);

type FormValues = z.infer<typeof formSchema>;

interface TagFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tag?: TagForManagement | null;
  tenantId: string;
  onSuccess: () => void;
}

export function TagFormDialog({
  open,
  onOpenChange,
  tag,
  tenantId,
  onSuccess,
}: TagFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!tag;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tag_name: tag?.tag_name ?? '',
      tag_type: tag?.tag_type ?? 'description',
      color: tag?.color ?? '#3B82F6',
      active: tag?.active ?? true,
      prompt_to_ai: tag?.prompt_to_ai ?? '',
      is_category: tag?.is_category ?? false,
      change_conversation_status: tag?.change_conversation_status ?? '',
      send_text: tag?.send_text ?? false,
      send_text_message: tag?.send_text_message ?? '',
    },
  });

  const watchSendText = form.watch('send_text');

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        prompt_to_ai: values.prompt_to_ai || null,
        change_conversation_status: values.change_conversation_status || null,
        send_text_message: values.send_text ? (values.send_text_message || null) : null,
      };

      const url = isEditing
        ? `/api/configuracoes/tags/${tag.id}`
        : '/api/configuracoes/tags';

      const method = isEditing ? 'PATCH' : 'POST';

      const body = isEditing ? payload : { ...payload, tenantId };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar tag');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao salvar tag';
      form.setError('root', { message });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar Tag' : 'Nova Tag'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Atualize as informações da tag'
              : 'Preencha os campos para criar uma nova tag'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tag Name */}
            <FormField
              control={form.control}
              name="tag_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Tag</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Interessado no produto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tag Type + Color row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tag_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="description">Intenção</SelectItem>
                        <SelectItem value="success">Checkout</SelectItem>
                        <SelectItem value="fail">Falha</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cor</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="color" className="w-12 h-9 p-1 cursor-pointer" {...field} />
                      </FormControl>
                      <Input
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="#3B82F6"
                        className="flex-1"
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Active + Is Category row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Ativa</FormLabel>
                      <FormDescription className="text-xs">
                        Tag disponível para uso
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_category"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel className="text-sm">Categoria</FormLabel>
                      <FormDescription className="text-xs">
                        Usar como categoria
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Change Conversation Status */}
            <FormField
              control={form.control}
              name="change_conversation_status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alterar status da conversa</FormLabel>
                  <Select
                    onValueChange={(val) => field.onChange(val === 'none' ? '' : val)}
                    value={field.value || 'none'}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhuma ação" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhuma ação</SelectItem>
                      <SelectItem value="open">Abrir conversa</SelectItem>
                      <SelectItem value="closed">Fechar conversa</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Ao aplicar esta tag, alterar o status da conversa automaticamente
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prompt to AI */}
            <FormField
              control={form.control}
              name="prompt_to_ai"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrução para a IA</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Quando esta tag for aplicada, a IA deve..."
                      className="resize-none"
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Instrução adicional para a IA quando esta tag é aplicada
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Send Text toggle */}
            <FormField
              control={form.control}
              name="send_text"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <FormLabel className="text-sm">Enviar texto automático</FormLabel>
                    <FormDescription className="text-xs">
                      Enviar uma mensagem quando esta tag for aplicada
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Send Text Message (conditional) */}
            {watchSendText && (
              <FormField
                control={form.control}
                name="send_text_message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mensagem automática</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Mensagem que será enviada automaticamente..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Root error */}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
