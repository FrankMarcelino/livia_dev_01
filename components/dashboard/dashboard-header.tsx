'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TimeFilter } from '@/types/dashboard';

interface DashboardHeaderProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  channelId: string | null;
  onChannelChange: (value: string | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DashboardHeader({
  timeFilter,
  onTimeFilterChange,
  onRefresh,
  isRefreshing,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das métricas e analytics
        </p>
      </div>

      <div className="flex items-center gap-2">
        {/* Botão Atualizar */}
        <Button
          onClick={onRefresh}
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw
            className={cn('h-4 w-4 mr-2', isRefreshing && 'animate-spin')}
          />
          Atualizar
        </Button>

        {/* Filtro de Período */}
        <Select value={timeFilter} onValueChange={onTimeFilterChange}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Selecione período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="15days">Últimos 15 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
