'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Loader2, CreditCard, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface CardFormInnerProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

function CardFormInner({
  clientSecret,
  onSuccess,
  onCancel,
  isSubmitting,
  setIsSubmitting,
}: CardFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setIsSubmitting(true);
    setError(null);

    const { error: stripeError, setupIntent } =
      await stripe.confirmCardSetup(clientSecret, {
        payment_method: { card: cardElement },
      });

    if (stripeError) {
      setError(stripeError.message || 'Erro ao salvar cartão');
      setIsSubmitting(false);
      return;
    }

    if (!setupIntent?.payment_method) {
      setError('Erro inesperado. Tente novamente.');
      setIsSubmitting(false);
      return;
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === 'string'
        ? setupIntent.payment_method
        : setupIntent.payment_method.id;

    onSuccess(paymentMethodId);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border p-4 bg-background">
        <div className="flex items-center gap-2 mb-3 text-sm font-medium">
          <CreditCard className="h-4 w-4" />
          Dados do Cartão
        </div>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1a1a2e',
                '::placeholder': { color: '#9ca3af' },
              },
              invalid: { color: '#dc2626' },
            },
            hidePostalCode: true,
          }}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !stripe}
          className="flex-1"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          Salvar e Ativar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Seus dados de pagamento são processados diretamente pelo Stripe.
        Nenhum dado de cartão é armazenado em nossos servidores.
      </p>
    </div>
  );
}

interface StripeCardSetupProps {
  clientSecret: string;
  onSuccess: (paymentMethodId: string) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
}

export function StripeCardSetup({
  clientSecret,
  onSuccess,
  onCancel,
  isSubmitting,
  setIsSubmitting,
}: StripeCardSetupProps) {
  return (
    <Elements stripe={stripePromise}>
      <CardFormInner
        clientSecret={clientSecret}
        onSuccess={onSuccess}
        onCancel={onCancel}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />
    </Elements>
  );
}
