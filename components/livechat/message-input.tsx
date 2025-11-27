'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { toast } from 'sonner';
import { QuickRepliesPanel } from './quick-replies-panel';
import { QuickReplyCommand } from './quick-reply-command';
import { useQuickReplyCommand } from '@/hooks/use-quick-reply-command';
import { usePrefetchQuickReplies } from '@/hooks/use-quick-replies-cache';
import type { Conversation } from '@/types/database';
import { PauseIAConfirmDialog } from './pause-ia-confirm-dialog';

interface MessageInputProps {
  conversation: Conversation;
  tenantId: string;
  contactName: string;
  onSend?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  conversation,
  tenantId,
  contactName,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showPauseIADialog, setShowPauseIADialog] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Prefetch: carrega respostas rápidas em background para abertura instantânea
  usePrefetchQuickReplies({ tenantId });

  // Hook para gerenciar command palette de respostas rápidas
  const quickReplyCommand = useQuickReplyCommand({
    onRemoveText: (start, length) => {
      // Remove "/" ou "//" do texto
      const newContent = content.slice(0, start) + content.slice(start + length);
      setContent(newContent);

      // Atualiza cursor após remoção
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = start;
          textareaRef.current.selectionEnd = start;
          textareaRef.current.focus();
        }
      }, 0);
    },
  });

  const handleSendClick = () => {
    if (!content.trim() || isSending) return;

    // Se IA está ativa, mostrar confirmação antes de enviar
    if (conversation.ia_active) {
      setPendingMessage(content.trim());
      setShowPauseIADialog(true);
      return;
    }

    // Se IA já está pausada, enviar direto
    sendMessage(content.trim());
  };

  const handleConfirmSendAndPauseIA = () => {
    sendMessage(pendingMessage);
    setPendingMessage('');
  };

  const sendMessage = async (messageContent: string) => {
    if (!messageContent || isSending) return;

    setIsSending(true);
    try {
      // 1. Se conversa está pausada, retomar automaticamente
      if (conversation.status === 'paused') {
        const resumeResponse = await fetch('/api/conversations/resume', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            tenantId: tenantId,
          }),
        });

        if (!resumeResponse.ok) {
          const errorData = await resumeResponse.json();
          throw new Error(errorData.error || 'Erro ao retomar conversa');
        }

        // Aguarda um momento para garantir que o realtime atualizou
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      // 2. Enviar mensagem normalmente
      const response = await fetch('/api/n8n/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          tenantId: tenantId,
          content: messageContent,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      setContent('');
      onSend?.();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error(
        error instanceof Error ? error.message : 'Erro ao enviar mensagem'
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const handleQuickReplySelect = (message: string) => {
    setContent(message);
  };

  const handleQuickReplyCommandSelect = (processedContent: string, _quickReplyId: string) => {
    // Insere o conteúdo da resposta rápida na posição do trigger
    const { triggerPosition } = quickReplyCommand;
    const newContent =
      content.slice(0, triggerPosition) +
      processedContent +
      content.slice(triggerPosition);

    setContent(newContent);

    // Move cursor para o final do texto inserido
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = triggerPosition + processedContent.length;
        textareaRef.current.selectionStart = newCursorPos;
        textareaRef.current.selectionEnd = newCursorPos;
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    setContent(newValue);

    // Notifica o hook sobre mudanças no input (para detectar "/" e "//")
    quickReplyCommand.handleTextareaInput(newValue, cursorPos);
  };

  return (
    <div className="flex gap-2 p-4 border-t">
      <QuickRepliesPanel
        conversationId={conversation.id}
        tenantId={tenantId}
        contactName={contactName}
        onSelect={handleQuickReplySelect}
        disabled={disabled || isSending}
      />
      <Textarea
        ref={textareaRef}
        placeholder="Digite sua mensagem..."
        value={content}
        onChange={handleContentChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        className="min-h-[60px] max-h-[120px] resize-none"
      />
      <Button
        onClick={handleSendClick}
        disabled={!content.trim() || disabled || isSending}
        size="icon"
        className="h-[60px] w-[60px]"
      >
        <Send className="h-5 w-5" />
      </Button>

      <PauseIAConfirmDialog
        open={showPauseIADialog}
        onOpenChange={setShowPauseIADialog}
        onConfirm={handleConfirmSendAndPauseIA}
        trigger="message_send"
      />

      <QuickReplyCommand
        isOpen={quickReplyCommand.isOpen}
        onClose={quickReplyCommand.closeCommand}
        mode={quickReplyCommand.mode}
        tenantId={tenantId}
        contactName={contactName}
        conversationId={conversation.id}
        onSelect={handleQuickReplyCommandSelect}
      />
    </div>
  );
}
