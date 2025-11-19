import { Badge } from '@/components/ui/badge';
import type { SynapseStatus } from '@/types/knowledge-base';

/**
 * Helper para renderizar badge de status da synapse
 *
 * Princípio SOLID:
 * - Single Responsibility: Apenas renderiza badge de status
 * - Open/Closed: Adicionar novo status não quebra código existente
 */

interface StatusConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className?: string;
}

const STATUS_CONFIG: Record<SynapseStatus, StatusConfig> = {
  draft: {
    label: 'Rascunho',
    variant: 'secondary',
    className: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
  },
  indexing: {
    label: 'Indexando',
    variant: 'outline',
    className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300',
  },
  publishing: {
    label: 'Publicado',
    variant: 'default',
    className: 'bg-green-100 text-green-800 hover:bg-green-200',
  },
  error: {
    label: 'Erro',
    variant: 'destructive',
  },
};

export function getSynapseStatusBadge(status: SynapseStatus) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export function getSynapseStatusLabel(status: SynapseStatus): string {
  return STATUS_CONFIG[status].label;
}
