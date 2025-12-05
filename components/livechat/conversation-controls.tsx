'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Lock, Unlock } from 'lucide-react';
import type { Conversation } from '@/types/database';
import { PauseIAConfirmDialog } from './pause-ia-confirm-dialog';
import { useApiCall } from '@/lib/hooks';

interface ConversationControlsProps {
  conversation: Conversation;
  tenantId: string;
  onUpdate?: () => void;
}

export function ConversationControls({
  conversation,
  tenantId,
  onUpdate,
}: ConversationControlsProps) {
  const [showPauseIADialog, setShowPauseIADialog] = useState(false);

  // API calls hooks
  const pauseIA = useApiCall('/api/conversations/pause-ia', 'POST', {
    successMessage: 'IA pausada com sucesso',
    errorMessage: 'Erro ao pausar IA. Tente novamente.',
    onSuccess: () => onUpdate?.(),
  });

  const pauseConversation = useApiCall('/api/conversations/pause', 'POST', {
    successMessage: 'Conversa pausada',
    errorMessage: 'Erro ao pausar conversa',
    onSuccess: () => onUpdate?.(),
  });

  const resumeConversation = useApiCall('/api/conversations/resume', 'POST', {
    successMessage: 'Conversa retomada',
    errorMessage: 'Erro ao retomar conversa',
    onSuccess: () => onUpdate?.(),
  });

  const reopenConversation = useApiCall('/api/conversations/reopen', 'POST', {
    successMessage: 'Conversa reaberta com sucesso',
    errorMessage: 'Erro ao reabrir conversa',
    onSuccess: () => onUpdate?.(),
  });

  const isUpdating =
    pauseIA.isLoading ||
    pauseConversation.isLoading ||
    resumeConversation.isLoading ||
    reopenConversation.isLoading;

  const handlePauseIAClick = () => {
    setShowPauseIADialog(true);
  };

  const handlePauseIAConfirm = async () => {
    await pauseIA.execute({
      conversationId: conversation.id,
      tenantId,
      reason: 'Pausado pelo atendente via Livechat - Modo manual permanente',
    });
  };

  const handlePauseConversation = async () => {
    await pauseConversation.execute({
      conversationId: conversation.id,
      tenantId,
      reason: 'Pausado pelo atendente via Livechat',
    });
  };

  const handleResumeConversation = async () => {
    await resumeConversation.execute({
      conversationId: conversation.id,
      tenantId,
    });
  };

  const handleReopenConversation = async () => {
    const confirmed = confirm(
      'Deseja realmente reabrir esta conversa encerrada? A IA será reativada automaticamente.'
    );
    if (!confirmed) return;

    await reopenConversation.execute({
      conversationId: conversation.id,
      tenantId,
    });
  };

  const getStatusBadge = () => {
    switch (conversation.status) {
      case 'open':
        return <Badge variant="default" className="bg-green-600">Aberta</Badge>;
      case 'paused':
        return <Badge variant="secondary" className="bg-yellow-600">Pausada</Badge>;
      case 'closed':
        return <Badge variant="outline" className="bg-gray-600">Encerrada</Badge>;
      default:
        return <Badge variant="outline">{conversation.status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-3 p-4 border-b">
      {/* Status da Conversa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status:</span>
          {getStatusBadge()}
        </div>

        {conversation.status === 'open' ? (
          <Button
            onClick={handlePauseConversation}
            disabled={isUpdating}
            variant="outline"
            size="sm"
          >
            <Lock className="h-4 w-4 mr-2" />
            Pausar Conversa
          </Button>
        ) : conversation.status === 'paused' ? (
          <Button
            onClick={handleResumeConversation}
            disabled={isUpdating}
            variant="default"
            size="sm"
          >
            <Unlock className="h-4 w-4 mr-2" />
            Retomar Conversa
          </Button>
        ) : conversation.status === 'closed' ? (
          <Button
            onClick={handleReopenConversation}
            disabled={isUpdating}
            variant="default"
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Unlock className="h-4 w-4 mr-2" />
            Reabrir Conversa
          </Button>
        ) : null}
      </div>

      {/* Status da IA */}
      {conversation.status !== 'closed' && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">IA:</span>
            {conversation.ia_active ? (
              <Badge variant="default" className="bg-green-600">
                Ativa
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-500">
                Pausada (Modo Manual)
              </Badge>
            )}
          </div>

          <Button
            onClick={handlePauseIAClick}
            disabled={!conversation.ia_active || isUpdating || conversation.status === 'paused'}
            variant="outline"
            size="sm"
            title={
              !conversation.ia_active
                ? "IA pausada. Não pode ser retomada durante a conversa (perda de contexto). Continue em modo manual até encerrar."
                : conversation.status === 'paused'
                ? "Não é possível pausar IA enquanto conversa está pausada"
                : "Pausar IA - Atendimento passará para modo manual permanente até encerrar conversa"
            }
          >
            <Pause className="h-4 w-4 mr-2" />
            Pausar IA
          </Button>
        </div>
      )}

      <PauseIAConfirmDialog
        open={showPauseIADialog}
        onOpenChange={setShowPauseIADialog}
        onConfirm={handlePauseIAConfirm}
        trigger="manual"
      />
    </div>
  );
}
