'use server';

import { revalidatePath } from 'next/cache';
import {
  createBaseConhecimento,
  updateBaseConhecimento,
  deleteBaseConhecimento,
  toggleBaseConhecimentoActive,
} from '@/lib/queries/knowledge-base';
import { inactivateBaseWebhook } from '@/lib/utils/n8n-webhooks';
import type {
  CreateBaseConhecimentoData,
  UpdateBaseConhecimentoData,
} from '@/types/knowledge-base';

/**
 * Server Actions para operações de Base de Conhecimento
 *
 * Princípios SOLID:
 * - Single Responsibility: Cada action faz uma operação específica
 * - Dependency Inversion: Depende das abstrações de queries
 *
 * Features:
 * - Chamadas de webhook N8N para gerenciar embeddings de bases
 * - Webhooks não bloqueiam CRUD (error handling robusto)
 */

export async function createBaseConhecimentoAction(
  tenantId: string,
  neurocoreId: string,
  data: CreateBaseConhecimentoData
) {
  try {
    const base = await createBaseConhecimento(tenantId, neurocoreId, data);
    revalidatePath('/knowledge-base');
    return { success: true, data: base };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao criar base de conhecimento',
    };
  }
}

export async function updateBaseConhecimentoAction(
  baseId: string,
  tenantId: string,
  data: UpdateBaseConhecimentoData
) {
  try {
    const base = await updateBaseConhecimento(baseId, tenantId, data);
    revalidatePath('/knowledge-base');
    return { success: true, data: base };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar base de conhecimento',
    };
  }
}

export async function deleteBaseConhecimentoAction(
  baseId: string,
  tenantId: string
) {
  try {
    await deleteBaseConhecimento(baseId, tenantId);
    revalidatePath('/knowledge-base');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao deletar base de conhecimento',
    };
  }
}

export async function toggleBaseConhecimentoActiveAction(
  baseId: string,
  tenantId: string,
  isActive: boolean
) {
  try {
    const base = await toggleBaseConhecimentoActive(baseId, tenantId, isActive);
    revalidatePath('/knowledge-base');

    // Chamar webhook N8N para ativar/desativar base (não bloqueia CRUD)
    // Quando base inativa, N8N ignora todas synapses dela
    await inactivateBaseWebhook({
      baseConhecimentoId: base.id,
      tenantId: base.tenant_id,
      isActive,
    });

    return { success: true, data: base };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar base de conhecimento',
    };
  }
}
