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

/**
 * Base de Conhecimento - Agrupa synapses relacionadas
 *
 * Estrutura hierárquica:
 * Base de Conhecimento → Synapses
 *
 * Exemplos:
 * - Base: "Políticas de Devolução" → Synapses sobre prazos, produtos não devolúveis, etc.
 * - Base: "Suporte Técnico" → Synapses sobre reset de senha, problemas de login, etc.
 */
export interface BaseConhecimento {
  id: string;
  tenant_id: string;
  neurocore_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Base de Conhecimento com contagem de synapses
 *
 * Usado na listagem de bases para exibir quantidade de synapses
 */
export interface BaseConhecimentoWithCount extends BaseConhecimento {
  synapses_count: number;
}

/**
 * Base de Conhecimento com synapses relacionadas
 *
 * Usado no modal de edição para exibir base + synapses juntas
 */
export interface BaseConhecimentoWithSynapses extends BaseConhecimento {
  synapses: Synapse[];
}

/**
 * Base de Conhecimento com informações do NeuroCore
 *
 * Usado para exibir nome do NeuroCore no select disabled
 */
export interface BaseConhecimentoWithNeuroCore extends BaseConhecimento {
  neurocores: {
    id: string;
    name: string;
  };
}

/**
 * Dados para criar uma nova base de conhecimento
 */
export interface CreateBaseConhecimentoData {
  name: string;
  description?: string;
}

/**
 * Dados para atualizar uma base de conhecimento existente
 */
export interface UpdateBaseConhecimentoData {
  name?: string;
  description?: string | null;
  is_active?: boolean;
}
