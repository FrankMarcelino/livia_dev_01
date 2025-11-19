'use client';

import { useState } from 'react';
import { FileText, ChevronDown, ChevronUp, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { SynapseUsed } from '@/types/neurocore';

interface SynapseUsedCardProps {
  synapse: SynapseUsed;
  onEdit: (synapseId: string) => void;
}

/**
 * Card de synapse utilizada para gerar a resposta
 *
 * Features:
 * - Score de similaridade (visual com progress bar)
 * - Expandir/colapsar conteúdo
 * - Botão "Editar" (abre dialog)
 * - Preview do conteúdo (primeiras 2 linhas quando colapsado)
 */
export function SynapseUsedCard({ synapse, onEdit }: SynapseUsedCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Converter score (0-1) para porcentagem
  const scorePercentage = Math.round(synapse.score * 100);

  // Cor do score baseada no valor
  const getScoreColor = (score: number): string => {
    if (score >= 0.9) return 'text-green-600';
    if (score >= 0.7) return 'text-blue-600';
    if (score >= 0.5) return 'text-orange-600';
    return 'text-red-600';
  };

  // Preview do conteúdo (primeiras 150 chars)
  const contentPreview =
    synapse.content.length > 150
      ? `${synapse.content.substring(0, 150)}...`
      : synapse.content;

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1">
            <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <CardTitle className="text-base font-medium">
                {synapse.title}
              </CardTitle>
              {synapse.description && (
                <p className="text-sm text-muted-foreground">
                  {synapse.description}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(synapse.id)}
            className="shrink-0"
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Score de Similaridade */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Similaridade</span>
            <Badge
              variant="outline"
              className={`${getScoreColor(synapse.score)} font-medium`}
            >
              {scorePercentage}%
            </Badge>
          </div>
          <Progress value={scorePercentage} className="h-2" />
        </div>

        {/* Conteúdo */}
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            {isExpanded ? (
              <div className="whitespace-pre-wrap">{synapse.content}</div>
            ) : (
              <div>{contentPreview}</div>
            )}
          </div>

          {/* Botão Expandir/Colapsar */}
          {synapse.content.length > 150 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Ver menos
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Ver conteúdo completo
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
