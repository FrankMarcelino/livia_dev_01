'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

type BannerVariant = 'warning' | 'danger' | null;

interface BannerState {
  variant: BannerVariant;
  message: string;
}

function computeBannerState(
  subscriptionStatus: string | null,
  periodEnd: string | null
): BannerState {
  if (subscriptionStatus === 'past_due') {
    return {
      variant: 'danger',
      message:
        'Seu pagamento de manutenção está pendente. Regularize para evitar suspensão do serviço.',
    };
  }

  if (
    (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') &&
    periodEnd
  ) {
    const endDate = new Date(periodEnd);
    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 7 && diffDays > 0) {
      return {
        variant: 'warning',
        message: `Sua assinatura renova em ${diffDays} dia${diffDays > 1 ? 's' : ''}. Verifique se seu método de pagamento está atualizado.`,
      };
    }
  }

  return { variant: null, message: '' };
}

interface SubscriptionWarningBannerProps {
  subscriptionStatus: string | null;
  periodEnd: string | null;
}

export function SubscriptionWarningBanner({
  subscriptionStatus,
  periodEnd,
}: SubscriptionWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [bannerState, setBannerState] = useState<BannerState>({
    variant: null,
    message: '',
  });

  useEffect(() => {
    setBannerState(computeBannerState(subscriptionStatus, periodEnd));
  }, [subscriptionStatus, periodEnd]);

  if (!bannerState.variant || dismissed) return null;

  const isDanger = bannerState.variant === 'danger';

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2.5 text-sm ${
        isDanger
          ? 'bg-red-50 text-red-800 border-b border-red-200'
          : 'bg-yellow-50 text-yellow-800 border-b border-yellow-200'
      }`}
    >
      <AlertTriangle className="h-4 w-4 flex-shrink-0" />
      <span className="flex-1">{bannerState.message}</span>
      <Button variant="ghost" size="sm" className="h-7 text-xs" asChild>
        <Link href="/financeiro/recarregar">
          {isDanger ? 'Regularizar' : 'Ver detalhes'}
        </Link>
      </Button>
      {!isDanger && (
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-yellow-100"
          aria-label="Fechar aviso"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
