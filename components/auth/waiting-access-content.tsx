'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Copy, Check, LogOut, Clock } from 'lucide-react';
import { logout } from '@/app/actions/auth';
import { toast } from 'sonner';

interface WaitingAccessContentProps {
  fullName: string;
  email: string;
  inviteCode: string | null;
}

export function WaitingAccessContent({
  fullName,
  email,
  inviteCode,
}: WaitingAccessContentProps) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      toast.success('Código copiado!');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar código.');
    }
  };

  return (
    <Card className="w-full max-w-md border-zinc-200 dark:border-zinc-800">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
          <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
        </div>
        <CardTitle className="text-xl">Aguardando Acesso</CardTitle>
        <CardDescription>
          Sua conta foi criada com sucesso. Informe o código abaixo ao
          administrador da sua empresa para liberar seu acesso à plataforma.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {inviteCode && (
          <div className="text-center">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Seu código de acesso
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-[0.3em] text-foreground">
                {inviteCode}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopyCode}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        )}

        <div className="rounded-lg bg-muted/50 p-4 text-sm space-y-1">
          <p>
            <span className="font-medium">Nome:</span> {fullName}
          </p>
          <p>
            <span className="font-medium">E-mail:</span> {email}
          </p>
        </div>

        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 text-sm text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">Como funciona?</p>
          <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
            <li>Copie o código acima</li>
            <li>Envie para o administrador da sua empresa</li>
            <li>
              Ele vai associar seu acesso e definir quais funcionalidades
              você poderá usar
            </li>
            <li>Depois, basta fazer login novamente</li>
          </ol>
        </div>
      </CardContent>

      <CardFooter>
        <form action={logout} className="w-full">
          <Button type="submit" variant="outline" className="w-full gap-2">
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
