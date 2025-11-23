'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain, BookOpen, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { SynapseUsedCard } from './synapse-used-card';
import type { TrainingQuery } from '@/types/neurocore';

interface TrainingResponseCardProps {
  query: TrainingQuery;
  onEditSynapse: (synapseId: string) => void;
  onFeedback: (queryId: string, type: 'like' | 'dislike') => void;
}

/**
 * Card de resposta do treinamento
 *
 * Features:
 * - Renderiza resposta em markdown (sanitizado)
 * - Lista synapses usadas
 * - Botão de feedback (like/dislike)
 * - Timestamp e tempo de processamento
 */
export function TrainingResponseCard({
  query,
  onEditSynapse,
  onFeedback,
}: TrainingResponseCardProps) {
  if (!query.response) {
    return null;
  }

  const { answer, synapsesUsed, processingTime } = query.response;
  const hasSynapses = synapsesUsed.length > 0;

  return (
    <div className="space-y-4">
      {/* Pergunta do Usuário */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
              Você
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {query.question}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {(() => {
                  const date = new Date(query.createdAt);
                  const hours = date.getHours().toString().padStart(2, '0');
                  const minutes = date.getMinutes().toString().padStart(2, '0');
                  return `${hours}:${minutes}`;
                })()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resposta da IA */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <span className="font-semibold">Resposta da IA</span>
            </div>
            {processingTime && (
              <Badge variant="outline" className="gap-1">
                <Clock className="h-3 w-3" />
                {(processingTime / 1000).toFixed(1)}s
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Resposta em Markdown */}
          <div className="prose prose-sm max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Links externos com segurança
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {children}
                  </a>
                ),
                // Block scripts (segurança)
                script: () => null,
              }}
            >
              {answer}
            </ReactMarkdown>
          </div>

          {/* Synapses Usadas */}
          {hasSynapses && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">
                    Conhecimento Usado ({synapsesUsed.length}{' '}
                    {synapsesUsed.length === 1 ? 'synapse' : 'synapses'})
                  </span>
                </div>

                <div className="grid gap-3">
                  {synapsesUsed.map((synapse) => (
                    <SynapseUsedCard
                      key={synapse.id}
                      synapse={synapse}
                      onEdit={onEditSynapse}
                    />
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Empty State - Nenhuma Synapse */}
          {!hasSynapses && (
            <>
              <Separator />
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                    <BookOpen className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-orange-900">
                      Nenhuma synapse encontrada
                    </p>
                    <p className="text-sm text-orange-700">
                      Não encontrei informações sobre esse assunto na base de
                      conhecimento. Considere criar uma synapse sobre este tema.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Feedback */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Esta resposta foi útil?
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => onFeedback(query.id, 'like')}
                disabled={query.feedbackSubmitted}
                className="px-3 py-1.5 text-sm rounded-md hover:bg-green-50 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                👍 Sim
              </button>
              <button
                onClick={() => onFeedback(query.id, 'dislike')}
                disabled={query.feedbackSubmitted}
                className="px-3 py-1.5 text-sm rounded-md hover:bg-red-50 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                👎 Não
              </button>
            </div>
          </div>

          {query.feedbackSubmitted && (
            <div className="text-sm text-green-600 font-medium text-center">
              ✅ Feedback enviado! Obrigado.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
