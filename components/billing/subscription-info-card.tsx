'use client';

import { Shield, CalendarClock, ExternalLink, Loader2 } from 'lucide-react';
import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { SubscriptionStatus } from '@/types/stripe';

interface SubscriptionInfoCardProps {
  status: SubscriptionStatus;
  periodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

function getStatusBadge(status: SubscriptionStatus) {
  switch (status) {
    case 'active':
      return { label: 'Ativa', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    case 'trialing':
      return { label: 'Teste', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
    case 'past_due':
      return { label: 'Pendente', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
    case 'canceled':
      return { label: 'Cancelada', className: 'bg-red-100 text-red-800 hover:bg-red-100' };
    default:
      return { label: 'Inativa', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function SubscriptionInfoCard({
  status,
  periodEnd,
  cancelAtPeriodEnd,
}: SubscriptionInfoCardProps) {
  const [loadingPortal, setLoadingPortal] = useState(false);
  const badge = getStatusBadge(status);
  const isActive = status === 'active' || status === 'trialing';

  async function handlePortal() {
    setLoadingPortal(true);
    try {
      const res = await fetch('/api/stripe/portal', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao abrir portal');
      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao abrir portal'
      );
      setLoadingPortal(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assinatura
          </CardTitle>
          <Badge variant="outline" className={badge.className}>
            {badge.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-2xl font-bold">
          R$ 300,00
          <span className="text-sm font-normal text-muted-foreground">/mês</span>
        </div>

        {isActive && periodEnd && (
          <div className="flex items-center gap-2 text-sm">
            <CalendarClock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {cancelAtPeriodEnd ? 'Cancela em' : 'Próxima cobrança'}:
            </span>
            <span className="font-medium">{formatDate(periodEnd)}</span>
          </div>
        )}

        {isActive && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handlePortal}
            disabled={loadingPortal}
          >
            {loadingPortal ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Gerenciar Assinatura
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
