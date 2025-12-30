import { useState, useEffect, useCallback, useRef } from 'react';
import type { QuickReply } from '@/types/livechat';

// Cache global simplificado (persiste entre montagens)
// Estrutura: Map<cacheKey, { data, timestamp, total }>
interface CacheEntry {
  data: QuickReply[];
  timestamp: number;
  total: number;
}

interface FetchResult {
  data: QuickReply[];
  total: number;
  hasMore: boolean;
}

const quickRepliesCache = new Map<string, CacheEntry>();

// Controle de requisições em andamento (deduplicação)
const pendingRequests = new Map<string, Promise<FetchResult>>();

// Tempo de cache (3 minutos - reduzido para busca atualizar mais rápido)
const CACHE_TTL = 3 * 60 * 1000;

// Limite máximo de entradas no cache (previne memory leak)
const MAX_CACHE_ENTRIES = 50;

interface UseQuickRepliesCacheOptions {
  tenantId: string;
  enabled?: boolean;
  limit?: number;
  search?: string;
  onError?: (error: Error) => void;
}

interface UseQuickRepliesCacheReturn {
  quickReplies: QuickReply[];
  popularQuickReplies: QuickReply[];
  total: number;
  hasMore: boolean;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
  loadMore: () => Promise<void>;
}

/**
 * Hook otimizado para carregar quick replies com paginação e busca server-side.
 *
 * Features:
 * - ✅ Paginação automática (limit/offset)
 * - ✅ Busca server-side (PostgreSQL ilike)
 * - ✅ Cache inteligente com TTL
 * - ✅ Deduplicação de requisições
 * - ✅ Top 5 populares pré-computados
 * - ✅ Load more (scroll infinito)
 *
 * @example
 * ```tsx
 * const { quickReplies, isLoading, loadMore, hasMore } =
 *   useQuickRepliesCache({ tenantId: '...', search: 'olá', limit: 20 });
 * ```
 */
