import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Configuração de subscrição realtime
 */
export interface RealtimeSubscriptionConfig {
  /** Nome do canal (único por subscrição) */
  channel: string;

  /** Tabela do banco de dados para monitorar */
  table: string;

  /** Tipo de evento (INSERT, UPDATE, DELETE) */
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';

  /** Schema do banco (geralmente 'public') */
  schema?: string;

  /** Filtro opcional (ex: 'tenant_id=eq.123') */
  filter?: string;
}

/**
 * Payload de evento realtime (genérico)
 */
export interface RealtimePayload<T> {
  /** Novos dados (após INSERT ou UPDATE) */
  new: T;

  /** Dados antigos (antes de UPDATE ou DELETE) */
  old: Partial<T>;

  /** Tipo do evento */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';

  /** Schema da tabela */
  schema: string;

  /** Nome da tabela */
  table: string;

  /** Timestamp do commit */
  commit_timestamp: string;
}

/**
 * Interface de Serviço Realtime
 *
 * Abstrai a implementação de realtime (Supabase, Pusher, etc),
 * seguindo o Dependency Inversion Principle (DIP).
 *
 * @example
 * ```typescript
 * const realtimeService: IRealtimeService = new SupabaseRealtimeService();
 *
 * const channel = realtimeService.subscribe({
 *   channel: 'conversations',
 *   table: 'conversations',
 *   event: 'UPDATE',
 *   filter: 'tenant_id=eq.123',
 * }, (payload) => {
 *   console.log('Conversa atualizada:', payload.new);
 * });
 *
 * // Limpar subscrição
 * realtimeService.unsubscribe(channel);
 * ```
 */
export interface IRealtimeService {
  /**
   * Cria uma subscrição realtime com callback tipado
   *
   * @param config - Configuração da subscrição
   * @param callback - Função executada quando evento ocorre
   * @returns Channel para controle da subscrição
   */
  subscribe<T>(
    config: RealtimeSubscriptionConfig,
    callback: (payload: RealtimePayload<T>) => void | Promise<void>
  ): RealtimeChannel;

  /**
   * Remove subscrição e limpa recursos
   *
   * @param channel - Channel a ser removido
   */
  unsubscribe(channel: RealtimeChannel): void;
}
