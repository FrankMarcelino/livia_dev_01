// Página: Meus Agentes IA
// Feature: Agent Templates (Plataforma Tenant)

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAgentsByTenant } from '@/lib/queries/agents';
import { AgentsList } from '@/components/agents/agents-list';
import { AgentCategory } from '@/components/agents/navigation/agent-category-selector';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export const metadata = {
  title: 'Meus Agentes IA | LIVIA',
  description: 'Gerencie as configurações dos seus agentes de inteligência artificial',
};

// Interface correta para Next.js 16+ Server Components
// searchParams é uma Promise em Next.js 16+
interface PageProps {
  searchParams: Promise<{
    category?: string;
  }>;
}

export default async function MeusAgentesPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const resolvedParams = await searchParams;
  const category = (resolvedParams.category as AgentCategory) || 'main';

  console.warn('[MeusAgentesPage] Starting... Category:', category);

  // Verificar autenticação
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    console.warn('[MeusAgentesPage] Auth error or no user, redirecting to login');
    redirect('/login');
  }

  // Buscar tenant_id do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData?.tenant_id) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>
            Tenant não encontrado. Entre em contato com o suporte.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.warn('[MeusAgentesPage] Tenant ID:', userData.tenant_id);

  // Buscar agents do tenant
  let agents;
  try {
    agents = await getAgentsByTenant(userData.tenant_id);
    
    // Filtrar agents por categoria usando a coluna TYPE (Confirmed via User Screenshot)
    switch (category) {
      case 'intention':
        agents = agents.filter(a => a.type === 'intention');
        break;
      case 'observer':
        agents = agents.filter(a => a.type === 'observer');
        break;
      case 'guard-rails':
        agents = agents.filter(a => a.type === 'in_guard_rails');
        break;
      case 'main':
      default:
        agents = agents.filter(a => a.type === 'attendant');
        break;
    }
    
    console.warn('[MeusAgentesPage] Agents loaded:', agents.length, 'for category:', category);
  } catch (error) {
    console.error('[MeusAgentesPage] Error loading agents:', error);
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar agentes</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : String(error)}
          </AlertDescription>
        </Alert>
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

      
      {/* Lista de Agents - Passamos a categoria atual */}
      <AgentsList key={category} agents={agents} currentCategory={category} />
    </div>
  );
}
