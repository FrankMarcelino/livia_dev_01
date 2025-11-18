import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Substitui variáveis dinâmicas em mensagens quick reply
 *
 * Variáveis suportadas:
 * - {nome_cliente} - Nome do contato
 * - {protocolo} - ID da conversa
 * - {data} - Data atual (dd/MM/yyyy)
 * - {hora} - Hora atual (HH:mm)
 */
export function replaceQuickReplyVariables(
  message: string,
  context: {
    contactName: string;
    conversationId: string;
  }
): string {
  const now = new Date();

  return message
    .replace(/{nome_cliente}/g, context.contactName || 'Cliente')
    .replace(/{protocolo}/g, context.conversationId)
    .replace(/{data}/g, format(now, 'dd/MM/yyyy', { locale: ptBR }))
    .replace(/{hora}/g, format(now, 'HH:mm', { locale: ptBR }));
}
