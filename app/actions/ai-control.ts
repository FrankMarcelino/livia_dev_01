'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server Action para pausar/retomar IA
 *
 * Princípios SOLID:
 * - Single Responsibility: Gerencia apenas o estado de pausa da IA
 *
 * Esta action atualiza a preferência do usuário para pausar ou retomar
 * a assistente virtual. Quando pausada, a IA não responderá automaticamente
 * às mensagens.
 *
 * Fluxo:
 * 1. Valida autenticação
 * 2. Busca tenant_id do usuário
 * 3. Atualiza users.ai_paused
 * 4. Atualiza TODAS as conversas abertas do tenant (ia_active)
 *
 * @param userId - ID do usuário
 * @param isPaused - true para pausar, false para retomar
 * @returns Resultado da operação com sucesso ou erro
 */
export async function toggleAIPause(userId: string, isPaused: boolean) {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // 1. Verifica autenticação
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user || authData.user.id !== userId) {
      return { error: 'Não autorizado' };
    }

    // 2. Busca tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('[toggleAIPause] Error fetching user:', userError);
      return { error: 'Usuário não encontrado' };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const tenantId = (userData as any).tenant_id;

    if (!tenantId) {
      console.error('[toggleAIPause] User has no tenant_id');
      return { error: 'Tenant não encontrado' };
    }

    console.log(
      `[toggleAIPause] ${isPaused ? 'PAUSING' : 'RESUMING'} IA for user ${userId.slice(0, 8)}, tenant ${tenantId.slice(0, 8)}`
    );

    // 3. Atualiza configuração do usuário
    // Nota: O campo 'ai_paused' precisa existir na tabela 'users'
    // Execute a migration: supabase/migrations/008_add_ai_paused_to_users.sql
    const { error: userUpdateError } = await supabase
      .from('users')
      .update({ ai_paused: isPaused } as any)
      .eq('id', userId);

    if (userUpdateError) {
      console.error('[toggleAIPause] Error updating user:', userUpdateError);
      return { error: 'Erro ao atualizar configuração do usuário' };
    }

    const userUpdateTime = Date.now() - startTime;
    console.log(`[toggleAIPause] ✅ User updated in ${userUpdateTime}ms`);

    // 4. Atualiza TODAS as conversas abertas do tenant
    // ia_active = !isPaused (se pausar, ia_active = false)
    const { error: conversationsError, count } = await supabase
      .from('conversations')
      .update({
        ia_active: !isPaused,
        pause_notes: isPaused
          ? 'IA pausada pelo usuário via Perfil'
          : null,
      } as any)
      .eq('tenant_id', tenantId)
      .eq('status', 'open'); // Só atualiza conversas abertas

    if (conversationsError) {
      console.error(
        '[toggleAIPause] Error updating conversations:',
        conversationsError
      );

      // Reverte mudança no usuário
      await supabase
        .from('users')
        .update({ ai_paused: !isPaused } as any)
        .eq('id', userId);

      return { error: 'Erro ao atualizar conversas' };
    }

    const totalTime = Date.now() - startTime;
    console.log(
      `[toggleAIPause] ✅ ${isPaused ? 'PAUSED' : 'RESUMED'} successfully in ${totalTime}ms. Affected conversations: ${count || 0}`
    );

    return {
      success: true,
      affectedConversations: count || 0,
    };
  } catch (error) {
    console.error('[toggleAIPause] Unexpected error:', error);
    return { error: 'Erro interno ao processar solicitação' };
  }
}

/**
 * Server Action para buscar status da IA
 *
 * @param userId - ID do usuário
 * @returns Status de pausa da IA
 */
export async function getAIPauseStatus(userId: string) {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user || authData.user.id !== userId) {
    return { error: 'Não autorizado', isPaused: false };
  }

  const { data, error } = await supabase
    .from('users')
    .select('ai_paused')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching AI pause status:', error);
    return { error: 'Erro ao buscar configuração', isPaused: false };
  }

  // Type assertion necessária até a migration ser aplicada
  return { isPaused: (data as any)?.ai_paused || false };
}
