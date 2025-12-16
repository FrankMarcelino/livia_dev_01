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
    console.warn('[N8N MOCK] Webhook chamado:', endpoint, payload);
    return { success: true, mock: true };
  }

  // Validar configuração
  if (!N8N_BASE_URL) {
    console.error('[N8N ERROR] N8N_BASE_URL não configurado');
    return { success: false, error: 'N8N_BASE_URL não configurado' };
  }

  try {
    const url = `${N8N_BASE_URL}${endpoint}`;

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

/**
 * Payload para criar vetor de base de conhecimento
 */
export interface CreateBaseConhecimentoVectorPayload {
  id_base_conhecimento_geral: string;
}

/**
 * Chama N8N para criar vetor de base de conhecimento
 *
 * POST /webhook/create_base_conhecimento_geral
 * Body: { id_base_conhecimento_geral: "uuid" }
 *
 * O N8N vai:
 * 1. Buscar o conteúdo (description) da base
 * 2. Fazer chunking do conteúdo
 * 3. Gerar embeddings
 * 4. Criar registro em base_conhecimentos_vectors
 * 5. Atualizar base_conhecimentos:
 *    - base_conhecimentos_vectors = vector_id
 *    - is_active = true
 */
export async function createBaseConhecimentoVectorWebhook(
  payload: CreateBaseConhecimentoVectorPayload
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.warn('[N8N MOCK] Create Base Vector:', payload);
    return { success: true, mock: true };
  }

  try {
    const url =
      process.env.N8N_CREATE_BASE_VECTOR_URL ||
      'https://acesse.ligeiratelecom.com.br/webhook/create_base_conhecimento_geral';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout (processamento pode demorar)
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR] Falha ao criar vetor:', error);
    return { success: false, error };
  }
}

/**
 * Chama N8N para atualizar vetor de base de conhecimento
 *
 * PATCH /webhook/update_vetor_base_conhecimento
 * Body: { id_base_conhecimento_geral: "uuid" }
 *
 * O N8N vai:
 * 1. Deletar vector antigo da base
 * 2. Buscar novo conteúdo (description)
 * 3. Fazer chunking
 * 4. Gerar novos embeddings
 * 5. Criar novo registro em base_conhecimentos_vectors
 * 6. Atualizar base_conhecimentos:
 *    - base_conhecimentos_vectors = novo_vector_id
 *    - is_active = true
 */
export async function updateBaseConhecimentoVectorWebhook(
  payload: CreateBaseConhecimentoVectorPayload
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.warn('[N8N MOCK] Update Base Vector:', payload);
    return { success: true, mock: true };
  }

  try {
    const url =
      process.env.N8N_UPDATE_BASE_VECTOR_URL ||
      'https://acesse.ligeiratelecom.com.br/webhook/update_vetor_base_conhecimento';

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR] Falha ao atualizar vetor:', error);
    return { success: false, error };
  }
}

/**
 * Chama N8N para deletar vetor de base de conhecimento
 *
 * DELETE /webhook/delete_vetor_base_conhecimento
 * Body: { id_base_conhecimento_geral: "uuid" }
 *
 * O N8N vai:
 * 1. Deletar o registro em base_conhecimentos_vectors
 * 2. Remover os embeddings do vector store
 */
export async function deleteBaseConhecimentoVectorWebhook(
  payload: CreateBaseConhecimentoVectorPayload
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.warn('[N8N MOCK] Delete Base Vector:', payload);
    return { success: true, mock: true };
  }

  try {
    const url =
      process.env.N8N_DELETE_BASE_VECTOR_URL ||
      'https://acesse.ligeiratelecom.com.br/webhook/delete_vetor_base_conhecimento';

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR] Falha ao deletar vetor:', error);
    return { success: false, error };
  }
}

/**
 * Chama N8N para desabilitar vetor de base de conhecimento
 *
 * PATCH /webhook/disable_vetor_base_conhecimento
 * Body: { id_base_conhecimento_geral: "uuid" }
 *
 * O N8N vai:
 * 1. Marcar os embeddings como inativos no vector store
 * 2. Não deleta, apenas desabilita para uso sazonal
 */
export async function disableBaseConhecimentoVectorWebhook(
  payload: CreateBaseConhecimentoVectorPayload
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.warn('[N8N MOCK] Disable Base Vector:', payload);
    return { success: true, mock: true };
  }

  try {
    const url =
      process.env.N8N_DISABLE_BASE_VECTOR_URL ||
      'https://acesse.ligeiratelecom.com.br/webhook/disable_vetor_base_conhecimento';

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR] Falha ao desabilitar vetor:', error);
    return { success: false, error };
  }
}

/**
 * Chama N8N para habilitar/reativar vetor de base de conhecimento
 *
 * PATCH /webhook/enable_vetor_base_conhecimento
 * Body: { id_base_conhecimento_geral: "uuid" }
 *
 * O N8N vai:
 * 1. Marcar os embeddings como ativos no vector store
 * 2. Reativa a base para uso sazonal
 */
export async function enableBaseConhecimentoVectorWebhook(
  payload: CreateBaseConhecimentoVectorPayload
): Promise<N8nWebhookResponse> {
  // Modo mock: apenas loga e retorna sucesso
  if (N8N_MOCK) {
    console.warn('[N8N MOCK] Enable Base Vector:', payload);
    return { success: true, mock: true };
  }

  try {
    const url =
      process.env.N8N_ENABLE_BASE_VECTOR_URL ||
      'https://acesse.ligeiratelecom.com.br/webhook/enable_vetor_base_conhecimento';

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new Error(`N8N HTTP error: ${response.status} ${response.statusText}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR] Falha ao habilitar vetor:', error);
    return { success: false, error };
  }
}
