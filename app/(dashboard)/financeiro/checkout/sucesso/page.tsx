'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CheckoutSucessoPage() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Invalidate billing queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['stripe-billing'] });
    toast.success('Pagamento realizado com sucesso!');
  }, [queryClient]);

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-lg mx-auto flex items-center justify-center min-h-[60vh]">
        <Card className="w-full text-center">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Pagamento Confirmado!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">
              Seu pagamento foi processado com sucesso. Os créditos serão adicionados à sua conta em instantes.
            </p>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <Link href="/financeiro/saldo">Ver Saldo</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link href="/financeiro/recarregar">Voltar para Recargas</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
