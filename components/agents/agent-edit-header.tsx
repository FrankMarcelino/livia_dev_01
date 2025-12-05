// Component: Agent Edit Header
// Feature: Meus Agentes IA - Master-Detail

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import type { AgentWithPrompt } from '@/types/agents';
import { AGENT_FUNCTION_LABELS } from '@/types/agents';

interface AgentEditHeaderProps {
  agent: AgentWithPrompt;
  onClose: () => void;
}

export function AgentEditHeader({ agent, onClose }: AgentEditHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-6 border-b">
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold truncate">
            🤖 {agent.name}
          </h2>
          {agent.is_customized && (
            <Badge variant="secondary">
              Personalizado
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Template de Origem */}
          {agent.template_name && (
            <div className="text-sm text-muted-foreground">
              <span>Template:</span>{' '}
              <span className="font-medium">{agent.template_name}</span>
            </div>
          )}

          {/* Separador */}
          {agent.template_name && <span className="text-muted-foreground">|</span>}

          {/* Tipo do Agent */}
          <Badge variant="outline">
            {agent.function ? AGENT_FUNCTION_LABELS[agent.function] : 'Agent'}
          </Badge>

          {/* Modo (Reativo/Proativo) */}
          <Badge variant="outline">
            {agent.type === 'active' ? 'Proativo' : 'Reativo'}
          </Badge>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="shrink-0"
      >
        <X className="w-4 h-4" />
        <span className="sr-only">Fechar edição</span>
      </Button>
    </div>
  );
}
