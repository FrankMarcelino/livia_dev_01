'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { BaseConhecimentoCard } from './base-conhecimento-card';
import type { BaseConhecimentoWithCount } from '@/types/knowledge-base';

interface BaseConhecimentoCarouselProps {
  bases: BaseConhecimentoWithCount[];
  selectedBaseId: string | null;
  onSelectBase: (baseId: string) => void;
  onToggleActive: (baseId: string, isActive: boolean) => void;
  onOpenCreateDialog: () => void;
}

/**
 * Scroll horizontal de cards de Base de Conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas layout de scroll horizontal
 * - Open/Closed: Extensível via callbacks
 * - Liskov Substitution: Cards substituíveis
 *
 * Features:
 * - Scroll horizontal com overflow-x-auto
 * - Botão [+ ADD BASE] no final
 * - Renderiza lista de BaseConhecimentoCard
 * - Passa baseId selecionado para highlight
 */
export function BaseConhecimentoCarousel({
  bases,
  selectedBaseId,
  onSelectBase,
  onToggleActive,
  onOpenCreateDialog,
}: BaseConhecimentoCarouselProps) {
  return (
    <div className="space-y-4 w-full max-w-full overflow-x-hidden">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Bases de Conhecimento</h2>
        <Button onClick={onOpenCreateDialog} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Nova Base
        </Button>
      </div>

      {bases.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <p className="text-lg font-medium text-muted-foreground">
            Nenhuma base de conhecimento criada
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Crie uma base para organizar synapses relacionadas
          </p>
          <Button onClick={onOpenCreateDialog} className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            Criar Primeira Base
          </Button>
        </div>
      ) : (
        <div
          className="flex gap-4 overflow-x-auto pb-4 w-full"
          style={{
            scrollbarWidth: 'thin',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {bases.map((base) => (
            <BaseConhecimentoCard
              key={base.id}
              base={base}
              isSelected={selectedBaseId === base.id}
              onSelect={onSelectBase}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </div>
  );
}
