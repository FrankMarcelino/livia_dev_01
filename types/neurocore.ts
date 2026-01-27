/**
 * Types para o módulo Validação de Respostas (Neurocore)
 *
 * Interface de testes onde o usuário faz perguntas
 * para validar se a IA responde corretamente antes de ativar em produção.
 */

/**
 * Query de validação feita pelo usuário
 * Estado local apenas (não persiste no banco)
 */
export interface TrainingQuery {
  id: string; // UUID gerado no frontend
  question: string;
  createdAt: Date;
  response?: TrainingResponse;
  feedbackSubmitted?: boolean;
}

/**
 * Resposta da IA para uma query de validação
 */
export interface TrainingResponse {
  answer: string; // Resposta em markdown
  basesUsed: BaseUsed[]; // Bases de conhecimento usadas
  processingTime?: number; // Tempo em ms
  confidence?: number; // Score de confiança (0-1)
}

/**
 * Base de Conhecimento utilizada para gerar a resposta
 * Inclui score de similaridade vetorial
 */
export interface BaseUsed {
  id: string;
  title: string;
  content: string;
  description: string | null;
  score: number; // Similaridade vetorial (0-1)
  baseConhecimentoId: string;
}

/**
 * @deprecated Use BaseUsed instead
 * Mantido para compatibilidade temporária
 */
export type SynapseUsed = BaseUsed;

/**
 * Feedback do usuário sobre uma resposta
 */
export interface ResponseFeedback {
  queryId: string; // ID local da query
  feedbackType: 'like' | 'dislike';
  comment?: string;
  context: FeedbackContext; // Contexto salvo em message_feedbacks.comment (JSON)
}

/**
 * Contexto do feedback salvo como JSON
 * Permite rastrear o que foi avaliado mesmo sem histórico de queries
 */
export interface FeedbackContext {
  type: 'neurocore_training';
  question: string;
  answer: string;
  basesUsed: string[]; // IDs das bases de conhecimento usadas
  timestamp: string;
}

/**
 * Payload para API route de query
 */
export interface NeurocoreQueryRequest {
  question: string;
  tenantId: string;
}

/**
 * Response da API route
 */
export interface NeurocoreQueryResponse {
  success: boolean;
  data?: TrainingResponse;
  error?: string;
}

/**
 * Payload para Server Action de feedback
 */
export interface SubmitFeedbackPayload {
  tenantId: string;
  feedbackType: 'like' | 'dislike';
  context: FeedbackContext;
  comment?: string;
}

/**
 * Resultado de Server Action
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: unknown;
}

/**
 * Mock response para desenvolvimento sem n8n
 */
export interface MockTrainingResponse {
  answer: string;
  basesUsed: Array<{
    id: string;
    title: string;
    content: string;
    description: string | null;
    score: number;
    baseConhecimentoId: string;
  }>;
  processingTime: number;
}
