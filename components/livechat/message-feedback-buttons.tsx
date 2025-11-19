'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MessageFeedbackButtonsProps {
  messageId: string;
  conversationId: string;
  tenantId: string;
}

export function MessageFeedbackButtons({
  messageId,
  conversationId,
  tenantId,
}: MessageFeedbackButtonsProps) {
  const [rating, setRating] = useState<'positive' | 'negative' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingRating, setPendingRating] = useState<'positive' | 'negative' | null>(null);
  const [comment, setComment] = useState('');

  const handleButtonClick = (newRating: 'positive' | 'negative') => {
    // Se clicar no mesmo botão, remove o feedback
    if (rating === newRating) {
      setRating(null);
      toast.info('Feedback removido');
      return;
    }

    // Abre o dialog para adicionar comentário opcional
    setPendingRating(newRating);
    setComment('');
    setDialogOpen(true);
  };

  const handleSubmitFeedback = async () => {
    if (!pendingRating) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          rating: pendingRating,
          comment: comment.trim() || undefined,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar feedback');
      }

      setRating(pendingRating);
      setDialogOpen(false);
      toast.success(
        pendingRating === 'positive'
          ? 'Obrigado pelo feedback positivo!'
          : 'Obrigado pelo feedback! Vamos melhorar.'
      );
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
      setPendingRating(null);
      setComment('');
    }
  };

  return (
    <>
      <div className="flex items-center gap-1 mt-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('positive')}
          disabled={isSubmitting}
          className={cn(
            'h-7 w-7 p-0',
            rating === 'positive' && 'bg-green-500/20 text-green-600 hover:bg-green-500/30'
          )}
          title="Feedback positivo"
        >
          <ThumbsUp className="h-3.5 w-3.5" />
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleButtonClick('negative')}
          disabled={isSubmitting}
          className={cn(
            'h-7 w-7 p-0',
            rating === 'negative' && 'bg-red-500/20 text-red-600 hover:bg-red-500/30'
          )}
          title="Feedback negativo"
        >
          <ThumbsDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Feedback {pendingRating === 'positive' ? 'Positivo' : 'Negativo'}
            </DialogTitle>
            <DialogDescription>
              Adicione um comentário opcional para ajudar a melhorar o atendimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Comentário (opcional)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 caracteres
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
