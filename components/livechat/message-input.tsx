'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { QuickRepliesPanel } from './quick-replies-panel';

interface MessageInputProps {
  conversationId: string;
  tenantId: string;
  contactName: string;
  onSend?: () => void;
  disabled?: boolean;
}

export function MessageInput({
  conversationId,
  tenantId,
  contactName,
  onSend,
  disabled = false,
}: MessageInputProps) {
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSend = async () => {
    if (!content.trim() || isSending) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/n8n/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          tenantId: tenantId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      setContent('');
      onSend?.();
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickReplySelect = (message: string) => {
    setContent(message);
  };

  return (
    <div className="flex gap-2 p-4 border-t">
      <QuickRepliesPanel
        conversationId={conversationId}
        tenantId={tenantId}
        contactName={contactName}
        onSelect={handleQuickReplySelect}
        disabled={disabled || isSending}
      />
      <Textarea
        placeholder="Digite sua mensagem..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled || isSending}
        className="min-h-[60px] max-h-[120px] resize-none"
      />
      <Button
        onClick={handleSend}
        disabled={!content.trim() || disabled || isSending}
        size="icon"
        className="h-[60px] w-[60px]"
      >
        <Send className="h-5 w-5" />
      </Button>
    </div>
  );
}
