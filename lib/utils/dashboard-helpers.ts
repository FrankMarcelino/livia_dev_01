/**
 * Dashboard Helper Functions
 * Utility functions for formatting, calculations, and transformations
 */

import { type FormattedDuration, type FormattedCurrency } from '@/types/dashboard';

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format duration in seconds to human-readable format
 * @param seconds - Duration in seconds
 * @returns Formatted duration object
 * @example
 * formatDuration(45) // { value: 45, unit: 's', display: '45s' }
 * formatDuration(150) // { value: 2.5, unit: 'm', display: '2.5m' }
 */
export function formatDuration(seconds: number | null): FormattedDuration {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return { value: 0, unit: 's', display: '-' };
  }

  // Less than 1 minute: show seconds
  if (seconds < 60) {
    return {
      value: seconds,
      unit: 's',
      display: `${Math.round(seconds)}s`,
    };
  }

  // Less than 1 hour: show minutes
  if (seconds < 3600) {
    const minutes = seconds / 60;
    return {
      value: minutes,
      unit: 'm',
      display: `${minutes.toFixed(1)}m`,
    };
  }

  // Less than 24 hours: show hours
  if (seconds < 86400) {
    const hours = seconds / 3600;
    return {
      value: hours,
      unit: 'h',
      display: `${hours.toFixed(1)}h`,
    };
  }

  // 24 hours or more: show days
  const days = seconds / 86400;
  return {
    value: days,
    unit: 'd',
    display: `${days.toFixed(1)}d`,
  };
}

/**
 * Format seconds to compact time string (e.g., "2m 30s", "1h 5m")
 */
export function formatDurationCompact(seconds: number | null): string {
  if (seconds === null || seconds === undefined || isNaN(seconds)) {
    return '-';
  }

  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  }

  return secs > 0 ? `${minutes}m ${secs}s` : `${minutes}m`;
}

// ============================================================================
// CURRENCY FORMATTING
// ============================================================================

/**
 * Format currency value
 */
export function formatCurrency(
  value: number,
  currency: 'USD' | 'BRL' = 'USD'
): FormattedCurrency {
  if (value === null || value === undefined || isNaN(value)) {
    return { value: 0, currency, display: '-' };
  }

  const symbols = {
    USD: '$',
    BRL: 'R$',
  };

  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return {
    value,
    currency,
    display: `${symbols[currency]} ${formatted}`,
  };
}

/**
 * Format cost in USD with automatic precision
 * - < $0.01: show 4 decimals
 * - >= $0.01: show 2 decimals
 */
export function formatCostUSD(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '$0.00';
  }

  if (value < 0.01) {
    return `$${value.toFixed(4)}`;
  }

  return `$${value.toFixed(2)}`;
}

// ============================================================================
// NUMBER FORMATTING
// ============================================================================

/**
 * Format large numbers with K, M suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  if (value < 1000) {
    return value.toString();
  }

  if (value < 1000000) {
    return `${(value / 1000).toFixed(1)}K`;
  }

  return `${(value / 1000000).toFixed(1)}M`;
}

/**
 * Format percentage
 */
export function formatPercentage(
  value: number | null,
  decimals: number = 1
): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '-';
  }

  return `${value.toFixed(decimals)}%`;
}

/**
 * Format tokens with thousand separators
 */
export function formatTokens(value: number): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }

  return value.toLocaleString('pt-BR');
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

/**
 * Format ISO date string to localized date
 */
export function formatDate(
  dateStr: string,
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }
): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', options);
  } catch {
    return dateStr;
  }
}

/**
 * Format date for chart axis (short format)
 */
export function formatChartDate(dateStr: string): string {
  return formatDate(dateStr, { day: '2-digit', month: '2-digit' });
}

/**
 * Format date for tooltips (long format)
 */
export function formatTooltipDate(dateStr: string): string {
  return formatDate(dateStr, {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ============================================================================
// CHART DATA HELPERS
// ============================================================================

/**
 * Get all unique tag names from conversations by tag data
 */
export function extractTagNames(
  data: Array<Record<string, string | number>>
): string[] {
  if (!data || data.length === 0) return [];

  const tagNames = new Set<string>();

  for (const item of data) {
    for (const key of Object.keys(item)) {
      if (key !== 'date') {
        tagNames.add(key);
      }
    }
  }

  return Array.from(tagNames).sort();
}

/**
 * Generate color palette for charts
 */
export function getChartColor(index: number): string {
  const colors = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ];

  return colors[index % colors.length];
}

/**
 * Get color for tag (if tag has specific color in DB)
 */
export function getTagColor(tagName: string, index: number): string {
  // TODO: Fetch tag colors from database if needed
  // For now, use chart color palette
  return getChartColor(index);
}

// ============================================================================
// HEATMAP HELPERS
// ============================================================================

/**
 * Get day name from day of week number
 */
export function getDayName(dayOfWeek: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return days[dayOfWeek] || '';
}

/**
 * Get full day name
 */
export function getFullDayName(dayOfWeek: number): string {
  const days = [
    'Domingo',
    'Segunda',
    'Terça',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sábado',
  ];
  return days[dayOfWeek] || '';
}

/**
 * Calculate heatmap intensity (0-1) for color mapping
 */
export function calculateHeatmapIntensity(
  value: number,
  maxValue: number
): number {
  if (maxValue === 0) return 0;
  return Math.min(value / maxValue, 1);
}

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (!values || values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate median from array of numbers
 */
export function calculateMedian(values: number[]): number {
  if (!values || values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
}

/**
 * Calculate percentile
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (!values || values.length === 0) return 0;

  const sorted = [...values].sort((a, b) => a - b);
  const index = (percentile / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sorted[lower];
  }

  return sorted[lower] * (1 - weight) + sorted[upper] * weight;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if value is valid number
 */
export function isValidNumber(value: any): boolean {
  return typeof value === 'number' && !isNaN(value) && isFinite(value);
}

/**
 * Safe division (returns 0 if denominator is 0)
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ============================================================================
// EMPTY STATE HELPERS
// ============================================================================

/**
 * Check if dashboard has any data
 */
export function hasAnyData(kpis: { totalConversations: number }): boolean {
  return kpis.totalConversations > 0;
}

/**
 * Get empty state message based on filters
 */
export function getEmptyStateMessage(hasFilters: boolean): string {
  if (hasFilters) {
    return 'Nenhum dado encontrado para os filtros selecionados.';
  }
  return 'Nenhuma conversa encontrada neste período.';
}
