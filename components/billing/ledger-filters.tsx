'use client';

import { Calendar, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LedgerFilters as LedgerFiltersType } from '@/types/billing';

interface LedgerFiltersProps {
  filters: LedgerFiltersType;
  onFiltersChange: (filters: LedgerFiltersType) => void;
  availableProviders: string[];
  isLoading: boolean;
}

/**
 * Componente de Filtros do Extrato
 */
export function LedgerFilters({
  filters,
  onFiltersChange,
  availableProviders,
  isLoading,
}: LedgerFiltersProps) {
  // Handler para mudança de campo
  const handleChange = (key: keyof LedgerFiltersType, value: string | undefined) => {
    const newFilters = { ...filters };
    if (value && value !== 'all') {
      newFilters[key] = value as never;
    } else {
      delete newFilters[key];
    }
    onFiltersChange(newFilters);
  };

  // Verifica se há filtros ativos
  const hasActiveFilters =
    filters.startDate ||
    filters.endDate ||
    (filters.direction && filters.direction !== 'all') ||
    filters.sourceType;

  // Limpa todos os filtros
  const clearFilters = () => {
    onFiltersChange({});
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              disabled={isLoading}
              className="ml-auto h-7 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Data Início */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-xs">
              Data Início
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleChange('startDate', e.target.value || undefined)}
                disabled={isLoading}
                className="pl-9"
              />
            </div>
          </div>

          {/* Data Fim */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-xs">
              Data Fim
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="endDate"
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleChange('endDate', e.target.value || undefined)}
                disabled={isLoading}
                className="pl-9"
              />
            </div>
          </div>

          {/* Tipo (direção) */}
          <div className="space-y-2">
            <Label htmlFor="direction" className="text-xs">
              Tipo
            </Label>
            <Select
              value={filters.direction || 'all'}
              onValueChange={(value) => handleChange('direction', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="direction">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="credit">Créditos</SelectItem>
                <SelectItem value="debit">Débitos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Origem */}
          <div className="space-y-2">
            <Label htmlFor="sourceType" className="text-xs">
              Origem
            </Label>
            <Select
              value={filters.sourceType || 'all'}
              onValueChange={(value) => handleChange('sourceType', value)}
              disabled={isLoading}
            >
              <SelectTrigger id="sourceType">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="purchase">Recarga</SelectItem>
                <SelectItem value="usage">Uso de IA</SelectItem>
                <SelectItem value="adjustment">Ajuste</SelectItem>
                <SelectItem value="refund">Reembolso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Providers (se houver) */}
        {availableProviders.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground mr-2">Providers usados:</span>
              {availableProviders.map((provider) => (
                <span
                  key={provider}
                  className="text-xs px-2 py-1 rounded-full bg-muted capitalize"
                >
                  {provider}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
