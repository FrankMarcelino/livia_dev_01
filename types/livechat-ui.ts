import type { ConversationWithContact } from './livechat';
import type { ConversationStatus, MessageSenderType } from './database-helpers';

/**
 * Tipos otimizados para UI do Livechat
 *
 * Interface Segregation Principle (ISP):
 * Cada tipo contém apenas os dados necessários para sua camada específica.
 */

/**
 * Dados otimizados para renderizar card de conversa
 *
 * Contém apenas os campos necessários para exibir um card na lista,
 * evitando passar objetos completos para componentes de UI.
 *
 * @example
 * ```tsx
 * function ConversationCard({ data }: { data: ConversationCardData }) {
 *   return (
 *     <div>
 *       <h3>{data.contact.name}</h3>
 *       <p>{data.lastMessage?.content || 'Sem mensagens'}</p>
 *       <Badge>{data.status}</Badge>
 *     </div>
 *   );
 * }
 * ```
 */
export interface ConversationCardData {
  /** ID único da conversa */
  id: string;

  /** Status atual (open, paused, closed) */
  status: ConversationStatus;

  /** Se a IA está ativa nesta conversa */
  iaActive: boolean;

  /** Timestamp da última atividade */
  lastMessageAt: string;

  /** Dados essenciais do contato (sempre presentes) */
  contact: {
    /** ID do contato */
    id: string;
    /** Nome do contato */
    name: string;
    /** Telefone do contato */
    phone: string;
  };

  /** Preview da última mensagem (null se não houver) */
  lastMessage: {
    /** ID da mensagem */
    id: string;
    /** Conteúdo da mensagem */
    content: string;
    /** Timestamp da mensagem */
    timestamp: string;
    /** Tipo de remetente (client, ai, attendant) */
    senderType: MessageSenderType;
  } | null;
}

/**
 * Converte ConversationWithContact para ConversationCardData
 *
 * Transforma tipo de dados completo em tipo otimizado para UI,
 * garantindo que componentes recebam apenas dados necessários.
 *
 * @param conversation - Conversa completa do banco
 * @returns Dados otimizados para card de UI
 *
 * @example
 * ```typescript
 * const conversations = await getConversations();
 * const cardsData = conversations.map(toCardData);
 *
 * return (
 *   <div>
 *     {cardsData.map(data => (
 *       <ConversationCard key={data.id} data={data} />
 *     ))}
 *   </div>
 * );
 * ```
 */
export function toCardData(
  conversation: ConversationWithContact
): ConversationCardData {
  return {
    id: conversation.id,
    status: conversation.status,
    iaActive: conversation.ia_active,
    lastMessageAt: conversation.last_message_at || conversation.created_at,
    contact: {
      id: conversation.contact.id,
      name: conversation.contact.name,
      phone: conversation.contact.phone,
    },
    lastMessage: conversation.lastMessage
      ? {
          id: conversation.lastMessage.id,
          content: conversation.lastMessage.content,
          timestamp: conversation.lastMessage.timestamp,
          senderType: conversation.lastMessage.sender_type,
        }
      : null,
  };
}

/**
 * Converte array de conversas para array de cards
 *
 * @param conversations - Lista de conversas completas
 * @returns Lista de dados otimizados para UI
 *
 * @example
 * ```typescript
 * const conversations = await getConversations();
 * const cardsData = toCardsData(conversations);
 * ```
 */
export function toCardsData(
  conversations: ConversationWithContact[]
): ConversationCardData[] {
  return conversations.map(toCardData);
}
