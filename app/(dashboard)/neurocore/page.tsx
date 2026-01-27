import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDomains } from '@/lib/queries/knowledge-base';
import { NeurocoreChat } from '@/components/neurocore';

/**
 * Página de Validação de Respostas (antigo Treinamento Neurocore)
 *
 * Interface para testar e validar respostas da IA antes de ativar em produção.
 * Permite fazer perguntas, ver bases usadas, editar bases e dar feedback.
 */
export default async function NeurocorePage() {
  const supabase = await createClient();

  // 1. Validar autenticação
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Buscar tenant do usuário
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (userError || !userData || !userData.tenant_id) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">
            Não foi possível carregar seus dados. Tente novamente.
          </p>
        </div>
      </div>
    );
  }

  const tenantId = userData.tenant_id;

  // 3. Buscar dados do tenant (incluindo neurocore)
  const { data: tenantData } = (await supabase
    .from('tenants')
    .select('id, neurocore_id')
    .eq('id', tenantId)
    .single()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!tenantData || !tenantData.neurocore_id) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Tenant sem NeuroCore configurado
        </p>
      </div>
    );
  }

  const neurocoreId = tenantData.neurocore_id;

  // 4. Buscar domínios para o dialog de edição
  const allDomains = await getDomains(neurocoreId);

  return (
    <NeurocoreChat 
      tenantId={tenantId}
      neurocoreId={neurocoreId}
      allDomains={allDomains}
    />
  );
}
