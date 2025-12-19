import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Relatório Tags | LIVIA',
  description: 'Análise de categorização por tags',
};

export default async function RelatorioTagsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  const tenantId = userData?.tenant_id;

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-destructive">Erro: Usuário sem tenant associado</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatório Tags</h1>
        <p className="text-muted-foreground">
          Análise de categorização e performance por tag
        </p>
      </div>

      <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          Relatório Tags - Em desenvolvimento
        </p>
      </div>
    </div>
  );
}
