'use client';

import Link from 'next/link';
import {
  Mail,
  MessageCircle,
  CreditCard,
  History,
  ArrowLeft,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import type { WalletWithComputed, LedgerEntry } from '@/types/billing';
import { formatBRL } from '@/types/billing';

interface RechargePageContentProps {
  tenantId: string;
  tenantName: string;
  wallet: WalletWithComputed | null;
  rechargeHistory: LedgerEntry[];
}

/**
 * Formata data para exibição
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/**
 * Conteúdo da página de Recarga
 *
 * MVP: Instruções para recarga manual + histórico
 */
export function RechargePageContent({
  tenantName,
  wallet,
  rechargeHistory,
}: RechargePageContentProps) {
  // Email e WhatsApp para contato (pode ser configurável)
  const contactEmail = 'financeiro@livia.ai';
  const contactWhatsApp = '5511999999999'; // Substituir pelo número real

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/financeiro/saldo">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recarregar Créditos</h1>
          <p className="text-muted-foreground">
            Solicite uma recarga para continuar usando os serviços
          </p>
        </div>

        <Separator />

        {/* Saldo Atual */}
        {wallet && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Saldo Atual
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">
                  {formatBRL(wallet.balance_brl)}
                </span>
                <span className="text-muted-foreground">
                  ({wallet.balance_credits.toLocaleString('pt-BR')} créditos)
                </span>
              </div>
              {wallet.status === 'low' && (
                <p className="text-sm text-yellow-600 mt-2">
                  Seu saldo está baixo. Recomendamos fazer uma recarga.
                </p>
              )}
              {wallet.status === 'critical' && (
                <p className="text-sm text-red-600 mt-2">
                  Seu saldo está crítico! Faça uma recarga para evitar interrupção dos serviços.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Instruções de Recarga */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Como Recarregar
            </CardTitle>
            <CardDescription>
              Siga as instruções abaixo para solicitar uma recarga
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Passo 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h4 className="font-medium">Escolha o valor da recarga</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Defina quanto deseja recarregar. Valores mínimo: R$ 50,00
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[50, 100, 200, 500].map((value) => (
                    <Badge key={value} variant="outline" className="text-sm">
                      R$ {value},00
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h4 className="font-medium">Entre em contato conosco</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Envie sua solicitação por email ou WhatsApp informando:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Nome da empresa: <strong>{tenantName}</strong></li>
                  <li>Valor desejado da recarga</li>
                  <li>Forma de pagamento preferida (PIX, boleto, etc)</li>
                </ul>

                <div className="flex flex-wrap gap-3 mt-4">
                  <Button variant="outline" asChild>
                    <a href={`mailto:${contactEmail}?subject=Solicitação de Recarga - ${tenantName}`}>
                      <Mail className="h-4 w-4 mr-2" />
                      {contactEmail}
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a
                      href={`https://wa.me/${contactWhatsApp}?text=Olá! Gostaria de solicitar uma recarga de créditos para ${tenantName}.`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      WhatsApp
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h4 className="font-medium">Realize o pagamento</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Após o contato, você receberá os dados para pagamento (PIX, boleto ou transferência).
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h4 className="font-medium">Créditos liberados</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Após a confirmação do pagamento, seus créditos serão adicionados automaticamente.
                  O prazo é de até 24 horas úteis.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Recargas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Histórico de Recargas
            </CardTitle>
            <CardDescription>
              Suas últimas recargas realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rechargeHistory.length > 0 ? (
              <div className="space-y-3">
                {rechargeHistory.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium">
                          {formatBRL(entry.amount_credits / 100)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.description || 'Recarga de créditos'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {formatDate(entry.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma recarga realizada ainda</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
