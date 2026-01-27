'use client';

import { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { TrainingQueryInput } from './training-query-input';
import { TrainingResponseCard } from './training-response-card';
import { ResponseFeedbackDialog } from './response-feedback-dialog';
import { BaseConhecimentoFormDialog } from '@/components/knowledge-base/base-conhecimento-form-dialog';
import { submitFeedbackAction } from '@/app/actions/neurocore';
import { useApiCall } from '@/lib/hooks';
import { MAX_NEUROCORE_QUERIES } from '@/config/constants';
import type {
  TrainingQuery,
  NeurocoreQueryResponse,
  FeedbackContext,
} from '@/types/neurocore';
import type { BaseConhecimento, KnowledgeDomain } from '@/types/knowledge-base';

interface NeurocoreChatProps {
  tenantId: string;
  neurocoreId: string;
  allDomains: KnowledgeDomain[];
}

/**
 * Container principal de Validação de Respostas
 *
 * Gerencia:
 * - Estado local das queries (não persiste no banco)
 * - Chamadas à API route /api/neurocore/query
 * - Feedback (like/dislike)
 * - Dialog de edição de base de conhecimento
 *
 * Features:
 * - Limita histórico a 20 queries (performance)
 * - Auto-scroll para nova resposta
 * - Loading states
 * - Error handling
 */
export function NeurocoreChat({ tenantId, neurocoreId, allDomains }: NeurocoreChatProps) {
  const [queries, setQueries] = useState<TrainingQuery[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [feedbackDialog, setFeedbackDialog] = useState<{
    open: boolean;
    queryId: string | null;
    type: 'like' | 'dislike' | null;
  }>({
    open: false,
    queryId: null,
    type: null,
  });
  const [editBaseDialog, setEditBaseDialog] = useState<{
    open: boolean;
    base: BaseConhecimento | null;
    isLoading: boolean;
  }>({
    open: false,
    base: null,
    isLoading: false,
  });

  const scrollRef = useRef<HTMLDivElement>(null);
  const currentQueryIdRef = useRef<string | null>(null);

  // API call hooks
  const submitQuery = useApiCall<NeurocoreQueryResponse>('/api/neurocore/query', 'POST', {
    suppressSuccessToast: true,
    suppressErrorToast: true, // Handled manually below
    onSuccess: (data) => {
      console.log('[NeurocoreChat] onSuccess data:', data);
      console.log('[NeurocoreChat] currentQueryIdRef:', currentQueryIdRef.current);
      console.log('[NeurocoreChat] data.success:', data.success);
      console.log('[NeurocoreChat] data.data:', data.data);
      
      if (currentQueryIdRef.current && data.success && data.data) {
        const queryId = currentQueryIdRef.current;
        // Atualiza query com resposta
        setQueries((prev) => {
          const updated = prev.map((q) =>
            q.id === queryId
              ? {
                  ...q,
                  response: data.data,
                }
              : q
          );
          console.log('[NeurocoreChat] Updated queries:', updated);
          return updated;
        });
      }
      currentQueryIdRef.current = null;
    },
    onError: () => {
      console.log('[NeurocoreChat] onError');
      // Remove query que falhou
      if (currentQueryIdRef.current) {
        const queryId = currentQueryIdRef.current;
        setQueries((prev) => prev.filter((q) => q.id !== queryId));
        currentQueryIdRef.current = null;
      }
    },
  });

  // Marcar como montado (client-side)
  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    // Criar query com timestamp no momento da submissão (client-side only)
    const newQuery: TrainingQuery = {
      id: uuidv4(),
      question,
      createdAt: new Date(), // Agora é seguro pois só executa após click do usuário
    };

    currentQueryIdRef.current = newQuery.id;

    // Adiciona query ao estado (sem resposta ainda)
    setQueries((prev) => {
      // Limita a MAX_NEUROCORE_QUERIES queries (performance)
      const updated = [...prev, newQuery];
      return updated.slice(-MAX_NEUROCORE_QUERIES);
    });

    const result = await submitQuery.execute({
      question,
      tenantId,
    });

    if (!result || !result.success) {
      toast.error('Erro ao processar pergunta', {
        description: result?.error || 'Tente novamente em alguns instantes',
      });
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
      basesUsed: query.response.basesUsed.map((b) => b.id),
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
   * Abre dialog de edição de base de conhecimento
   */
  const handleEditBase = async (baseId: string) => {
    try {
      setEditBaseDialog({ open: true, base: null, isLoading: true });
      
      // Buscar base completa do banco
      const response = await fetch(`/api/bases/${baseId}`);
      if (!response.ok) {
        throw new Error('Erro ao buscar base de conhecimento');
      }
      
      const base = await response.json();
      setEditBaseDialog({ open: true, base, isLoading: false });
    } catch (error) {
      console.error('Erro ao buscar base:', error);
      toast.error('Erro ao carregar base de conhecimento');
      setEditBaseDialog({ open: false, base: null, isLoading: false });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Área de histórico (scrollable) */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Empty State */}
        {queries.length === 0 && !submitQuery.isLoading && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
            <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-3xl">🧠</span>
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Valide as respostas da sua IA</h2>
              <p className="text-muted-foreground max-w-md">
                Faça perguntas para testar se a IA responde corretamente usando a base de conhecimento
              </p>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg max-w-md">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dica:</strong> Teste perguntas que seus clientes
                fariam para identificar gaps de conhecimento nas bases
              </p>
            </div>
          </div>
        )}

        {/* Lista de queries/respostas - só renderiza depois de montar */}
        {isMounted && queries.map((query) => (
          <TrainingResponseCard
            key={query.id}
            query={query}
            onEditBase={handleEditBase}
            onFeedback={handleFeedback}
          />
        ))}

        {/* Loading state - PENSANDO */}
        {submitQuery.isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="space-y-4 text-center max-w-md">
              {/* Brain icon with pulse animation */}
              <div className="relative mx-auto w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-purple-200 animate-ping opacity-75" />
                <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center animate-pulse shadow-lg">
                  <span className="text-3xl">🧠</span>
                </div>
              </div>

              {/* Texto principal */}
              <div className="space-y-2">
                <p className="text-lg font-semibold text-purple-900">
                  Pensando<span className="animate-pulse">...</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  A IA está analisando sua pergunta
                </p>
              </div>

              {/* Steps animados */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-2 text-left text-sm">
                  <div className="flex items-center gap-2 text-purple-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span>Buscando conhecimento relevante</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-600">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-400 animate-pulse animation-delay-200" />
                    <span>Processando bases de conhecimento</span>
                  </div>
                  <div className="flex items-center gap-2 text-purple-500">
                    <div className="h-1.5 w-1.5 rounded-full bg-purple-300 animate-pulse animation-delay-400" />
                    <span>Gerando resposta</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground italic">
                Isso pode levar alguns segundos...
              </p>
            </div>
          </div>
        )}

        {/* Ref para auto-scroll */}
        <div ref={scrollRef} />
      </div>

      {/* Input de pergunta (fixo no bottom) */}
      <div className="border-t bg-background p-6">
        <TrainingQueryInput onSubmit={handleSubmitQuery} isLoading={submitQuery.isLoading} />
      </div>

      {/* Dialog de feedback */}
      <ResponseFeedbackDialog
        open={feedbackDialog.open}
        onOpenChange={(open) =>
          setFeedbackDialog({ open, queryId: null, type: null })
        }
        onSubmit={handleFeedbackDialogSubmit}
      />

      {/* Dialog de edição de base */}
      <BaseConhecimentoFormDialog
        open={editBaseDialog.open}
        onOpenChange={(open) => 
          !editBaseDialog.isLoading && setEditBaseDialog({ open, base: null, isLoading: false })
        }
        tenantId={tenantId}
        neurocoreId={neurocoreId}
        domains={allDomains}
        base={editBaseDialog.base || undefined}
        onSuccess={() => {
          toast.success('Base de conhecimento atualizada!');
          setEditBaseDialog({ open: false, base: null, isLoading: false });
        }}
      />
    </div>
  );
}
