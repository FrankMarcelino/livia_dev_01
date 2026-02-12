'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import type { SubscriptionPlan, SubscriptionStatus } from '@/types/stripe';

interface SubscriptionPlansProps {
  plans: SubscriptionPlan[];
  currentStatus: SubscriptionStatus;
}

export function SubscriptionPlans({ plans, currentStatus }: SubscriptionPlansProps) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const isSubscribed = currentStatus === 'active' || currentStatus === 'trialing';

  async function handleSubscribe(priceId: string) {
    setLoadingPlan(priceId);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'subscription', priceId }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao iniciar assinatura');
      }

      window.location.href = data.url;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erro ao processar. Tente novamente.'
      );
      setLoadingPlan(null);
    }
  }

  if (plans.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {plans.map((plan) => (
        <Card key={plan.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              {isSubscribed && (
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
                  Atual
                </Badge>
              )}
            </div>
            {plan.description && (
              <CardDescription>{plan.description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-3xl font-bold">
              R$ {(plan.price_brl / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-sm font-normal text-muted-foreground">
                /{plan.interval === 'month' ? 'mês' : 'ano'}
              </span>
            </p>

            {plan.features.length > 0 && (
              <ul className="space-y-2">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
          <CardFooter>
            {isSubscribed ? (
              <Button variant="outline" className="w-full" disabled>
                Plano atual
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={() => handleSubscribe(plan.stripe_price_id)}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === plan.stripe_price_id ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Assinar
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
