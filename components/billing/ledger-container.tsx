'use client';

import { useState, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LedgerFilters } from './ledger-filters';
import { LedgerTable } from './ledger-table';
import type { LedgerPaginatedResult, LedgerFilters as LedgerFiltersType } from '@/types/billing';

interface LedgerContainerProps {
  tenantId: string;
  initialData: LedgerPaginatedResult;
  availableProviders: string[];
}

/**
 * Container do Extrato - Gerencia estado e filtros
 */
export function LedgerContainer({
  tenantId,
  initialData,
  availableProviders,
}: LedgerContainerProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<LedgerFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Função para buscar dados com filtros
  const fetchData = useCallback(
    async (newFilters: LedgerFiltersType, page: number) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('tenantId', tenantId);
        params.set('page', page.toString());
        params.set('limit', '20');

        if (newFilters.startDate) params.set('startDate', newFilters.startDate);
        if (newFilters.endDate) params.set('endDate', newFilters.endDate);
        if (newFilters.direction && newFilters.direction !== 'all') {
          params.set('direction', newFilters.direction);
        }
        if (newFilters.sourceType) params.set('sourceType', newFilters.sourceType);

        const response = await fetch(`/api/billing/ledger?${params.toString()}`);
        if (response.ok) {
          const result = await response.json();
          if (result.data) {
            setData(result.data);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar extrato:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [tenantId]
  );

  // Handler para mudança de filtros
  const handleFiltersChange = (newFilters: LedgerFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchData(newFilters, 1);
  };

  // Handler para mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(filters, page);
  };

  // Handler para refresh
  const handleRefresh = () => {
    fetchData(filters, currentPage);
  };

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Extrato</h1>
            <p className="text-muted-foreground">
              Histórico de créditos e débitos da sua conta
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        <Separator />

        {/* Filtros */}
        <LedgerFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          availableProviders={availableProviders}
          isLoading={isLoading}
        />

        {/* Tabela */}
        <LedgerTable
          data={data}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
