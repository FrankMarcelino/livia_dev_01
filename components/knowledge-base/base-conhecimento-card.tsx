'use client';

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { BaseConhecimentoWithCount } from '@/types/knowledge-base';
import { cn } from '@/lib/utils';

interface BaseConhecimentoCardProps {
  base: BaseConhecimentoWithCount;
  isSelected: boolean;
  onSelect: (baseId: string) => void;
  onToggleActive: (baseId: string, isActive: boolean) => void;
}

/**
 * Card individual de Base de Conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza card
 * - Open/Closed: Extensível via callbacks
 * - Dependency Inversion: Callbacks abstratos
 *
 * Features:
 * - Visual highlight quando selecionado
 * - Badge com quantidade de synapses
 * - Toggle Ativa/Desativa
 * - Click seleciona base
 */
export function BaseConhecimentoCard({
  base,
  isSelected,
  onSelect,
  onToggleActive,
}: BaseConhecimentoCardProps) {
  return (
    <Card
      className={cn(
        'min-w-[280px] max-w-[280px] flex-shrink-0 cursor-pointer transition-all hover:shadow-md',
        isSelected && 'border-primary shadow-lg ring-2 ring-primary/20',
        !base.is_active && 'opacity-60'
      )}
      onClick={() => onSelect(base.id)}
    >
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-lg line-clamp-2">{base.name}</CardTitle>
          <Badge variant={base.is_active ? 'default' : 'secondary'}>
            {base.synapses_count || 0}
          </Badge>
        </div>
        {base.description && (
          <CardDescription className="line-clamp-2">
            {base.description}
          </CardDescription>
        )}
        {!base.is_active && (
          <Badge variant="destructive" className="w-fit">
            Inativa
          </Badge>
        )}
      </CardHeader>

      <CardContent>
        <div
          className="flex items-center justify-between space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <Label htmlFor={`active-${base.id}`} className="text-sm">
            {base.is_active ? 'Ativa' : 'Desativada'}
          </Label>
          <Switch
            id={`active-${base.id}`}
            checked={base.is_active}
            onCheckedChange={(checked) => onToggleActive(base.id, checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
