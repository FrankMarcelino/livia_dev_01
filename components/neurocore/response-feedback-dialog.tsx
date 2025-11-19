'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface ResponseFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (comment?: string) => Promise<void>;
}

/**
 * Dialog de feedback para respostas com avaliação negativa
 *
 * Abre quando usuário clica em "dislike" (👎)
 * Permite comentário opcional sobre o que pode melhorar
 */
export function ResponseFeedbackDialog({
  open,
  onOpenChange,
  onSubmit,
}: ResponseFeedbackDialogProps) {
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit(comment.trim() || undefined);
      setComment(''); // Limpa após enviar
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setComment('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>O que podemos melhorar?</DialogTitle>
          <DialogDescription>
            Seu feedback nos ajuda a aprimorar o conhecimento da IA. Deixe um
            comentário opcional sobre o que faltou ou o que está incorreto na
            resposta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          <Label htmlFor="feedback-comment">
            Comentário (opcional)
          </Label>
          <Textarea
            id="feedback-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Ex: A resposta não mencionou produtos usados..."
            className="min-h-[120px]"
            maxLength={500}
            disabled={isSubmitting}
          />
          <p className="text-xs text-muted-foreground text-right">
            {comment.length}/500
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
