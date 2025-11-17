'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pause, Play } from 'lucide-react';
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
          conversation_id: conversation.id,
          tenant_id: tenantId,
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
          conversation_id: conversation.id,
          tenant_id: tenantId,
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

  return (
    <div className="flex items-center justify-between p-4 border-b">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Status IA:</span>
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
          disabled={isUpdating}
          variant="outline"
          size="sm"
        >
          <Pause className="h-4 w-4 mr-2" />
          Pausar IA
        </Button>
      ) : (
        <Button
          onClick={handleResumeIA}
          disabled={isUpdating}
          variant="default"
          size="sm"
        >
          <Play className="h-4 w-4 mr-2" />
          Retomar IA
        </Button>
      )}
    </div>
  );
}
