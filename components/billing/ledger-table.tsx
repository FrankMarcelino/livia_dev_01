'use client';

import { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { LedgerPaginatedResult, LedgerEntry } from '@/types/billing';
import { formatBRL } from '@/types/billing';

interface LedgerTableProps {
  data: LedgerPaginatedResult;
  currentPage: number;
  onPageChange: (page: number) => void;
  isLoading: boolean;
}

/**
 * Formata data para exibição
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retorna label do source_type
 */
function getSourceTypeLabel(sourceType: string): string {
  const labels: Record<string, string> = {
    purchase: 'Recarga',
    usage: 'Uso de IA',
    adjustment: 'Ajuste',
    refund: 'Reembolso',
  };
  return labels[sourceType] || sourceType;
}

/**
 * Linha individual do extrato com detalhes expandíveis
 */
function LedgerRow({ entry }: { entry: LedgerEntry }) {
  const [isOpen, setIsOpen] = useState(false);
  const isCredit = entry.direction === 'credit';

  return (
    <>
      <TableRow className="group cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {/* Data */}
        <TableCell className="font-mono text-xs">
          {formatDate(entry.created_at)}
        </TableCell>

        {/* Tipo */}
        <TableCell>
          <div className="flex items-center gap-2">
            {isCredit ? (
              <ArrowDownCircle className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowUpCircle className="h-4 w-4 text-red-600" />
            )}
            <Badge variant={isCredit ? 'default' : 'secondary'} className="text-xs">
              {isCredit ? 'Crédito' : 'Débito'}
            </Badge>
          </div>
        </TableCell>

        {/* Descrição */}
        <TableCell className="max-w-[200px]">
          <div className="truncate text-sm">
            {entry.description || getSourceTypeLabel(entry.source_type)}
          </div>
          {entry.meta?.provider && (
            <div className="text-xs text-muted-foreground capitalize">
              {entry.meta.provider} / {entry.meta.sku}
            </div>
          )}
        </TableCell>

        {/* Valor */}
        <TableCell className="text-right font-medium">
          <span className={isCredit ? 'text-green-600' : 'text-red-600'}>
            {isCredit ? '+' : '-'} {formatBRL(entry.amount_credits / 100)}
          </span>
        </TableCell>

        {/* Saldo Após */}
        <TableCell className="text-right text-muted-foreground">
          {formatBRL(entry.balance_after / 100)}
        </TableCell>

        {/* Expandir */}
        <TableCell className="w-10">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            />
          </Button>
        </TableCell>
      </TableRow>

      {/* Detalhes Expandidos */}
      {isOpen && (
        <TableRow className="bg-muted/30 hover:bg-muted/30">
          <TableCell colSpan={6} className="p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Origem</p>
                <p className="font-medium">{getSourceTypeLabel(entry.source_type)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Referência</p>
                <p className="font-mono text-xs">{entry.source_ref || '-'}</p>
              </div>
              {entry.meta?.provider && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Provider</p>
                    <p className="capitalize">{entry.meta.provider}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">SKU</p>
                    <p>{entry.meta.sku || '-'}</p>
                  </div>
                </>
              )}
              {entry.meta?.measures && (
                <div className="col-span-2">
                  <p className="text-xs text-muted-foreground">Métricas</p>
                  <p className="font-mono text-xs">
                    {Object.entries(entry.meta.measures)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(' | ')}
                  </p>
                </div>
              )}
              {entry.meta?.base_usd && (
                <>
                  <div>
                    <p className="text-xs text-muted-foreground">Custo Base (USD)</p>
                    <p>${Number(entry.meta.base_usd).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Valor Cobrado (USD)</p>
                    <p>${Number(entry.meta.sell_usd).toFixed(4)}</p>
                  </div>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

/**
 * Tabela do Extrato com paginação
 */
export function LedgerTable({
  data,
  currentPage,
  onPageChange,
  isLoading,
}: LedgerTableProps) {
  const { entries, total, totalPages } = data;

  // Loading skeleton
  if (isLoading && entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Estado vazio
  if (entries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Movimentações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma movimentação encontrada</p>
            <p className="text-sm">Tente ajustar os filtros</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Movimentações
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {total} {total === 1 ? 'registro' : 'registros'}
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Data</TableHead>
                <TableHead className="w-[100px]">Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right w-[120px]">Valor</TableHead>
                <TableHead className="text-right w-[120px]">Saldo</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => (
                <LedgerRow key={entry.id} entry={entry} />
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      {/* Paginação */}
      {totalPages > 1 && (
        <CardFooter className="border-t py-4">
          <div className="flex items-center justify-between w-full">
            <p className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
