'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, Lock, Unlock } from 'lucide-react';
import type { Conversation } from '@/types/database';

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
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePauseIA = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/conversations/pause-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
          reason: 'Pausado pelo atendente via Livechat',
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao pausar IA');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao pausar IA:', error);
      alert('Erro ao pausar IA. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeIA = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/conversations/resume-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao retomar IA');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao retomar IA:', error);
      alert('Erro ao retomar IA. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePauseConversation = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/conversations/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
          reason: 'Pausado pelo atendente via Livechat',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao pausar conversa');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao pausar conversa:', error);
      alert(error instanceof Error ? error.message : 'Erro ao pausar conversa. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResumeConversation = async () => {
    if (isUpdating) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/conversations/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao retomar conversa');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao retomar conversa:', error);
      alert(error instanceof Error ? error.message : 'Erro ao retomar conversa. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReopenConversation = async () => {
    if (isUpdating) return;

    const confirmed = confirm(
      'Deseja realmente reabrir esta conversa encerrada? A IA será reativada automaticamente.'
    );
    if (!confirmed) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/conversations/reopen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao reabrir conversa');
      }

      onUpdate?.();
    } catch (error) {
      console.error('Erro ao reabrir conversa:', error);
      alert(error instanceof Error ? error.message : 'Erro ao reabrir conversa. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
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
            <Play className="h-4 w-4 mr-2" />
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
              <Badge variant="secondary">Pausada</Badge>
            )}
          </div>

          {conversation.ia_active ? (
            <Button
              onClick={handlePauseIA}
              disabled={isUpdating || conversation.status === 'paused'}
              variant="outline"
              size="sm"
            >
              <Pause className="h-4 w-4 mr-2" />
              Pausar IA
            </Button>
          ) : (
            <Button
              onClick={handleResumeIA}
              disabled={isUpdating || conversation.status === 'paused'}
              variant="default"
              size="sm"
            >
              <Play className="h-4 w-4 mr-2" />
              Retomar IA
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
