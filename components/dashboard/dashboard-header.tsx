'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RefreshCw, CalendarIcon, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { normalizeeDateRange } from '@/lib/utils/date-helpers';
import type { TimeFilter } from '@/types/dashboard';

interface DashboardHeaderProps {
  timeFilter: TimeFilter;
  onTimeFilterChange: (value: TimeFilter) => void;
  channelId: string | null;
  onChannelChange: (value: string | null) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  customStartDate?: Date;
  customEndDate?: Date;
  onCustomDateChange?: (startDate: Date | undefined, endDate: Date | undefined) => void;
}

export function DashboardHeader({
  timeFilter,
  onTimeFilterChange,
  onRefresh,
  isRefreshing,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}: DashboardHeaderProps) {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: customStartDate,
    to: customEndDate,
  });
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  const validateDateRange = (from: Date | undefined, to: Date | undefined): { error: string | null; warning: string | null } => {
    // Estado intermediário: apenas uma data selecionada - não é erro
    if ((from && !to) || (!from && to)) {
      return { error: null, warning: null };
    }

    // Nenhuma data selecionada - não é erro até tentar aplicar
    if (!from || !to) {
      return { error: null, warning: null };
    }

    // Ambas selecionadas - validar normalmente
    if (to < from) {
      return { error: 'Data fim deve ser posterior à data início', warning: null };
    }

    const daysDiff = differenceInDays(to, from);
    if (daysDiff > 365) {
      return { error: 'Período máximo permitido é de 365 dias', warning: null };
    }

    // Warning para ranges grandes (90-365 dias)
    if (daysDiff >= 90) {
      return { 
        error: null, 
        warning: `⚠️ Período longo (${daysDiff + 1} dias) pode afetar a performance` 
      };
    }

    return { error: null, warning: null };
  };

  const handleRangeChange = (range: { from?: Date; to?: Date } | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined });
      setError(null);
      setWarning(null);
      return;
    }

    setDateRange({ from: range.from, to: range.to });
    const validation = validateDateRange(range.from, range.to);
    setError(validation.error);
    setWarning(validation.warning);
  };

  const handleApplyCustomDates = async () => {
    // Validar ambas as datas antes de aplicar
    if (!dateRange.from || !dateRange.to) {
      const errorMessage = 'Selecione ambas as datas (início e fim)';
      setError(errorMessage);
      toast.error('Erro ao aplicar período', {
        description: errorMessage,
      });
      return;
    }

    const validation = validateDateRange(dateRange.from, dateRange.to);
    if (validation.error) {
      setError(validation.error);
      toast.error('Erro ao aplicar período', {
        description: validation.error,
      });
      return;
    }

    if (dateRange.from && dateRange.to && onCustomDateChange) {
      setIsApplying(true);
      
      try {
        // Normalizar datas para UTC (início do dia e fim do dia)
        // Usa utilitário para garantir tratamento correto de timezone
        const { start, end } = normalizeeDateRange(dateRange.from, dateRange.to);
        
        onCustomDateChange(start, end);
        onTimeFilterChange('custom');
        
        setError(null);
        
        const daysDiff = differenceInDays(dateRange.to, dateRange.from) + 1;
        
        // Mostrar warning se período for muito longo
        if (validation.warning) {
          toast.warning('Período longo selecionado', {
            description: `Carregando ${daysDiff} dias de dados. Isso pode levar alguns segundos...`,
            duration: 5000,
          });
        } else {
          toast.success('Período personalizado aplicado', {
            description: `Exibindo dados de ${daysDiff} ${daysDiff === 1 ? 'dia' : 'dias'}`,
          });
        }
      } catch (error) {
        console.error('Erro ao aplicar datas:', error);
        toast.error('Erro ao aplicar período', {
          description: 'Ocorreu um erro ao processar as datas. Tente novamente.',
        });
      } finally {
        setIsApplying(false);
      }
    }
  };

  const handleClear = () => {
    setDateRange({ from: undefined, to: undefined });
    setError(null);
    setWarning(null);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral das métricas e analytics
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
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
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Date Picker para Período Personalizado */}
        {timeFilter === 'custom' && (
          <div className="flex items-center gap-2">
            {/* Data Início */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !dateRange.from && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR }) : 'Data início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.from}
                  onSelect={(date) => handleRangeChange({ from: date, to: dateRange.to })}
                  disabled={(date) => date > new Date() || (dateRange.to ? date > dateRange.to : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-sm text-muted-foreground">até</span>

            {/* Data Fim */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    'w-[160px] justify-start text-left font-normal',
                    !dateRange.to && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? format(dateRange.to, 'dd/MM/yyyy', { locale: ptBR }) : 'Data fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateRange.to}
                  onSelect={(date) => handleRangeChange({ from: dateRange.from, to: date })}
                  disabled={(date) => date > new Date() || (dateRange.from ? date < dateRange.from : false)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleApplyCustomDates}
                disabled={!dateRange.from || !dateRange.to || !!error || isApplying}
                size="sm"
              >
                {isApplying ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Aplicando...
                  </>
                ) : (
                  'Aplicar'
                )}
              </Button>
              <Button
                onClick={handleClear}
                variant="outline"
                size="sm"
                disabled={isApplying}
              >
                Limpar
              </Button>
            </div>
          </div>
        )}

        {/* Mensagens de Erro/Warning */}
        {timeFilter === 'custom' && (warning || error) && (
          <div className="w-full">
            {warning && !error && (
              <div className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-xs text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                <p>{warning}</p>
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 p-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
