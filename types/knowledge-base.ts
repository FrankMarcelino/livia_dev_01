/**
 * Types para Base de Conhecimento Refatorada
 *
 * Estrutura simplificada:
 * Domain (FAQ, Políticas, etc) → Base Conhecimento (conteúdo direto)
 */

import type { Tables } from './database';

/**
 * Domínio de conhecimento - Agrupa bases por categoria
 *
 * Exemplos: "FAQ", "Políticas", "Documentação", "Procedimentos"
 */
export type KnowledgeDomain = Tables<'knowledge_domains'>;

/**
 * Base de Conhecimento - Conteúdo vetorizado
 *
 * Cada base contém:
 * - name: Título da base
 * - description: Conteúdo completo (texto)
 * - domain: FK para knowledge_domains
 * - base_conhecimentos_vectors: FK 1:1 para o vetor (se null = processando)
 */
export type BaseConhecimento = Tables<'base_conhecimentos'>;

/**
 * Status calculado de uma base de conhecimento
 */
export type BaseStatus =
  | 'published'    // is_active=true e tem vector
  | 'processing'   // is_active=true mas sem vector
  | 'inactive'     // is_active=false e tem vector (sazonal)
  | 'draft';       // is_active=false e sem vector

/**
 * Interface para calcular status da base
 */
export interface BaseStatusInfo {
  status: BaseStatus;
  label: string;
  icon: string;
  color: 'success' | 'default' | 'secondary' | 'outline' | 'destructive';
}

/**
 * Base de conhecimento com informações do domínio
 */
export interface BaseConhecimentoWithDomain extends BaseConhecimento {
  knowledge_domains: KnowledgeDomain | null;
}

/**
 * Base de conhecimento com status calculado
 */
export interface BaseConhecimentoWithStatus extends BaseConhecimento {
  statusInfo: BaseStatusInfo;
}

/**
 * Domínio com contagem de bases
 */
export interface DomainWithCount extends KnowledgeDomain {
  bases_count: number;
  published_count: number;
  processing_count: number;
}

/**
 * Dados para criar nova base de conhecimento
 */
export interface CreateBaseConhecimentoData {
  name: string;
  description: string;      // Conteúdo completo
  domain: string;            // UUID do knowledge_domain
}

/**
 * Dados para atualizar base de conhecimento existente
 */
export interface UpdateBaseConhecimentoData {
  name?: string;
  description?: string;      // Novo conteúdo (reseta vector)
  domain?: string;
}

/**
 * Dados para toggle ativo/inativo (sazonal)
 */
export interface ToggleBaseActiveData {
  is_active: boolean;
}

/**
 * Helper para calcular status da base
 */
export function getBaseStatus(base: BaseConhecimento): BaseStatusInfo {
  // Desativado (sazonal) - tem vector mas está off
  if (!base.is_active && base.base_conhecimentos_vectors) {
    return {
      status: 'inactive',
      label: 'Desativado (Sazonal)',
      icon: '⚠️',
      color: 'secondary',
    };
  }

  // Rascunho - nunca foi vetorizado
  if (!base.is_active && !base.base_conhecimentos_vectors) {
    return {
      status: 'draft',
      label: 'Rascunho',
      icon: '📝',
      color: 'outline',
    };
  }

  // Processando - ativo mas ainda sem vector
  if (base.is_active && !base.base_conhecimentos_vectors) {
    return {
      status: 'processing',
      label: 'Processando...',
      icon: '⏳',
      color: 'default',
    };
  }

  // Publicado - ativo e com vector
  return {
    status: 'published',
    label: 'Publicado',
    icon: '✅',
    color: 'success',
  };
}
