'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Server Action para pausar/retomar IA do Tenant
 *
 * Princípios SOLID:
 * - Single Responsibility: Gerencia apenas o estado de pausa da IA
 *
 * Esta action atualiza a configuração do tenant para pausar ou retomar
 * a assistente virtual. Quando pausada, a IA não responderá automaticamente
 * às mensagens.
 *
 * Fluxo:
 * 1. Valida autenticação
 * 2. Busca tenant_id do usuário
 * 3. Valida associação usuário-tenant
 * 4. Atualiza tenants.ia_active
 * 5. Atualiza TODAS as conversas abertas do tenant (ia_active)
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @param isPaused - true para pausar, false para retomar
 * @returns Resultado da operação com sucesso ou erro
 */
export async function toggleAIPause(userId: string, tenantId: string, isPaused: boolean) {
  const startTime = Date.now();
  const supabase = await createClient();

  try {
    // 1. Verifica autenticação
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user || authData.user.id !== userId) {
      return { error: 'Não autorizado' };
    }

    // 2. Busca e valida associação usuário-tenant
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
    const userTenantId = (userData as any).tenant_id;

    if (!userTenantId) {
      console.error('[toggleAIPause] User has no tenant_id');
      return { error: 'Usuário não associado a nenhum tenant' };
    }

    // 3. Valida que o usuário pertence ao tenant solicitado
    if (userTenantId !== tenantId) {
      console.error(
        `[toggleAIPause] User ${userId.slice(0, 8)} tried to modify tenant ${tenantId.slice(0, 8)} but belongs to ${userTenantId.slice(0, 8)}`
      );
      return { error: 'Usuário não autorizado para este tenant' };
    }

    console.log(
      `[toggleAIPause] ${isPaused ? 'PAUSING' : 'RESUMING'} IA for user ${userId.slice(0, 8)}, tenant ${tenantId.slice(0, 8)}`
    );

    // 4. Atualiza configuração do tenant
    // ia_active é o INVERSO de isPaused
    // isPaused=true -> ia_active=false
    // isPaused=false -> ia_active=true
    const { error: tenantUpdateError } = await supabase
      .from('tenants')
      .update({ ia_active: !isPaused })
      .eq('id', tenantId);

    if (tenantUpdateError) {
      console.error('[toggleAIPause] Error updating tenant:', tenantUpdateError);
      return { error: 'Erro ao atualizar configuração do tenant' };
    }

    const tenantUpdateTime = Date.now() - startTime;
    console.log(`[toggleAIPause] ✅ Tenant updated in ${tenantUpdateTime}ms`);

    // 5. Atualiza TODAS as conversas abertas do tenant
    // ia_active = !isPaused (se pausar, ia_active = false)
    const conversationUpdate = {
      ia_active: !isPaused,
      pause_notes: isPaused
        ? 'IA pausada pelo usuário via Perfil'
        : null,
    };

    const { error: conversationsError, count } = await supabase
      .from('conversations')
      .update(conversationUpdate)
      .eq('tenant_id', tenantId)
      .eq('status', 'open'); // Só atualiza conversas abertas

    if (conversationsError) {
      console.error(
        '[toggleAIPause] Error updating conversations:',
        conversationsError
      );

      // Reverte mudança no tenant
      await supabase
        .from('tenants')
        .update({ ia_active: isPaused })
        .eq('id', tenantId);

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
 * Server Action para buscar status da IA do Tenant
 *
 * @param userId - ID do usuário
 * @param tenantId - ID do tenant
 * @returns Status de pausa da IA
 */
export async function getAIPauseStatus(userId: string, tenantId: string) {
  const supabase = await createClient();

  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user || authData.user.id !== userId) {
    return { error: 'Não autorizado', isPaused: false };
  }

  // Valida associação usuário-tenant
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', userId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((userData as any)?.tenant_id !== tenantId) {
    return { error: 'Usuário não autorizado para este tenant', isPaused: false };
  }

  // Busca status do tenant
  const { data, error } = await supabase
    .from('tenants')
    .select('ia_active')
    .eq('id', tenantId)
    .single();

  if (error) {
    console.error('Error fetching AI pause status:', error);
    return { error: 'Erro ao buscar configuração', isPaused: false };
  }

  // isPaused é o INVERSO de ia_active
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { isPaused: !(data as any)?.ia_active };
}
