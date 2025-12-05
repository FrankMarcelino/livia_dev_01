import { useState, useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Opções configuráveis para o hook useApiCall
 */
export interface UseApiCallOptions<T = any> {
  /** Callback executado em caso de sucesso */
  onSuccess?: (data: T) => void;
  /** Callback executado em caso de erro */
  onError?: (error: Error) => void;
  /** Mensagem de sucesso exibida no toast */
  successMessage?: string;
  /** Mensagem de erro customizada (padrão: error.message) */
  errorMessage?: string;
  /** Se true, não exibe toast de erro automaticamente */
  suppressErrorToast?: boolean;
  /** Se true, não exibe toast de sucesso automaticamente */
  suppressSuccessToast?: boolean;
}

/**
 * Resultado retornado pelo hook useApiCall
 */
export interface UseApiCallResult<T = any> {
  /** Função para executar a chamada API */
  execute: (body?: any) => Promise<T | null>;
  /** Indica se a requisição está em andamento */
  isLoading: boolean;
  /** Erro da última requisição (ou null se sucesso) */
  error: Error | null;
  /** Limpa o estado de erro */
  clearError: () => void;
}

/**
 * Hook para abstrair chamadas API com loading e error handling consistente.
 *
 * Elimina violações de DIP (Dependency Inversion Principle) ao centralizar
 * toda lógica de fetch, error handling e toast notifications.
 *
 * @example
 * ```tsx
 * const { execute, isLoading } = useApiCall('/api/conversations/pause', 'POST', {
 *   successMessage: 'Conversa pausada!',
 *   onSuccess: () => refetch()
 * });
 *
 * await execute({ conversationId, tenantId });
 * ```
 */
export function useApiCall<T = any>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST',
  options?: UseApiCallOptions<T>
): UseApiCallResult<T> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const execute = useCallback(
    async (body?: any): Promise<T | null> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: body ? JSON.stringify(body) : undefined,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP ${response.status}: ${response.statusText}`
          );
        }

        const data = await response.json();

        // Success callback
        if (options?.onSuccess) {
          options.onSuccess(data);
        }

        // Success toast
        if (options?.successMessage && !options?.suppressSuccessToast) {
          toast.success(options.successMessage);
        }

        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);

        console.error(`[useApiCall] ${method} ${url}:`, error);

        // Error callback
        if (options?.onError) {
          options.onError(error);
        }

        // Error toast
        if (!options?.suppressErrorToast) {
          toast.error(options?.errorMessage || error.message);
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, options]
  );

  return { execute, isLoading, error, clearError };
}
