'use client';

import Link from 'next/link';
import { XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function CheckoutCanceladoPage() {
  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <XCircle className="h-16 w-16 text-muted-foreground" />
            </div>
            <CardTitle className="text-2xl">Checkout Cancelado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/financeiro/recarregar">Tentar Novamente</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/financeiro/saldo">Voltar para Saldo</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
