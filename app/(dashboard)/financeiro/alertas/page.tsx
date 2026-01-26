import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AlertsPageContent } from '@/components/billing/alerts-page-content';
import { getWallet, getBillingNotifications } from '@/lib/queries/billing';

export const metadata = {
  title: 'Alertas | LIVIA',
  description: 'Configure alertas de saldo e veja notificações',
};

/**
 * Página de Alertas e Notificações de Billing
 */
export default async function AlertasPage() {
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

  // Busca dados
  const [wallet, notifications] = await Promise.all([
    getWallet(tenantId),
    getBillingNotifications(tenantId, 20),
  ]);

  return (
    <AlertsPageContent
      tenantId={tenantId}
      wallet={wallet}
      notifications={notifications}
    />
  );
}
