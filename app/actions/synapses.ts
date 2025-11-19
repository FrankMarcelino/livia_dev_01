'use server';

import { revalidatePath } from 'next/cache';
import {
  createSynapse,
  updateSynapse,
  deleteSynapse,
  toggleSynapseEnabled,
} from '@/lib/queries/knowledge-base';
import type { CreateSynapseData, UpdateSynapseData } from '@/types/knowledge-base';

/**
 * Server Actions para operações de Synapses
 *
 * Princípios SOLID:
 * - Single Responsibility: Cada action faz uma operação específica
 * - Dependency Inversion: Depende das abstrações de queries
 */

export async function createSynapseAction(
  tenantId: string,
  baseConhecimentoId: string,
  data: CreateSynapseData
) {
  try {
    const synapse = await createSynapse(tenantId, baseConhecimentoId, data);
    revalidatePath('/knowledge-base');
    return { success: true, data: synapse };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar synapse',
    };
  }
}

export async function updateSynapseAction(
  synapseId: string,
  tenantId: string,
  data: UpdateSynapseData
) {
  try {
    const synapse = await updateSynapse(synapseId, tenantId, data);
    revalidatePath('/knowledge-base');
    return { success: true, data: synapse };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar synapse',
    };
  }
}

export async function deleteSynapseAction(synapseId: string, tenantId: string) {
  try {
    await deleteSynapse(synapseId, tenantId);
    revalidatePath('/knowledge-base');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao deletar synapse',
    };
  }
}

export async function toggleSynapseEnabledAction(
  synapseId: string,
  tenantId: string,
  isEnabled: boolean
) {
  try {
    const synapse = await toggleSynapseEnabled(synapseId, tenantId, isEnabled);
    revalidatePath('/knowledge-base');
    return { success: true, data: synapse };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao atualizar synapse',
    };
  }
}
