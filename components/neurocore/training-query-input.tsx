'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface TrainingQueryInputProps {
  onSubmit: (question: string) => Promise<void>;
  isLoading: boolean;
}

/**
 * Input de pergunta para o Treinamento Neurocore
 *
 * Features:
 * - Validação: min 3 chars, max 500 chars
 * - Ctrl+Enter para enviar
 * - Auto-resize do textarea
 * - Loading state
 */
export function TrainingQueryInput({
  onSubmit,
  isLoading,
}: TrainingQueryInputProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = async () => {
    if (question.trim().length < 3 || isLoading) return;

    await onSubmit(question.trim());
    setQuestion(''); // Limpa input após enviar
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Enter ou Cmd+Enter para enviar
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isValid = question.trim().length >= 3 && question.trim().length <= 500;
  const charCount = question.length;

  return (
    <div className="space-y-2">
      <div className="relative">
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta para testar o conhecimento da IA..."
          disabled={isLoading}
          className="min-h-[80px] pr-12 resize-none"
          maxLength={500}
        />
        <Button
          onClick={handleSubmit}
          disabled={!isValid || isLoading}
          size="icon"
          className="absolute bottom-2 right-2"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div>
          {isLoading ? (
            <span className="text-blue-600">Processando pergunta...</span>
          ) : (
            <span>
              Pressione <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl</kbd>{' '}
              + <kbd className="px-1 py-0.5 bg-muted rounded">Enter</kbd> para
              enviar
            </span>
          )}
        </div>
        <div className={charCount > 450 ? 'text-orange-600' : ''}>
          {charCount}/500
        </div>
      </div>
    </div>
  );
}
