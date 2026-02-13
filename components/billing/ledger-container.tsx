'use client';

import { useState, useCallback } from 'react';
import {
  RefreshCw,
  Download,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LedgerFilters } from './ledger-filters';
import { LedgerTable } from './ledger-table';
import { formatBRL } from '@/types/billing';
import type {
  LedgerPaginatedResult,
  LedgerEntry,
  LedgerFilters as LedgerFiltersType,
} from '@/types/billing';

interface LedgerContainerProps {
  tenantId: string;
  initialData: LedgerPaginatedResult;
  availableProviders: string[];
}

function computeSummary(entries: LedgerEntry[]) {
  let totalCredits = 0;
  let totalDebits = 0;
  let creditCount = 0;
  let debitCount = 0;

  for (const entry of entries) {
    if (entry.direction === 'credit') {
      totalCredits += entry.amount_credits;
      creditCount++;
    } else {
      totalDebits += entry.amount_credits;
      debitCount++;
    }
  }

  return {
    totalCredits,
    totalDebits,
    net: totalCredits - totalDebits,
    creditCount,
    debitCount,
  };
}

function entriesToCSV(entries: LedgerEntry[]): string {
  const header = 'Data,Tipo,Origem,Descrição,Créditos,Saldo Após\n';
  const rows = entries.map((e) => {
    const date = new Date(e.created_at).toLocaleDateString('pt-BR');
    const type = e.direction === 'credit' ? 'Crédito' : 'Débito';
    const source = e.source_type;
    const desc = (e.description || '').replace(/"/g, '""');
    const amount = (e.amount_credits / 100).toFixed(2).replace('.', ',');
    const balance = (e.balance_after / 100).toFixed(2).replace('.', ',');
    return `${date},"${type}","${source}","${desc}",${amount},${balance}`;
  });
  return header + rows.join('\n');
}

export function LedgerContainer({
  tenantId,
  initialData,
  availableProviders,
}: LedgerContainerProps) {
  const [data, setData] = useState(initialData);
  const [filters, setFilters] = useState<LedgerFiltersType>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleFiltersChange = (newFilters: LedgerFiltersType) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchData(newFilters, 1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(filters, page);
  };

  const handleRefresh = () => {
    fetchData(filters, currentPage);
  };

  const handleExportCSV = () => {
    if (data.entries.length === 0) {
      toast.info('Nenhum dado para exportar');
      return;
    }

    const csv = entriesToCSV(data.entries);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `extrato-livia-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exportado com sucesso');
  };

  const summary = computeSummary(data.entries);

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
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={isLoading || data.entries.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
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
        </div>

        <Separator />

        {/* Resumo do Período */}
        {data.entries.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium">Créditos</span>
                  </div>
                  <p className="text-lg font-semibold text-green-600">
                    +{formatBRL(summary.totalCredits / 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.creditCount} entrada{summary.creditCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <TrendingDown className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium">Débitos</span>
                  </div>
                  <p className="text-lg font-semibold text-red-600">
                    -{formatBRL(summary.totalDebits / 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {summary.debitCount} entrada{summary.debitCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="text-xs font-medium">Saldo Líquido</span>
                  </div>
                  <p className={`text-lg font-semibold ${summary.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {summary.net >= 0 ? '+' : ''}{formatBRL(summary.net / 100)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {data.total} total na página
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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
