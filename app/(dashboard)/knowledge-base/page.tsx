import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSynapses } from '@/lib/queries/knowledge-base';
import { SynapsesTable } from '@/components/knowledge-base';

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

  // TODO: Buscar base_conhecimento_id real do tenant
  // Por enquanto, usando um ID fixo para MVP
  const baseConhecimentoId = '00000000-0000-0000-0000-000000000000';

  const synapses = await getSynapses(tenantId);

  return (
    <div className="flex h-full flex-col p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Gerencie as synapses usadas pela IA
          </p>
        </div>
      </div>

      <SynapsesTable
        synapses={synapses}
        tenantId={tenantId}
        baseConhecimentoId={baseConhecimentoId}
      />

      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Synapses ativas serão processadas pelo n8n
          em background. O status será atualizado automaticamente.
        </p>
      </div>
    </div>
  );
}
