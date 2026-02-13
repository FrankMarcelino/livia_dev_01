'use client';

import { useState, useCallback } from 'react';
import { DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const MIN_AMOUNT_BRL = 5;
const MAX_AMOUNT_BRL = 5000;

interface CustomAmountInputProps {
  onSubmit: (amountCents: number) => void;
  isLoading: boolean;
}

function formatInputBRL(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  const numeric = parseInt(digits, 10) / 100;
  return numeric.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseInputBRL(formatted: string): number {
  const digits = formatted.replace(/\D/g, '');
  if (!digits) return 0;
  return parseInt(digits, 10); // centavos
}

export function CustomAmountInput({ onSubmit, isLoading }: CustomAmountInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const amountCents = parseInputBRL(displayValue);
  const amountBRL = amountCents / 100;
  const credits = amountCents; // 1 crédito = R$ 0,01

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = formatInputBRL(raw);
    setDisplayValue(formatted);
    setError(null);
  }, []);

  const handleSubmit = () => {
    if (amountBRL < MIN_AMOUNT_BRL) {
      setError(`Valor mínimo: R$ ${MIN_AMOUNT_BRL},00`);
      return;
    }
    if (amountBRL > MAX_AMOUNT_BRL) {
      setError(`Valor máximo: R$ ${MAX_AMOUNT_BRL.toLocaleString('pt-BR')},00`);
      return;
    }
    onSubmit(amountCents);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Valor Personalizado
        </CardTitle>
        <CardDescription>
          Escolha qualquer valor entre R$ {MIN_AMOUNT_BRL},00 e R$ {MAX_AMOUNT_BRL.toLocaleString('pt-BR')},00
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="custom-amount">Valor em reais</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              R$
            </span>
            <Input
              id="custom-amount"
              type="text"
              inputMode="numeric"
              placeholder="0,00"
              value={displayValue}
              onChange={handleChange}
              className="pl-10 text-lg font-semibold"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {amountCents > 0 && (
          <div className="rounded-lg border p-3 bg-muted/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Créditos recebidos</span>
              <span className="font-semibold">
                {credits.toLocaleString('pt-BR')} créditos
              </span>
            </div>
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleSubmit}
          disabled={isLoading || amountCents === 0}
        >
          {isLoading ? 'Processando...' : 'Comprar Créditos'}
        </Button>
      </CardContent>
    </Card>
  );
}
