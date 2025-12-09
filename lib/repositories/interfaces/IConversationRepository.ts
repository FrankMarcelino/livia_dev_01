import type { ConversationWithContact, ConversationFilters } from '@/types/livechat';
import type { Contact } from '@/types/database-helpers';

/**
 * Interface de Repository para Conversas
 *
 * Define o contrato para acesso a dados de conversas,
 * seguindo o Dependency Inversion Principle (DIP).
 *
 * Implementações concretas podem usar Supabase, API REST, ou qualquer outro provider.
 */
export interface IConversationRepository {
  /**
   * Busca conversa por ID com validação de tenant
   *
   * @param conversationId - ID da conversa
   * @param tenantId - ID do tenant (validação de segurança)
   * @returns Conversa com dados do contato e última mensagem, ou null se não encontrada
   *
   * @example
   * ```typescript
   * const conversation = await repository.getById('conv-123', 'tenant-1');
   * if (conversation) {
   *   console.log(conversation.contact.name);
   *   console.log(conversation.lastMessage?.content);
   * }
   * ```
   */
  getById(
    conversationId: string,
    tenantId: string
  ): Promise<ConversationWithContact | null>;

  /**
   * Busca todas conversas de um tenant com filtros opcionais
   *
   * @param tenantId - ID do tenant
   * @param filters - Filtros opcionais (status, search, includeClosedConversations)
   * @returns Lista de conversas ordenadas
   *
   * @example
   * ```typescript
   * // Buscar apenas conversas abertas
   * const openConversations = await repository.getByTenant('tenant-1', {
   *   includeClosedConversations: false
   * });
   *
   * // Buscar com filtro de busca
   * const filtered = await repository.getByTenant('tenant-1', {
   *   search: 'João'
   * });
   * ```
   */
  getByTenant(
    tenantId: string,
    filters?: ConversationFilters
  ): Promise<ConversationWithContact[]>;

  /**
   * Busca dados de um contato (com cache)
   *
   * Esta função implementa cache local para evitar queries repetidas
   * ao mesmo contato durante eventos realtime.
   *
   * @param contactId - ID do contato
   * @param tenantId - ID do tenant (validação de segurança)
   * @returns Dados do contato ou null se não encontrado
   *
   * @example
   * ```typescript
   * // Primeira chamada: busca no banco
   * const contact1 = await repository.getContactById('contact-1', 'tenant-1');
   *
   * // Segunda chamada: retorna do cache (sem query)
   * const contact2 = await repository.getContactById('contact-1', 'tenant-1');
   * ```
   */
  getContactById(
    contactId: string,
    tenantId: string
  ): Promise<Contact | null>;

  /**
   * Limpa cache de contatos
   *
   * Deve ser chamado quando necessário invalidar o cache
   * (ex: após atualização de dados de contato).
   *
   * @example
   * ```typescript
   * // Após atualizar contato, limpar cache
   * await updateContact(contactId, newData);
   * repository.clearCache();
   * ```
   */
  clearCache(): void;
}
