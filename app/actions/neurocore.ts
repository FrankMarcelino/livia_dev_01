'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type {
  ActionResult,
  SubmitFeedbackPayload,
} from '@/types/neurocore';

/**
 * Submete feedback sobre uma resposta do Neurocore
 *
 * O feedback é salvo em message_feedbacks com:
 * - feedback_type: 'like' | 'dislike'
 * - comment: JSON com contexto (pergunta, resposta, synapses usadas)
 * - message_id: NULL (não está vinculado a uma mensagem real)
 *
 * @param payload - Dados do feedback
 * @returns Resultado da operação
 */
export async function submitFeedbackAction(
  payload: SubmitFeedbackPayload
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // 1. Validar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: 'Não autenticado',
      };
    }

    // 2. Validar tenant do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData) {
      return {
        success: false,
        error: 'Usuário não encontrado',
      };
    }

    if (userData.tenant_id !== payload.tenantId) {
      return {
        success: false,
        error: 'Tenant inválido',
      };
    }

    // 3. Montar contexto JSON com comentário do usuário
    const contextWithComment = {
      ...payload.context,
      userComment: payload.comment || null,
    };

    // 4. Inserir feedback em message_feedbacks
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: insertError } = await (supabase as any)
      .from('message_feedbacks')
      .insert({
        tenant_id: payload.tenantId,
        feedback_type: payload.feedbackType,
        comment: JSON.stringify(contextWithComment),
        message_id: null, // Feedback do Neurocore não tem message_id
      });

    if (insertError) {
      console.error('Erro ao salvar feedback:', insertError);
      return {
        success: false,
        error: 'Erro ao salvar feedback',
      };
    }

    // 5. Revalidar página (caso tenha cache)
    revalidatePath('/neurocore');

    return {
      success: true,
    };
  } catch (error) {
    console.error('Erro inesperado ao salvar feedback:', error);
    return {
      success: false,
      error: 'Erro interno do servidor',
    };
  }
}
