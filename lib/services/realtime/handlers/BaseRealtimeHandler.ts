import type { ConversationWithContact } from '@/types/livechat';
import type { IConversationRepository } from '@/lib/repositories/interfaces/IConversationRepository';
import type { RealtimePayload } from '@/lib/services/interfaces/IRealtimeService';

/**
 * Contexto compartilhado entre handlers
 *
 * Fornece acesso a dependencies necessárias para processar eventos.
 */
export interface HandlerContext {
  /** ID do tenant (para validação e queries) */
  tenantId: string;

  /** Repository para buscar dados adicionais se necessário */
  repository: IConversationRepository;
}

/**
 * Interface base para Event Handlers de Realtime
 *
 * Open/Closed Principle (OCP):
 * - Fechado para modificação: interface estável
 * - Aberto para extensão: novos handlers podem ser adicionados
 *
 * Single Responsibility Principle (SRP):
 * - Cada handler tem UMA única responsabilidade (processar um tipo de evento)
 *
 * @template T - Tipo de dados do evento (Conversation, Message, etc)
 *
 * @example
 * ```typescript
 * class ConversationUpdateHandler implements RealtimeEventHandler<Conversation> {
 *   async handle(payload, currentState, context) {
 *     const updatedConversation = payload.new;
 *     // Lógica para atualizar estado...
 *     return newState;
 *   }
 * }
 * ```
 */
export interface RealtimeEventHandler<T> {
  /**
   * Processa evento realtime e retorna novo estado
   *
   * IMPORTANTE:
   * - Deve ser PURO (não modificar currentState)
   * - Deve retornar novo array (imutabilidade)
   * - Pode ser assíncrono (buscar dados adicionais)
   *
   * @param payload - Payload do evento realtime (new, old, etc)
   * @param currentState - Estado atual da lista de conversas
   * @param context - Contexto com tenantId e repository
   * @returns Novo estado (imutável)
   *
   * @example
   * ```typescript
   * async handle(payload, currentState, context) {
   *   // Buscar dados se necessário
   *   if (!exists) {
   *     const newData = await context.repository.getById(...);
   *   }
   *
   *   // Retornar novo estado (imutável)
   *   return [...currentState, newItem];
   * }
   * ```
   */
  handle(
    payload: RealtimePayload<T>,
    currentState: ConversationWithContact[],
    context: HandlerContext
  ): Promise<ConversationWithContact[]>;
}
