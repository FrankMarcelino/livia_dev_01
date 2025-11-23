'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { QuickReply } from '@/types/livechat';

interface QuickReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quickReply?: QuickReply | null; // null = criar nova, objeto = editar
  tenantId: string;
  onSuccess: () => void;
}

export function QuickReplyDialog({
  open,
  onOpenChange,
  quickReply,
  tenantId,
  onSuccess,
}: QuickReplyDialogProps) {
  const [emoji, setEmoji] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!quickReply;

  // Preencher formulário ao editar
  useEffect(() => {
    if (quickReply) {
      setEmoji(quickReply.emoji || '');
      setTitle(quickReply.title);
      setContent(quickReply.content);
    } else {
      // Limpar formulário ao criar nova
      setEmoji('');
      setTitle('');
      setContent('');
    }
  }, [quickReply, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim()) {
      toast.error('Título e Mensagem são obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Atualizar quick reply existente
        const response = await fetch(`/api/quick-replies/${quickReply.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emoji: emoji.trim() || null,
            title: title.trim(),
            content: content.trim(),
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar quick reply');
        }

        toast.success('Quick reply atualizada com sucesso!');
      } else {
        // Criar nova quick reply
        const response = await fetch('/api/quick-replies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emoji: emoji.trim() || null,
            title: title.trim(),
            content: content.trim(),
            tenantId,
          }),
        });

        if (!response.ok) {
          throw new Error('Erro ao criar quick reply');
        }

        toast.success('Quick reply criada com sucesso!');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting quick reply:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Erro ao salvar quick reply'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Quick Reply' : 'Nova Quick Reply'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Edite os campos abaixo e clique em Salvar.'
              : 'Preencha os campos abaixo. A quick reply nasce ativa e com 0 usos.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="emoji">Emoji (opcional)</Label>
              <Input
                id="emoji"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                placeholder="Ex: ⚡"
                maxLength={4}
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">
                Título <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Saudação inicial"
                maxLength={100}
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="content">
                Mensagem <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Ex: Olá! Como posso ajudar você hoje?"
                maxLength={1000}
                rows={6}
                required
                disabled={isSubmitting}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                Você pode usar variáveis como {'{nome_cliente}'}, {'{protocolo}'}, etc.
              </p>
            </div>
          </div>

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
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar' : 'Inserir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
