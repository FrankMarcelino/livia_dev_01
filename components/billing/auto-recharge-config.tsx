'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Zap,
  CreditCard,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Power,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatBRL } from '@/types/billing';
import type { AutoRechargeConfig } from '@/types/billing';
import { StripeCardSetup } from './stripe-card-form';

type Step = 'config' | 'card';

interface AutoRechargeApiResponse {
  config: AutoRechargeConfig | null;
  setupIntent: { clientSecret: string; customerId: string } | null;
}

async function fetchAutoRecharge(): Promise<AutoRechargeApiResponse> {
  const res = await fetch('/api/billing/auto-recharge');
  if (!res.ok) throw new Error('Falha ao carregar configuração');
  return res.json();
}

async function fetchSetupIntent(): Promise<{ clientSecret: string }> {
  const res = await fetch('/api/billing/auto-recharge?setupIntent=true');
  if (!res.ok) throw new Error('Falha ao preparar formulário de cartão');
  const data = await res.json();
  if (!data.setupIntent?.clientSecret) {
    throw new Error('Erro ao gerar sessão de pagamento');
  }
  return { clientSecret: data.setupIntent.clientSecret };
}

async function saveAutoRecharge(data: {
  threshold_credits: number;
  recharge_amount_cents: number;
  stripe_payment_method_id: string;
}): Promise<{ config: AutoRechargeConfig }> {
  const res = await fetch('/api/billing/auto-recharge', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao salvar');
  }
  return res.json();
}

async function disableAutoRecharge(): Promise<void> {
  const res = await fetch('/api/billing/auto-recharge', { method: 'DELETE' });
  if (!res.ok) throw new Error('Falha ao desativar');
}

function formatCardBrand(brand: string | null): string {
  if (!brand) return 'Cartão';
  const brands: Record<string, string> = {
    visa: 'Visa',
    mastercard: 'Mastercard',
    amex: 'Amex',
    elo: 'Elo',
  };
  return brands[brand.toLowerCase()] || brand;
}

export function AutoRechargeConfigCard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<Step>('config');
  const [thresholdBrl, setThresholdBrl] = useState('');
  const [rechargeBrl, setRechargeBrl] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSetup, setLoadingSetup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['auto-recharge'],
    queryFn: fetchAutoRecharge,
  });

  const saveMutation = useMutation({
    mutationFn: saveAutoRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-recharge'] });
      toast.success('Recarga automática configurada com sucesso!');
      setStep('config');
      setClientSecret(null);
      setThresholdBrl('');
      setRechargeBrl('');
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
      setIsSubmitting(false);
    },
  });

  const disableMutation = useMutation({
    mutationFn: disableAutoRecharge,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-recharge'] });
      toast.success('Recarga automática desativada');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const config = data?.config;
  const isActive = config?.is_enabled === true;
  const hasError = Boolean(config?.last_error);

  async function handleContinueToCard() {
    const threshold = Number(thresholdBrl) * 100;
    const amount = Number(rechargeBrl) * 100;

    if (threshold < 1000) {
      toast.error('Limite mínimo: R$ 10,00');
      return;
    }
    if (amount < 500) {
      toast.error('Valor mínimo de recarga: R$ 5,00');
      return;
    }

    setLoadingSetup(true);
    try {
      const { clientSecret: secret } = await fetchSetupIntent();
      setClientSecret(secret);
      setStep('card');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao preparar formulário'
      );
    } finally {
      setLoadingSetup(false);
    }
  }

  function handleCardSuccess(paymentMethodId: string) {
    const threshold = Number(thresholdBrl) * 100;
    const amount = Number(rechargeBrl) * 100;

    saveMutation.mutate({
      threshold_credits: threshold,
      recharge_amount_cents: amount,
      stripe_payment_method_id: paymentMethodId,
    });
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Estado: Ativo
  if (isActive && config) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Recarga Automática
            </CardTitle>
            <Badge
              variant="outline"
              className={hasError
                ? 'bg-red-100 text-red-800 hover:bg-red-100'
                : 'bg-green-100 text-green-800 hover:bg-green-100'}
            >
              {hasError ? 'Erro' : 'Ativa'}
            </Badge>
          </div>
          <CardDescription>
            Recarrega automaticamente quando o saldo atingir o limite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Limite</p>
              <p className="text-lg font-semibold">
                {formatBRL(config.threshold_credits / 100)}
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Valor da recarga</p>
              <p className="text-lg font-semibold">
                {formatBRL(config.recharge_amount_cents / 100)}
              </p>
            </div>
          </div>

          {config.card_last4 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              {formatCardBrand(config.card_brand)} terminando em {config.card_last4}
            </div>
          )}

          {hasError && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-red-800">Último erro</p>
                <p className="text-red-700">{config.last_error}</p>
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => disableMutation.mutate()}
            disabled={disableMutation.isPending}
          >
            {disableMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Power className="h-4 w-4 mr-2" />
            )}
            Desativar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Estado: Inativo — formulário de configuração (multi-step)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Recarga Automática
        </CardTitle>
        <CardDescription>
          {step === 'config'
            ? 'Configure para recarregar automaticamente quando o saldo estiver baixo'
            : 'Informe os dados do cartão para cobranças automáticas'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'config' && (
          <>
            <div className="rounded-lg bg-muted/50 p-3 flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <p className="text-sm text-muted-foreground">
                Quando seu saldo atingir o limite, cobraremos automaticamente o valor
                configurado no cartão salvo.
              </p>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="threshold">Limite para recarga (R$)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={10}
                  max={5000}
                  step={10}
                  placeholder="Ex: 50"
                  value={thresholdBrl}
                  onChange={(e) => setThresholdBrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Recarrega quando o saldo chegar neste valor
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="amount">Valor da recarga (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  min={5}
                  max={5000}
                  step={10}
                  placeholder="Ex: 200"
                  value={rechargeBrl}
                  onChange={(e) => setRechargeBrl(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo R$ 5,00
                </p>
              </div>
            </div>

            <Button
              className="w-full"
              disabled={!thresholdBrl || !rechargeBrl || loadingSetup}
              onClick={handleContinueToCard}
            >
              {loadingSetup ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Continuar — Adicionar Cartão
            </Button>
          </>
        )}

        {step === 'card' && clientSecret && (
          <>
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Limite:</span>
                <span className="font-medium">{formatBRL(Number(thresholdBrl))}</span>
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-muted-foreground">Valor da recarga:</span>
                <span className="font-medium">{formatBRL(Number(rechargeBrl))}</span>
              </div>
            </div>

            <StripeCardSetup
              clientSecret={clientSecret}
              onSuccess={handleCardSuccess}
              onCancel={() => {
                setStep('config');
                setClientSecret(null);
              }}
              isSubmitting={isSubmitting || saveMutation.isPending}
              setIsSubmitting={setIsSubmitting}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
