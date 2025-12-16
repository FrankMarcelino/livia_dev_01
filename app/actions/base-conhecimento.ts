'use server';

import { revalidatePath } from 'next/cache';
import {
  createBaseConhecimento,
  updateBaseConhecimento,
  deleteBaseConhecimento,
  toggleBaseActive,
} from '@/lib/queries/knowledge-base';
import {
  createBaseConhecimentoVectorWebhook,
  updateBaseConhecimentoVectorWebhook,
} from '@/lib/utils/n8n-webhooks';
import type {
  CreateBaseConhecimentoData,
  UpdateBaseConhecimentoData,
} from '@/types/knowledge-base';

/**
 * Server Actions para Base de Conhecimento Refatorada
 *
 * Fluxo de criação:
 * 1. Cria base no DB (is_active=false, sem vector)
 * 2. Chama N8N para processar (não bloqueia)
 * 3. N8N atualiza DB quando terminar
 *
 * Fluxo de edição:
 * 1. Atualiza base no DB (reseta vector, is_active=false)
 * 2. Chama N8N para re-processar
 * 3. N8N atualiza DB quando terminar
 */

/**
 * Criar nova base de conhecimento
 */
export async function createBaseConhecimentoAction(
  tenantId: string,
  neurocoreId: string,
  data: CreateBaseConhecimentoData
) {
  try {
    // 1. Criar base no DB (começa desativada)
    const base = await createBaseConhecimento(tenantId, neurocoreId, data);

    // 2. Chamar N8N para processar (não bloqueia)
    const webhookResult = await createBaseConhecimentoVectorWebhook({
      id_base_conhecimento_geral: base.id,
    });

    if (!webhookResult.success) {
      console.error('[Action] Erro ao chamar N8N:', webhookResult.error);
    }

    revalidatePath('/knowledge-base');

    return {
      success: true,
      data: base,
      webhookCalled: webhookResult.success,
    };
  } catch (error) {
    console.error('[Action] Erro ao criar base:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao criar base de conhecimento',
    };
  }
}

/**
 * Atualizar base de conhecimento
 *
 * Se description mudou, reseta vector e chama N8N
 */
export async function updateBaseConhecimentoAction(
  baseId: string,
  tenantId: string,
  data: UpdateBaseConhecimentoData
) {
  try {
    const contentChanged = data.description !== undefined;

    // 1. Atualizar base (se content mudou, reseta vector)
    const base = await updateBaseConhecimento(baseId, tenantId, data, contentChanged);

    // 2. Se content mudou, chamar N8N para re-processar
    if (contentChanged) {
      const webhookResult = await updateBaseConhecimentoVectorWebhook({
        id_base_conhecimento_geral: baseId,
      });

      if (!webhookResult.success) {
        console.error('[Action] Erro ao chamar N8N:', webhookResult.error);
      }
    }

    revalidatePath('/knowledge-base');

    return {
      success: true,
      data: base,
      webhookCalled: contentChanged,
    };
  } catch (error) {
    console.error('[Action] Erro ao atualizar base:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao atualizar base de conhecimento',
    };
  }
}

/**
 * Deletar base de conhecimento
 *
 * A constraint FK CASCADE vai deletar o vector automaticamente
 */
export async function deleteBaseConhecimentoAction(
  baseId: string,
  tenantId: string
) {
  try {
    await deleteBaseConhecimento(baseId, tenantId);
    revalidatePath('/knowledge-base');

    return { success: true };
  } catch (error) {
    console.error('[Action] Erro ao deletar base:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao deletar base de conhecimento',
    };
  }
}

/**
 * Toggle ativar/desativar base (sazonal)
 *
 * Mantém o vector, só muda is_active
 * Não chama N8N
 */
export async function toggleBaseActiveAction(
  baseId: string,
  tenantId: string,
  isActive: boolean
) {
  try {
    const base = await toggleBaseActive(baseId, tenantId, isActive);
    revalidatePath('/knowledge-base');

    return { success: true, data: base };
  } catch (error) {
    console.error('[Action] Erro ao toggle base active:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Erro ao ativar/desativar base de conhecimento',
    };
  }
}
