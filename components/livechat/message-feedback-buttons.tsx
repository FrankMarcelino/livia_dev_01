'use client';

import { useState } from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

  const handleFeedback = async (newRating: 'positive' | 'negative') => {
    // Se clicar no mesmo botão, remove o feedback
    if (rating === newRating) {
      setRating(null);
      toast.info('Feedback removido');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/feedback/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          rating: newRating,
          tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar feedback');
      }

      setRating(newRating);
      toast.success(
        newRating === 'positive'
          ? 'Obrigado pelo feedback positivo!'
          : 'Obrigado pelo feedback! Vamos melhorar.'
      );
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);
      toast.error('Erro ao enviar feedback. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center gap-1 mt-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleFeedback('positive')}
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
        onClick={() => handleFeedback('negative')}
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
  );
}
