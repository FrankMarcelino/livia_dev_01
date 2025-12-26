/**
 * Utilitários para manipulação de datas com tratamento adequado de timezone
 * 
 * Convenção do projeto:
 * - Frontend: Trabalha com objetos Date do JavaScript (local timezone)
 * - API/Backend: Espera e retorna timestamps UTC
 * - PostgreSQL: Armazena TIMESTAMP WITH TIME ZONE (UTC)
 */

import { startOfDay, endOfDay, format } from 'date-fns';

/**
 * Normaliza uma data para o início do dia em UTC
 * Útil para queries de início de período
 * 
 * @param date - Data local
 * @returns Data normalizada para início do dia (00:00:00.000) em UTC
 */
export function toUTCStartOfDay(date: Date): Date {
  const normalized = startOfDay(date);
  return new Date(Date.UTC(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate(),
    0, 0, 0, 0
  ));
}

/**
 * Normaliza uma data para o fim do dia em UTC
 * Útil para queries de fim de período
 * 
 * @param date - Data local
 * @returns Data normalizada para fim do dia (23:59:59.999) em UTC
 */
export function toUTCEndOfDay(date: Date): Date {
  const normalized = endOfDay(date);
  return new Date(Date.UTC(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate(),
    23, 59, 59, 999
  ));
}

/**
 * Formata uma data para envio ao backend (ISO 8601 UTC)
 * 
 * @param date - Data a ser formatada
 * @returns String ISO 8601 em UTC (ex: "2024-01-15T00:00:00.000Z")
 */
export function toBackendDateString(date: Date): string {
  return date.toISOString();
}

/**
 * Parse de data vinda do backend (ISO 8601 UTC)
 * 
 * @param dateString - String de data do backend
 * @returns Objeto Date
 */
export function fromBackendDateString(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Formata data para exibição no formato brasileiro
 * 
 * @param date - Data a ser formatada
 * @param formatStr - Formato desejado (padrão: dd/MM/yyyy)
 * @returns String formatada
 */
export function formatBrazilianDate(
  date: Date | string, 
  formatStr: string = 'dd/MM/yyyy'
): string {
  const dateObj = typeof date === 'string' ? fromBackendDateString(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Verifica se uma data está no futuro
 * 
 * @param date - Data a ser verificada
 * @returns true se a data for futura
 */
export function isFutureDate(date: Date): boolean {
  return date > new Date();
}

/**
 * Calcula diferença em dias entre duas datas
 * 
 * @param startDate - Data inicial
 * @param endDate - Data final
 * @returns Número de dias (inclusivo)
 */
export function getDaysDifference(startDate: Date, endDate: Date): number {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  const diffTime = end.getTime() - start.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos os dias
}

/**
 * Normaliza range de datas para envio ao backend
 * Garante que startDate seja início do dia e endDate seja fim do dia, ambos em UTC
 * 
 * @param startDate - Data de início
 * @param endDate - Data de fim
 * @returns Objeto com datas normalizadas em UTC
 */
export function normalizeeDateRange(startDate: Date, endDate: Date): {
  start: Date;
  end: Date;
  startISO: string;
  endISO: string;
} {
  const start = toUTCStartOfDay(startDate);
  const end = toUTCEndOfDay(endDate);
  
  return {
    start,
    end,
    startISO: toBackendDateString(start),
    endISO: toBackendDateString(end),
  };
}




