// Seção: Informações Básicas (Read-only)
// Feature: Meus Agentes IA

'use client';

import type { AgentWithPrompt } from '@/types/agents';
import { AGENT_TYPE_LABELS } from '@/types/agents';

interface BasicInfoSectionProps {
  agent: AgentWithPrompt;
}

export function BasicInfoSection({ agent }: BasicInfoSectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Informações Básicas</h3>
        <p className="text-sm text-muted-foreground">
          Informações técnicas do agent (não editável)
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
        <div>
          <label className="text-xs font-medium text-muted-foreground">Nome</label>
          <p className="text-sm font-medium mt-1">{agent.name}</p>
        </div>
        
        <div>
          <label className="text-xs font-medium text-muted-foreground">Tipo</label>
          <p className="text-sm font-medium mt-1">
            {AGENT_TYPE_LABELS[agent.type]}
          </p>
        </div>

        {/* COMMENTED OUT: type field has different values now */}
        {/* <div>
          <label className="text-xs font-medium text-muted-foreground">Modo</label>
          <div className="mt-1">
            <Badge variant="outline">
              {agent.type === 'active' ? 'Proativo' : 'Reativo'}
            </Badge>
          </div>
        </div> */}
        
        {agent.template_name && (
          <div>
            <label className="text-xs font-medium text-muted-foreground">Template de Origem</label>
            <p className="text-sm font-medium mt-1">{agent.template_name}</p>
          </div>
        )}
      </div>
    </div>
  );
}
