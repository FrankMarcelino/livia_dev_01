import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSubscriptionPlans, getTenantSubscription } from '@/lib/queries/stripe';
import { SubscriptionPlans } from '@/components/billing/subscription-plans';
import { SubscriptionStatusCard } from '@/components/billing/subscription-status-card';

export const metadata = {
  title: 'Assinatura | LIVIA',
  description: 'Gerencie sua assinatura de manutenção',
};

export default async function AssinaturaPage() {
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

  const [subscription, plans] = await Promise.all([
    getTenantSubscription(tenantId),
    getSubscriptionPlans(),
  ]);

  const status = subscription?.subscription_status || 'inactive';

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assinatura</h1>
          <p className="text-muted-foreground">
            Gerencie seu plano de manutenção mensal
          </p>
        </div>

        <SubscriptionStatusCard
          status={status}
          periodEnd={subscription?.subscription_current_period_end || null}
          cancelAtPeriodEnd={subscription?.subscription_cancel_at_period_end || false}
        />

        <div>
          <h2 className="text-xl font-semibold mb-4">Planos Disponíveis</h2>
          <SubscriptionPlans plans={plans} currentStatus={status} />
        </div>
      </div>
    </div>
  );
}
