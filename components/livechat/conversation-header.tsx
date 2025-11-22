'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, MessageSquare, Bot } from 'lucide-react';
import { toast } from 'sonner';
import type { Conversation } from '@/types/database';

interface ConversationHeaderProps {
  contactName: string;
  conversation: Conversation;
  tenantId: string;
}

export function ConversationHeader({
  contactName,
  conversation,
  tenantId,
}: ConversationHeaderProps) {
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

      toast.success('IA pausada com sucesso');
    } catch (error) {
      console.error('Erro ao pausar IA:', error);
      toast.error('Erro ao pausar IA. Tente novamente.');
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

      toast.success('IA retomada com sucesso');
    } catch (error) {
      console.error('Erro ao retomar IA:', error);
      toast.error('Erro ao retomar IA. Tente novamente.');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusDisplay = () => {
    switch (conversation.status) {
      case 'open':
        return { label: 'Conversa Ativa', variant: 'default' as const, className: 'bg-green-600' };
      case 'paused':
        return { label: 'Conversa Aguardando', variant: 'default' as const, className: 'bg-yellow-600' };
      case 'closed':
        return { label: 'Conversa Encerrada', variant: 'outline' as const, className: 'bg-gray-600' };
      default:
        return { label: conversation.status, variant: 'outline' as const, className: '' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const iaDisabled = conversation.status === 'closed';

  return (
    <div className="p-4 border-b">
      {/* Linha 1: Nome do contato + Botão IA */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold">{contactName}</h2>

        {conversation.ia_active ? (
          <Button
            onClick={handlePauseIA}
            disabled={isUpdating || iaDisabled}
            variant="outline"
            size="sm"
          >
            <Pause className="h-4 w-4 mr-2" />
            Pausar IA
          </Button>
        ) : (
          <Button
            onClick={handleResumeIA}
            disabled={isUpdating || iaDisabled}
            variant="default"
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            Retomar IA
          </Button>
        )}
      </div>

      {/* Linha 2: Canal • Status • IA */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>WhatsApp</span>
        </div>

        <span>•</span>

        <div className="flex items-center gap-1.5">
          {/* <span>Status:</span> */}
          <Badge
            variant={statusDisplay.variant}
            className={statusDisplay.className}
          >
            {statusDisplay.label}
          </Badge>
        </div>

        <span>•</span>

        <div className="flex items-center gap-1.5">
          {/* <Bot className="h-3.5 w-3.5" /> */}
          {/* <span>IA:</span> */}
          {conversation.ia_active ? (
            <Badge variant="default" className="bg-green-600">
              IA Ativada
            </Badge>
          ) : (
            <Badge variant="secondary">
              IA Desativada
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
