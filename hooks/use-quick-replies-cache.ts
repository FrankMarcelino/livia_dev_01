import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuickReply } from '@/types/livechat';

// Cache global (persiste entre montagens de componentes)
const quickRepliesCache = new Map<string, {
  data: QuickReply[];
  timestamp: number;
  popular: QuickReply[];
}>();

// Controle de requisições em andamento (deduplicação)
const pendingRequests = new Map<string, Promise<QuickReply[]>>();

// Tempo de cache (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;

interface UseQuickRepliesCacheOptions {
  tenantId: string;
  enabled?: boolean;
  onError?: (error: Error) => void;
}

interface UseQuickRepliesCacheReturn {
  quickReplies: QuickReply[];
  popularQuickReplies: QuickReply[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

/**
 * Hook otimizado para carregar quick replies com cache inteligente.
 *
 * Features:
 * - ✅ Cache global (5 min TTL)
 * - ✅ Deduplicação de requisições
 * - ✅ Stale-while-revalidate
 * - ✅ Prefetch automático
 * - ✅ Error handling robusto
 * - ✅ Top 5 populares pré-computados
 *
 * @example
 * ```tsx
 * const { quickReplies, popularQuickReplies, isLoading } =
 *   useQuickRepliesCache({ tenantId: '...' });
 * ```
 */
export function useQuickRepliesCache({
  tenantId,
  enabled = true,
  onError,
}: UseQuickRepliesCacheOptions): UseQuickRepliesCacheReturn {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [popularQuickReplies, setPopularQuickReplies] = useState<QuickReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Ref para evitar race conditions
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Verifica se o cache está válido
   */
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = quickRepliesCache.get(cacheKey);
    if (!cached) return false;

    const now = Date.now();
    const age = now - cached.timestamp;

    return age < CACHE_TTL;
  }, []);

  /**
   * Carrega quick replies da API
   */
  const fetchQuickReplies = useCallback(async (
    cacheKey: string,
    signal?: AbortSignal
  ): Promise<QuickReply[]> => {
    // Deduplicação: se já há requisição em andamento, retorna a mesma Promise
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = (async () => {
      try {
        const response = await fetch(
          `/api/quick-replies?tenantId=${tenantId}`,
          { signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();
        const replies = data.data || [];

        // Atualiza cache
        const popular = replies
          .slice() // Clone para não mutar
          .sort((a: QuickReply, b: QuickReply) => b.usage_count - a.usage_count)
          .slice(0, 5);

        quickRepliesCache.set(cacheKey, {
          data: replies,
          popular,
          timestamp: Date.now(),
        });

        return replies;
      } finally {
        // Remove da lista de pendentes
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
  }, [tenantId]);

  /**
   * Carrega dados (com cache)
   */
  const loadQuickReplies = useCallback(async (
    showLoading = true
  ): Promise<void> => {
    if (!enabled || !tenantId) return;

    const cacheKey = `quick-replies:${tenantId}`;

    // Se tem cache válido, usa ele primeiro (stale-while-revalidate)
    const cached = quickRepliesCache.get(cacheKey);
    if (cached && isCacheValid(cacheKey)) {
      if (mountedRef.current) {
        setQuickReplies(cached.data);
        setPopularQuickReplies(cached.popular);
        setIsError(false);
        setError(null);
      }

      // Não faz loading se está usando cache
      showLoading = false;
    }

    // Sempre faz fetch em background (revalidate)
    if (mountedRef.current && showLoading) {
      setIsLoading(true);
    }

    try {
      // Cancela requisição anterior se houver
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      await fetchQuickReplies(
        cacheKey,
        abortControllerRef.current.signal
      );

      if (!mountedRef.current) return;

      // Atualiza estado
      const cached = quickRepliesCache.get(cacheKey);
      if (cached) {
        setQuickReplies(cached.data);
        setPopularQuickReplies(cached.popular);
      }

      setIsError(false);
      setError(null);
    } catch (err) {
      if (!mountedRef.current) return;

      // Ignora erros de abort
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const error = err instanceof Error ? err : new Error('Erro desconhecido');

      setIsError(true);
      setError(error);
      onError?.(error);

      console.error('[useQuickRepliesCache] Error loading quick replies:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [enabled, tenantId, isCacheValid, fetchQuickReplies, onError]);

  /**
   * Força recarregamento (invalida cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    const cacheKey = `quick-replies:${tenantId}`;
    quickRepliesCache.delete(cacheKey);
    await loadQuickReplies(true);
  }, [tenantId, loadQuickReplies]);

  /**
   * Invalida cache sem recarregar
   */
  const invalidate = useCallback((): void => {
    const cacheKey = `quick-replies:${tenantId}`;
    quickRepliesCache.delete(cacheKey);
  }, [tenantId]);

  // Carrega ao montar (ou quando tenantId muda)
  useEffect(() => {
    mountedRef.current = true;
    loadQuickReplies();

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, [loadQuickReplies]);

  return {
    quickReplies,
    popularQuickReplies,
    isLoading,
    isError,
    error,
    refetch,
    invalidate,
  };
}

/**
 * Hook para prefetch de quick replies (carrega em background).
 * Útil para carregar antes do usuário abrir o command.
 *
 * @example
 * ```tsx
 * // No componente pai:
 * usePrefetchQuickReplies({ tenantId });
 * ```
 */
export function usePrefetchQuickReplies({ tenantId }: { tenantId: string }) {
  useEffect(() => {
    if (!tenantId) return;

    const cacheKey = `quick-replies:${tenantId}`;

    // Se já tem cache válido, não faz nada
    const cached = quickRepliesCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) return;
    }

    // Prefetch em background (sem bloquear UI)
    fetch(`/api/quick-replies?tenantId=${tenantId}`)
      .then(res => res.json())
      .then(data => {
        const replies = data.data || [];
        const popular = replies
          .slice()
          .sort((a: QuickReply, b: QuickReply) => b.usage_count - a.usage_count)
          .slice(0, 5);

        quickRepliesCache.set(cacheKey, {
          data: replies,
          popular,
          timestamp: Date.now(),
        });
      })
      .catch(err => {
        console.warn('[usePrefetchQuickReplies] Prefetch failed:', err);
      });
  }, [tenantId]);
}
