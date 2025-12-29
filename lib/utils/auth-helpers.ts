/**
 * Auth Helper Functions
 *
 * Funções utilitárias para autenticação e autorização
 */

import { createClient } from '@/lib/supabase/server';

/**
 * Busca dados do usuário autenticado incluindo tenant_id e neurocore_id
 *
 * @returns Dados do usuário com tenant_id e neurocore_id
 * @throws Error se usuário não estiver autenticado ou não tiver tenant/neurocore
 */
export async function getAuthenticatedUserData() {
  const supabase = await createClient();

  // 1. Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Unauthorized');
  }

  // 2. Buscar tenant_id do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.tenant_id) {
    throw new Error('User tenant not found');
  }

  // 3. Buscar neurocore_id do tenant
  const { data: tenantData, error: tenantError } = await supabase
    .from('tenants')
    .select('neurocore_id')
    .eq('id', userData.tenant_id)
    .single();

  if (tenantError || !tenantData?.neurocore_id) {
    throw new Error('Tenant neurocore not found');
  }

  return {
    userId: user.id,
    tenantId: userData.tenant_id,
    neurocoreId: tenantData.neurocore_id,
  };
}

/**
 * Busca apenas o neurocore_id do usuário autenticado
 *
 * @returns neurocore_id do tenant do usuário
 * @throws Error se usuário não estiver autenticado ou não tiver neurocore
 */
export async function getUserNeurocoreId(): Promise<string> {
  const { neurocoreId } = await getAuthenticatedUserData();
  return neurocoreId;
}

/**
 * Busca tenant_id e neurocore_id do usuário autenticado
 *
 * @returns { tenantId, neurocoreId }
 * @throws Error se usuário não estiver autenticado
 */
export async function getUserTenantAndNeurocore() {
  const { tenantId, neurocoreId } = await getAuthenticatedUserData();
  return { tenantId, neurocoreId };
}