export function useQuickRepliesCache({
  tenantId,
  enabled = true,
  limit = 20,
  search,
  onError,
}: UseQuickRepliesCacheOptions): UseQuickRepliesCacheReturn {
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [popularQuickReplies, setPopularQuickReplies] = useState<QuickReply[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [offset, setOffset] = useState(0);

  // Ref para evitar race conditions
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Gera cache key baseado em tenantId e search
   */
  const getCacheKey = useCallback((searchTerm?: string): string => {
    return searchTerm
      ? `quick-replies:${tenantId}:search:${searchTerm}`
      : `quick-replies:${tenantId}`;
  }, [tenantId]);

  /**
   * Limpa cache antigo quando atinge limite
   */
  const cleanOldCache = useCallback(() => {
    if (quickRepliesCache.size >= MAX_CACHE_ENTRIES) {
      // Remove 10 entradas mais antigas
      const entries = Array.from(quickRepliesCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      for (let i = 0; i < 10 && i < entries.length; i++) {
        const entry = entries[i];
        if (entry) {
          quickRepliesCache.delete(entry[0]);
        }
      }
    }
  }, []);

  /**
   * Carrega quick replies da API com paginação
   */
  const fetchQuickReplies = useCallback(async (
    currentOffset: number,
    searchTerm?: string,
    signal?: AbortSignal
  ): Promise<{ data: QuickReply[]; total: number; hasMore: boolean }> => {
    // Monta URL com params
    const params = new URLSearchParams({
      tenantId,
      limit: String(limit),
      offset: String(currentOffset),
    });

    if (searchTerm) {
      params.set('search', searchTerm);
    }

    const cacheKey = `${getCacheKey(searchTerm)}:${currentOffset}`;

    // Deduplicação: se já há requisição em andamento, retorna a mesma Promise
    const pending = pendingRequests.get(cacheKey);
    if (pending) {
      return pending;
    }

    const request = (async () => {
      try {
        const response = await fetch(
          `/api/quick-replies?${params.toString()}`,
          { signal }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const result = await response.json();

        // Limpa cache antigo se necessário
        cleanOldCache();

        // Atualiza cache
        quickRepliesCache.set(cacheKey, {
          data: result.data || [],
          timestamp: Date.now(),
          total: result.total || 0,
        });

        return {
          data: result.data || [],
          total: result.total || 0,
          hasMore: result.hasMore || false,
        };
      } finally {
        // Remove da lista de pendentes
        pendingRequests.delete(cacheKey);
      }
    })();

    pendingRequests.set(cacheKey, request);
    return request;
  }, [tenantId, limit, getCacheKey, cleanOldCache]);

  /**
   * Carrega dados (primeira página ou busca)
   */
  const loadQuickReplies = useCallback(async (
    reset: boolean = false
  ): Promise<void> => {
    if (!enabled || !tenantId) return;

    if (reset) {
      setOffset(0);
      setQuickReplies([]);
    }

    if (mountedRef.current) {
      setIsLoading(true);
    }

    try {
      // Cancela requisição anterior se houver
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      const result = await fetchQuickReplies(
        reset ? 0 : offset,
        search,
        abortControllerRef.current.signal
      );

      if (!mountedRef.current) return;

      // Se reset, substitui. Se não, acumula (load more)
      if (reset) {
        setQuickReplies(result.data);
        setOffset(result.data.length);
      } else {
        setQuickReplies(prev => [...prev, ...result.data]);
        setOffset(prev => prev + result.data.length);
      }

      setTotal(result.total);
      setHasMore(result.hasMore);

      // Calcula top 5 populares (apenas da primeira página)
      if (reset || popularQuickReplies.length === 0) {
        const popular = result.data
          .slice()
          .sort((a, b) => b.usage_count - a.usage_count)
          .slice(0, 5);
        setPopularQuickReplies(popular);
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
  }, [enabled, tenantId, search, offset, fetchQuickReplies, popularQuickReplies.length, onError]);

  /**
   * Carrega mais itens (scroll infinito)
   */
  const loadMore = useCallback(async (): Promise<void> => {
    if (!hasMore || isLoading) return;
    await loadQuickReplies(false);
  }, [hasMore, isLoading, loadQuickReplies]);

  /**
   * Força recarregamento (invalida cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    // Limpa cache de todas as páginas desta busca
    const baseCacheKey = getCacheKey(search);
    const keysToDelete = Array.from(quickRepliesCache.keys())
      .filter(key => key.startsWith(baseCacheKey));

    keysToDelete.forEach(key => quickRepliesCache.delete(key));

    await loadQuickReplies(true);
  }, [getCacheKey, search, loadQuickReplies]);

  /**
   * Invalida cache sem recarregar
   */
  const invalidate = useCallback((): void => {
    const baseCacheKey = getCacheKey(search);
    const keysToDelete = Array.from(quickRepliesCache.keys())
      .filter(key => key.startsWith(baseCacheKey));

    keysToDelete.forEach(key => quickRepliesCache.delete(key));
  }, [getCacheKey, search]);

  // Efeito: Carrega ao montar ou quando search muda
  useEffect(() => {
    mountedRef.current = true;
    loadQuickReplies(true); // Reset ao mudar search

    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, enabled]); // Recarrega quando search ou enabled mudam

  return {
    quickReplies,
    popularQuickReplies,
    total,
    hasMore,
    isLoading,
    isError,
    error,
    refetch,
    invalidate,
    loadMore,
  };
}

/**
 * Hook para prefetch de quick replies (carrega primeira página em background).
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

    const cacheKey = `quick-replies:${tenantId}:0`;

    // Se já tem cache válido, não faz nada
    const cached = quickRepliesCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) return;
    }

    // Prefetch primeira página em background (sem bloquear UI)
    const params = new URLSearchParams({
      tenantId,
      limit: '20', // Primeira página pequena
      offset: '0',
    });

    fetch(`/api/quick-replies?${params.toString()}`)
      .then(res => res.json())
      .then(result => {
        quickRepliesCache.set(cacheKey, {
          data: result.data || [],
          timestamp: Date.now(),
          total: result.total || 0,
        });
      })
      .catch(err => {
        console.warn('[usePrefetchQuickReplies] Prefetch failed:', err);
      });
  }, [tenantId]);
}
