import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NeurocoreChat } from '@/components/neurocore';

/**
 * Página de Treinamento Neurocore
 *
 * Interface para testar e validar respostas da IA antes de ativar em produção.
 * Permite fazer perguntas, ver synapses usadas, editar synapses e dar feedback.
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

  return <NeurocoreChat tenantId={userData.tenant_id} />;
}
