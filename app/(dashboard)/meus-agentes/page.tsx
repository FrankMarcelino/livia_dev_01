// Página: Meus Agentes IA
// Feature: Agent Templates (Plataforma Tenant)

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAgentsByTenant } from '@/lib/queries/agents';
import { AgentsList } from '@/components/agents/agents-list';

export const metadata = {
  title: 'Meus Agentes IA | LIVIA',
  description: 'Gerencie as configurações dos seus agentes de inteligência artificial',
};

export default async function MeusAgentesPage() {
  const supabase = await createClient();

  console.log('[MeusAgentesPage] Starting...');

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.log('[MeusAgentesPage] Auth error or no user, redirecting to login');
    redirect('/login');
  }

  console.log('[MeusAgentesPage] User authenticated:', user.id);

  // Buscar tenant_id do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (userError) {
    console.error('[MeusAgentesPage] Error fetching user data:', {
      message: userError.message,
      details: userError.details,
      code: userError.code,
    });
  }

  if (userError || !userData?.tenant_id) {
    console.log('[MeusAgentesPage] No tenant found for user');
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground mt-2">
            Tenant não encontrado. Entre em contato com o suporte.
          </p>
        </div>
      </div>
    );
  }

  console.log('[MeusAgentesPage] Tenant ID:', userData.tenant_id);

  // Buscar agents do tenant
  let agents;
  try {
    agents = await getAgentsByTenant(userData.tenant_id);
    console.log('[MeusAgentesPage] Agents loaded successfully:', agents.length);
  } catch (error) {
    console.error('[MeusAgentesPage] Error loading agents:', error);
    return (
      <div className="container mx-auto py-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground mt-2">
            Erro ao carregar agents. Tente novamente mais tarde.
          </p>
          <pre className="mt-4 text-xs text-left bg-muted p-4 rounded">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Meus Agentes IA</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações dos seus agentes de inteligência artificial
        </p>
      </div>
      
      {/* Lista de Agents */}
      <AgentsList agents={agents} />
    </div>
  );
}
