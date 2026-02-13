'use client';

import Link from 'next/link';
import { CreditCard, TrendingUp, AlertTriangle, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { WalletWithComputed, WalletStatus } from '@/types/billing';
import { formatBRL, formatCredits } from '@/types/billing';

interface WalletBalanceCardProps {
  wallet: WalletWithComputed | null;
  dailyAvgCredits?: number;
}

function getStatusConfig(status: WalletStatus) {
  switch (status) {
    case 'ok':
      return {
        label: 'Saldo OK',
        variant: 'default' as const,
        icon: TrendingUp,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      };
    case 'low':
      return {
        label: 'Saldo Baixo',
        variant: 'secondary' as const,
        icon: AlertTriangle,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
      };
    case 'critical':
      return {
        label: 'Saldo Crítico',
        variant: 'destructive' as const,
        icon: XCircle,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      };
  }
}

export function WalletBalanceCard({ wallet, dailyAvgCredits = 0 }: WalletBalanceCardProps) {
  if (!wallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Carteira de Créditos
          </CardTitle>
          <CardDescription>Sua carteira ainda não foi configurada</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Entre em contato com o suporte para ativar sua carteira de créditos.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusConfig = getStatusConfig(wallet.status);
  const StatusIcon = statusConfig.icon;
  const progressPercent = wallet.low_balance_threshold_credits > 0
    ? Math.min(100, (wallet.available_credits / wallet.low_balance_threshold_credits) * 100)
    : 100;

  // Estimativa de duração do saldo
  const estimatedDays = dailyAvgCredits > 0
    ? Math.floor(wallet.available_credits / dailyAvgCredits)
    : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Carteira de Créditos
            </CardTitle>
            <CardDescription>Saldo e créditos disponíveis</CardDescription>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1">
            <StatusIcon className="h-3 w-3" />
            {statusConfig.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Saldo Principal - Hero */}
        <div className={`rounded-lg p-4 ${statusConfig.bgColor}`}>
          <p className="text-sm font-medium text-muted-foreground">Saldo Atual</p>
          <p className={`text-4xl font-bold tracking-tight ${statusConfig.color}`}>
            {formatBRL(wallet.balance_brl)}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatCredits(wallet.balance_credits)}
          </p>
        </div>

        {/* Saldo Disponível (com overdraft) */}
        {wallet.overdraft_percent > 0 && (
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Disponível para uso</p>
              <p className="text-lg font-semibold text-primary">
                {formatBRL(wallet.available_brl)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Inclui {(wallet.overdraft_percent * 100).toFixed(0)}% de overdraft (
              {formatBRL((wallet.available_credits - wallet.balance_credits) / 100)})
            </p>
          </div>
        )}

        {/* Estimativa de duração */}
        {estimatedDays !== null && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimativa de duração</span>
            <span className={`font-medium ${estimatedDays <= 7 ? 'text-red-600' : estimatedDays <= 14 ? 'text-yellow-600' : 'text-green-600'}`}>
              ~{estimatedDays} dia{estimatedDays !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Barra de Progresso */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Nível do saldo</span>
            <span className="text-muted-foreground">
              Alerta em {formatBRL(wallet.low_balance_threshold_credits / 100)}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardContent>

      <CardFooter className="border-t pt-4">
        <Button asChild className="w-full">
          <Link href="/financeiro/recarregar">Recarregar Créditos</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
