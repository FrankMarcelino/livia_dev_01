import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getBaseConhecimentos } from '@/lib/queries/knowledge-base';
import { KnowledgeBaseMasterDetail } from '@/components/knowledge-base';

export default async function KnowledgeBasePage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantId = (userData as any)?.tenant_id;

  if (!tenantId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Usuário sem tenant associado
        </p>
      </div>
    );
  }

  // Buscar dados do tenant (incluindo neurocore)
   
  const { data: tenantData } = (await supabase
    .from('tenants')
    .select(
      `
      id,
      neurocore_id,
      neurocores(id, name)
    `
    )
    .eq('id', tenantId)
    .single()) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  if (!tenantData || !tenantData.neurocore_id || !tenantData.neurocores) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Tenant sem NeuroCore configurado
        </p>
      </div>
    );
  }

  const neurocoreId = tenantData.neurocore_id;
  const neurocoreName = tenantData.neurocores.name;

  // Buscar bases de conhecimento
  const bases = await getBaseConhecimentos(tenantId);

  return (
    <div className="flex h-full flex-col p-6 w-full overflow-x-hidden">
      <KnowledgeBaseMasterDetail
        bases={bases}
        tenantId={tenantId}
        neurocoreId={neurocoreId}
        neurocoreName={neurocoreName}
      />

      <div className="mt-8 text-sm text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Organize synapses em bases temáticas para
          facilitar o gerenciamento do conhecimento da IA.
        </p>
      </div>
    </div>
  );
}
