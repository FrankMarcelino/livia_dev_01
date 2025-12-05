// Componente: Dialog de Edição de Agent
// Feature: Meus Agentes IA

'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AgentPromptForm } from './agent-prompt-form';
import type { AgentWithPrompt } from '@/types/agents';
import { AGENT_FUNCTION_LABELS } from '@/types/agents';

interface AgentEditDialogProps {
  agent: AgentWithPrompt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AgentEditDialog({ agent, open, onOpenChange }: AgentEditDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {agent.name}
            {agent.is_customized && (
              <span className="text-xs font-normal text-muted-foreground">
                (Personalizado)
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {agent.function ? AGENT_FUNCTION_LABELS[agent.function] : 'Agent'} • {agent.type === 'active' ? 'Proativo' : 'Reativo'}
            {agent.template_name && (
              <span className="ml-2">• Template: {agent.template_name}</span>
            )}
          </DialogDescription>
        </DialogHeader>
        
        <AgentPromptForm 
          agent={agent}
          onSuccess={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
