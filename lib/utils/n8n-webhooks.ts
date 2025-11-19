/**
 * N8N Webhooks Helper
 *
 * Função helper para chamar webhooks N8N com error handling robusto.
 *
 * Features:
 * - Modo mock para desenvolvimento (N8N_MOCK=true)
 * - Timeout de 10 segundos
 * - Error handling que não bloqueia CRUD
 * - Logs detalhados
 */

const N8N_BASE_URL = process.env.N8N_BASE_URL;
const N8N_MOCK = process.env.N8N_MOCK === 'true';

interface N8nWebhookResponse {
  success: boolean;
  mock?: boolean;
  error?: unknown;
}

/**
 * Chama webhook N8N com error handling
 *
 * @param endpoint - Caminho do webhook (ex: /webhook/livia/sync-synapse)
 * @param payload - Dados a enviar
 * @returns Resultado da chamada (não lança erro)
 */
export async function callN8nWebhook(
  endpoint: string,
  payload: unknown
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.log('[N8N MOCK] Webhook chamado:', endpoint, payload);
    return { success: true, mock: true };
  }

  // Validar configuração
  if (!N8N_BASE_URL) {
    console.error('[N8N ERROR] N8N_BASE_URL não configurado');
    return { success: false, error: 'N8N_BASE_URL não configurado' };
  }

  try {
    const url = `${N8N_BASE_URL}${endpoint}`;

    console.log('[N8N] Chamando webhook:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    console.log('[N8N] Webhook chamado com sucesso:', endpoint);
    return { success: true };
  } catch (error) {
    // Log erro mas não lança exceção (não bloqueia CRUD)
    console.error('[N8N ERROR] Falha ao chamar webhook:', endpoint, error);
    return { success: false, error };
  }
}

/**
 * Payloads para webhooks N8N
 */

export interface SyncSynapsePayload {
  synapseId: string;
  baseConhecimentoId: string;
  tenantId: string;
  operation: 'create' | 'update';
  content: string;
  title: string;
}

export interface DeleteSynapseEmbeddingsPayload {
  synapseId: string;
  tenantId: string;
}

export interface ToggleSynapseEmbeddingsPayload {
  synapseId: string;
  tenantId: string;
  isEnabled: boolean;
}

export interface InactivateBasePayload {
  baseConhecimentoId: string;
  tenantId: string;
  isActive: boolean;
}

/**
 * Funções tipadas para cada webhook
 */

export async function syncSynapseWebhook(payload: SyncSynapsePayload) {
  return callN8nWebhook(
    process.env.N8N_SYNC_SYNAPSE_WEBHOOK || '/webhook/livia/sync-synapse',
    payload
  );
}

export async function deleteSynapseEmbeddingsWebhook(
  payload: DeleteSynapseEmbeddingsPayload
) {
  return callN8nWebhook(
    process.env.N8N_DELETE_SYNAPSE_EMBEDDINGS_WEBHOOK ||
      '/webhook/livia/delete-synapse-embeddings',
    payload
  );
}

export async function toggleSynapseEmbeddingsWebhook(
  payload: ToggleSynapseEmbeddingsPayload
) {
  return callN8nWebhook(
    process.env.N8N_TOGGLE_SYNAPSE_EMBEDDINGS_WEBHOOK ||
      '/webhook/livia/toggle-synapse-embeddings',
    payload
  );
}

export async function inactivateBaseWebhook(payload: InactivateBasePayload) {
  return callN8nWebhook(
    process.env.N8N_INACTIVATE_BASE_WEBHOOK || '/webhook/livia/inactivate-base',
    payload
  );
}
