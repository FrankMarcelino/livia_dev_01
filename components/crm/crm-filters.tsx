'use client';

import { Badge } from '@/components/ui/badge';
import type { CRMFiltersProps } from '@/types/crm';

/**
 * CRMFilters - Filtros de status para o Kanban CRM
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza badges de filtro
 * - Open/Closed: Extensível via props, fechado para modificação
 * - Dependency Inversion: Depende de abstrações (props)
 *
 * @param currentFilter - Filtro atualmente selecionado
 * @param onFilterChange - Callback quando filtro muda
 * @param statusCounts - Contadores de conversas por status
 */
export function CRMFilters({
  currentFilter,
  onFilterChange,
  statusCounts,
}: CRMFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      <Badge
        variant={currentFilter === 'ia' ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={() => onFilterChange('ia')}
      >
        IA ({statusCounts.open})
      </Badge>

      <Badge
        variant={currentFilter === 'manual' ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={() => onFilterChange('manual')}
      >
        Modo Manual ({statusCounts.paused})
      </Badge>

      <Badge
        variant={currentFilter === 'closed' ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={() => onFilterChange('closed')}
      >
        Encerradas ({statusCounts.closed})
      </Badge>

      <Badge
        variant={currentFilter === 'all' ? 'default' : 'outline'}
        className="cursor-pointer hover:bg-primary/90 transition-colors"
        onClick={() => onFilterChange('all')}
      >
        Todas ({statusCounts.all})
      </Badge>
    </div>
  );
}
