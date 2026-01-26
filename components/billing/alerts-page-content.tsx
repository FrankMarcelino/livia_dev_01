'use client';

import { useState } from 'react';
import { Bell, Settings, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WalletWithComputed, BillingNotification } from '@/types/billing';
import { formatBRL } from '@/types/billing';

interface AlertsPageContentProps {
  tenantId: string;
  wallet: WalletWithComputed | null;
  notifications: BillingNotification[];
}

/**
 * Formata data para exibição
 */
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Retorna ícone e cor baseado na severidade
 */
function getSeverityConfig(severity: string) {
  switch (severity) {
    case 'critical':
      return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' };
    case 'warning':
      return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50' };
    case 'info':
    default:
      return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50' };
  }
}

/**
 * Componente de Configurações de Alerta
 */
function AlertSettings({ wallet }: { wallet: WalletWithComputed | null }) {
  const [threshold, setThreshold] = useState(
    wallet ? (wallet.low_balance_threshold_credits / 100).toString() : '50'
  );
  const [notifyLowBalance, setNotifyLowBalance] = useState(
    wallet?.notify_low_balance ?? true
  );
  const [notifyHardStop, setNotifyHardStop] = useState(
    wallet?.notify_hard_stop ?? true
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setSaved(false);

    // Simulação - em produção chamar API PATCH /api/billing/wallet/settings
    await new Promise((resolve) => setTimeout(resolve, 1000));

    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações de Alerta
        </CardTitle>
        <CardDescription>
          Defina quando você deseja ser notificado sobre seu saldo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Threshold de Saldo Baixo */}
        <div className="space-y-3">
          <Label htmlFor="threshold">Alertar quando saldo atingir</Label>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">R$</span>
            <Input
              id="threshold"
              type="number"
              min="10"
              step="10"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">
              ({parseInt(threshold) * 100} créditos)
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Valor atual: {wallet ? formatBRL(wallet.low_balance_threshold_credits / 100) : 'N/A'}
          </p>
        </div>

        <Separator />

        {/* Toggles de Notificação */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-low">Notificar saldo baixo</Label>
              <p className="text-xs text-muted-foreground">
                Receber alerta quando saldo atingir o limite definido
              </p>
            </div>
            <Switch
              id="notify-low"
              checked={notifyLowBalance}
              onCheckedChange={setNotifyLowBalance}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="notify-stop">Notificar hard stop</Label>
              <p className="text-xs text-muted-foreground">
                Receber alerta quando serviços forem pausados por falta de saldo
              </p>
            </div>
            <Switch
              id="notify-stop"
              checked={notifyHardStop}
              onCheckedChange={setNotifyHardStop}
            />
          </div>
        </div>

        <Separator />

        {/* Botão Salvar */}
        <div className="flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Configurações salvas
              </span>
            )}
          </div>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Lista de Notificações
 */
function NotificationsList({ notifications }: { notifications: BillingNotification[] }) {
  if (notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Histórico de Notificações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma notificação encontrada</p>
            <p className="text-sm">Você será notificado quando houver alertas de saldo</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Histórico de Notificações
        </CardTitle>
        <CardDescription>
          Últimas {notifications.length} notificações de billing
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y">
          {notifications.map((notification) => {
            const config = getSeverityConfig(notification.severity);
            const Icon = config.icon;

            return (
              <div
                key={notification.id}
                className="flex items-start gap-4 p-4 hover:bg-muted/50"
              >
                <div className={`p-2 rounded-full ${config.bg}`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{notification.title}</p>
                    <Badge
                      variant={
                        notification.status === 'sent'
                          ? 'default'
                          : notification.status === 'failed'
                            ? 'destructive'
                            : 'secondary'
                      }
                      className="text-xs"
                    >
                      {notification.status === 'sent'
                        ? 'Enviado'
                        : notification.status === 'failed'
                          ? 'Falhou'
                          : 'Pendente'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{formatDate(notification.created_at)}</span>
                    {notification.channels.length > 0 && (
                      <span>via {notification.channels.join(', ')}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Conteúdo da Página de Alertas
 */
export function AlertsPageContent({
  wallet,
  notifications,
}: AlertsPageContentProps) {
  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Alertas
          </h1>
          <p className="text-muted-foreground">
            Configure alertas de saldo e visualize notificações
          </p>
        </div>

        <Separator />

        {/* Tabs */}
        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="notifications">
            <NotificationsList notifications={notifications} />
          </TabsContent>

          <TabsContent value="settings">
            <AlertSettings wallet={wallet} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
