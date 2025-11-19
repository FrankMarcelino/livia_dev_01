'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { TrainingQueryInput } from './training-query-input';
import { TrainingResponseCard } from './training-response-card';
import { ResponseFeedbackDialog } from './response-feedback-dialog';
import { submitFeedbackAction } from '@/app/actions/neurocore';
import type {
  TrainingQuery,
  NeurocoreQueryResponse,
  FeedbackContext,
} from '@/types/neurocore';

interface NeurocoreChatProps {
  tenantId: string;
}

/**
 * Container principal do Treinamento Neurocore
 *
 * Gerencia:
 * - Estado local das queries (não persiste no banco)
 * - Chamadas à API route /api/neurocore/query
 * - Feedback (like/dislike)
 * - Dialog de edição de synapse (será adicionado)
 *
 * Features:
 * - Limita histórico a 20 queries (performance)
 * - Auto-scroll para nova resposta
 * - Loading states
 * - Error handling
 */
export function NeurocoreChat({ tenantId }: NeurocoreChatProps) {
  const [queries, setQueries] = useState<TrainingQuery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    queryId: string | null;
    type: 'like' | 'dislike' | null;
  }>({
    open: false,
    queryId: null,
    type: null,
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll para última resposta
  useEffect(() => {
    if (scrollRef.current && queries.length > 0) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [queries.length]);

  /**
   * Submete nova pergunta para o n8n
   */
  const handleSubmitQuery = async (question: string) => {
    const newQuery: TrainingQuery = {
      id: uuidv4(),
      question,
      createdAt: new Date(),
    };

    // Adiciona query ao estado (sem resposta ainda)
    setQueries((prev) => {
      // Limita a 20 queries (performance)
      const updated = [...prev, newQuery];
      return updated.slice(-20);
    });

    setIsLoading(true);

    try {
      const response = await fetch('/api/neurocore/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          tenantId,
        }),
      });

      const data = (await response.json()) as NeurocoreQueryResponse;

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Erro ao processar pergunta');
      }

      // Atualiza query com resposta
      setQueries((prev) =>
        prev.map((q) =>
          q.id === newQuery.id
            ? {
                ...q,
                response: data.data,
              }
            : q
        )
      );
    } catch (error) {
      console.error('Erro ao processar query:', error);

      toast.error('Erro ao processar pergunta', {
        description:
          error instanceof Error
            ? error.message
            : 'Tente novamente em alguns instantes',
      });

      // Remove query que falhou
      setQueries((prev) => prev.filter((q) => q.id !== newQuery.id));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Abre dialog de feedback ou submete diretamente (like)
   */
  const handleFeedback = (queryId: string, type: 'like' | 'dislike') => {
    if (type === 'like') {
      // Like: submete direto sem dialog
      submitFeedback(queryId, type);
    } else {
      // Dislike: abre dialog para comentário
      setFeedbackDialog({ open: true, queryId, type });
    }
  };

  /**
   * Submete feedback para o Server Action
   */
  const submitFeedback = async (
    queryId: string,
    type: 'like' | 'dislike',
    comment?: string
  ) => {
    const query = queries.find((q) => q.id === queryId);
    if (!query || !query.response) return;

    // Monta contexto do feedback
    const context: FeedbackContext = {
      type: 'neurocore_training',
      question: query.question,
      answer: query.response.answer,
      synapsesUsed: query.response.synapsesUsed.map((s) => s.id),
      timestamp: new Date().toISOString(),
    };

    try {
      const result = await submitFeedbackAction({
        tenantId,
        feedbackType: type,
        context,
        comment,
      });

      if (!result.success) {
        throw new Error(result.error || 'Erro ao enviar feedback');
      }

      // Marca query como feedback submetido
      setQueries((prev) =>
        prev.map((q) =>
          q.id === queryId ? { ...q, feedbackSubmitted: true } : q
        )
      );

      toast.success('Feedback enviado!', {
        description: 'Obrigado por ajudar a melhorar a IA.',
      });
    } catch (error) {
      console.error('Erro ao enviar feedback:', error);

      toast.error('Erro ao enviar feedback', {
        description: 'Tente novamente em alguns instantes',
      });
    }
  };

  /**
   * Callback do dialog de feedback (dislike)
   */
  const handleFeedbackDialogSubmit = async (comment?: string) => {
    if (!feedbackDialog.queryId || !feedbackDialog.type) return;

    await submitFeedback(feedbackDialog.queryId, feedbackDialog.type, comment);

    setFeedbackDialog({ open: false, queryId: null, type: null });
  };

  /**
   * Abre dialog de edição de synapse
   * TODO: Implementar no próximo sprint (refactor SynapseDialog)
   */
  const handleEditSynapse = (synapseId: string) => {
    toast.info('Em desenvolvimento', {
      description: `Editar synapse ${synapseId} (próximo sprint)`,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Área de histórico (scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Empty State */}
        {queries.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Teste o conhecimento da sua IA</h2>
              <p className="text-muted-foreground max-w-md">
                Faça perguntas para validar se a IA responde corretamente antes
                de ativar em produção
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg max-w-md">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Teste perguntas que seus clientes
                fariam para identificar gaps de conhecimento nas synapses
              </p>
            </div>
          </div>
        )}

        {/* Lista de queries/respostas */}
        {queries.map((query) => (
          <TrainingResponseCard
            key={query.id}
            query={query}
            onEditSynapse={handleEditSynapse}
            onFeedback={handleFeedback}
          />
        ))}

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="space-y-3 text-center">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto animate-pulse">
                <span className="text-2xl">🧠</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Analisando conhecimento...</p>
                <p className="text-xs text-muted-foreground">
                  • Buscando synapses relevantes
                  <br />• Gerando resposta
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ref para auto-scroll */}
        <div ref={scrollRef} />
      </div>

      {/* Input de pergunta (fixo no bottom) */}
      <div className="border-t bg-background p-6">
        <TrainingQueryInput onSubmit={handleSubmitQuery} isLoading={isLoading} />
      </div>

      {/* Dialog de feedback */}
      <ResponseFeedbackDialog
        open={feedbackDialog.open}
        onOpenChange={(open) =>
          setFeedbackDialog({ open, queryId: null, type: null })
        }
        onSubmit={handleFeedbackDialogSubmit}
      />
    </div>
  );
}
