/**
 * Types para Base de Conhecimento (Synapses)
 */

/**
 * Status possíveis de uma synapse durante seu ciclo de vida
 */
export type SynapseStatus = 'draft' | 'indexing' | 'publishing' | 'error';

/**
 * Synapse - Unidade de conhecimento da base
 *
 * Fluxo de publicação:
 * 1. draft → Criada, pode ser editada
 * 2. indexing → Enviada para n8n processar
 * 3. publishing → Embeddings criados, IA usando
 * 4. error → Falha no processamento
 */
export interface Synapse {
  id: string;
  base_conhecimento_id: string;
  tenant_id: string;
  title: string;
  content: string;
  description: string | null;
  image_url: string | null;
  status: SynapseStatus;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Dados para criar uma nova synapse
 */
export interface CreateSynapseData {
  title: string;
  content: string;
  description?: string;
  image_url?: string;
}

/**
 * Dados para atualizar uma synapse existente
 */
export interface UpdateSynapseData {
  title?: string;
  content?: string;
  description?: string | null;
  image_url?: string | null;
  is_enabled?: boolean;
}

/**
 * Filtros para listagem de synapses
 */
export interface SynapsesFilters {
  status?: SynapseStatus;
  is_enabled?: boolean;
  search?: string; // Busca em title/description
}
