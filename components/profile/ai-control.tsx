'use client';

import { useState, useTransition } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Bot, Loader2, AlertTriangle } from 'lucide-react';
import { toggleAIPause } from '@/app/actions/ai-control';

/**
 * Componente de Controle da IA com Confirmação de Segurança
 *
 * Princípios SOLID:
 * - Single Responsibility: Gerencia apenas o toggle de pausar/retomar IA
 * - Interface Segregation: Props mínimas (userId, tenantId)
 *
 * Features:
 * - Switch para pausar/retomar IA do tenant
 * - Dialog de confirmação ao pausar (requer digitar "PAUSAR")
 * - Retomar é simples (sem confirmação)
 * - Feedback com toast
 * - Loading state durante atualização
 * - Persiste estado no Supabase (tenants.ia_active)
 */

interface AIControlProps {
  userId: string;
  tenantId: string;
  initialPaused?: boolean;
}

export function AIControl({ userId, tenantId, initialPaused = false }: AIControlProps) {
  const [isPaused, setIsPaused] = useState(initialPaused);
  const [isPending, startTransition] = useTransition();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const isConfirmationValid = confirmationText.toUpperCase() === 'PAUSAR';

  // Executa a ação de pausar/retomar no servidor
  const executeToggle = async (shouldPause: boolean) => {
    startTransition(async () => {
      const result = await toggleAIPause(userId, tenantId, shouldPause);

      if (result.error) {
        // Reverte em caso de erro
        setIsPaused(!shouldPause);
        toast.error('Erro ao atualizar configuração', {
          description: result.error,
        });
      } else {
        const conversationsCount = result.affectedConversations || 0;

        if (shouldPause) {
          // Mensagem ao PAUSAR IA
          const conversationsText =
            conversationsCount === 0
              ? 'Nenhuma conversa aberta foi afetada'
              : conversationsCount === 1
              ? '1 conversa foi movida para "Aguardando"'
              : `${conversationsCount} conversas foram movidas para "Aguardando"`;

          toast.success('IA pausada com sucesso', {
            description: `${conversationsText}. A IA não responderá automaticamente às mensagens. Conversas aguardam atendimento manual.`,
          });
        } else {
          // Mensagem ao RETOMAR IA
          toast.success('IA reativada com sucesso', {
            description:
              'A IA voltará a funcionar apenas para NOVAS conversas. Conversas em "Aguardando" continuam aguardando atendimento manual.',
          });
        }
      }
    });
  };

  const handleToggle = (checked: boolean) => {
    if (checked) {
      // Tentando PAUSAR - abre dialog de confirmação
      setShowConfirmDialog(true);
    } else {
      // Tentando RETOMAR - ação direta sem confirmação
      setIsPaused(false);
      executeToggle(false);
    }
  };

  const handleConfirmPause = () => {
    if (!isConfirmationValid) return;

    // Fecha dialog e pausa
    setShowConfirmDialog(false);
    setConfirmationText('');
    setIsPaused(true);
    executeToggle(true);
  };

  const handleCancelPause = () => {
    // Fecha dialog e mantém estado atual
    setShowConfirmDialog(false);
    setConfirmationText('');
  };

  return (
    <>
      <div className="flex items-center justify-between space-x-4">
        <div className="flex items-start gap-3 flex-1">
          <Bot className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div className="space-y-1">
            <Label
              htmlFor="ai-pause"
              className="text-base font-medium cursor-pointer"
            >
              Pausar Assistente Virtual
            </Label>
            <p className="text-sm text-muted-foreground">
              {isPaused
                ? 'A IA está pausada e não responderá automaticamente'
                : 'A IA está ativa e responderá automaticamente às mensagens'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          <Switch
            id="ai-pause"
            checked={isPaused}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Dialog de Confirmação para Pausar IA */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Pausar Assistente Virtual
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                A IA será pausada e <strong>não responderá automaticamente</strong> às
                mensagens.
              </p>
              <p>
                Todas as conversas abertas serão movidas para o status{' '}
                <strong>&quot;Aguardando&quot;</strong> e precisarão de atendimento manual.
              </p>
              <p className="text-muted-foreground text-sm">
                Ao reativar a IA, ela funcionará apenas para novas conversas. As conversas
                em &quot;Aguardando&quot; continuarão aguardando atendimento manual.
              </p>
              <div className="pt-2">
                <Label htmlFor="confirm-pause" className="text-sm font-medium">
                  Digite <strong>PAUSAR</strong> para confirmar:
                </Label>
                <Input
                  id="confirm-pause"
                  value={confirmationText}
                  onChange={(e) => setConfirmationText(e.target.value)}
                  placeholder="PAUSAR"
                  className="mt-2"
                  autoComplete="off"
                  autoFocus
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelPause}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={handleConfirmPause}
              disabled={!isConfirmationValid}
            >
              Confirmar Pausa
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
