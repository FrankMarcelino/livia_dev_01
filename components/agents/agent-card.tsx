// Componente: Card de Agent Individual
// Feature: Meus Agentes IA

'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { AgentWithPrompt } from '@/types/agents';
import { AGENT_FUNCTION_LABELS } from '@/types/agents';

interface AgentCardProps {
  agent: AgentWithPrompt;
  isSelected?: boolean;
  onSelect: (agent: AgentWithPrompt) => void;
}

export function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <Card 
      className={cn(
        "min-w-[320px] max-w-[320px] flex-shrink-0 hover:shadow-lg transition-all cursor-pointer",
        isSelected && "ring-2 ring-primary shadow-lg"
      )}
      onClick={() => onSelect(agent)}
    >
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <CardTitle className="truncate">{agent.name}</CardTitle>
              <CardDescription className="mt-1">
                {agent.function ? AGENT_FUNCTION_LABELS[agent.function] : 'Agent'}
              </CardDescription>
            </div>
            {agent.is_customized && (
              <Badge variant="secondary" className="shrink-0">
                Personalizado
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Template de Origem */}
          {agent.template_name && (
            <div className="text-sm">
              <span className="text-muted-foreground">Template:</span>{' '}
              <span className="font-medium">{agent.template_name}</span>
            </div>
          )}
          
          {/* Modo (Reativo/Proativo) */}
          <div className="text-sm">
            <span className="text-muted-foreground">Modo:</span>{' '}
            <Badge variant="outline" className="ml-1">
              {agent.type === 'active' ? 'Proativo' : 'Reativo'}
            </Badge>
          </div>
          
          {/* Indicadores de Configuração JSONB */}
          <div className="flex flex-wrap gap-2 pt-2">
            {agent.prompt.limitations && agent.prompt.limitations.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {agent.prompt.limitations.length} Limitações
              </Badge>
            )}
            {agent.prompt.instructions && agent.prompt.instructions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {agent.prompt.instructions.length} Instruções
              </Badge>
            )}
            {agent.prompt.guide_line && agent.prompt.guide_line.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {agent.prompt.guide_line.length} Etapas
              </Badge>
            )}
            {agent.prompt.rules && agent.prompt.rules.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {agent.prompt.rules.length} Regras
              </Badge>
            )}
            {agent.prompt.others_instructions && agent.prompt.others_instructions.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {agent.prompt.others_instructions.length} Outras Instruções
              </Badge>
            )}
          </div>

          {/* Indicadores de Personalidade */}
          {(agent.prompt.name || agent.prompt.age || agent.prompt.gender ||
            agent.prompt.objective || agent.prompt.comunication || agent.prompt.personality) && (
            <div className="flex flex-wrap gap-2 pt-1">
              {agent.prompt.name && (
                <Badge variant="outline" className="text-xs">
                  Nome: {agent.prompt.name}
                </Badge>
              )}
              {agent.prompt.age && (
                <Badge variant="outline" className="text-xs">
                  Idade: {agent.prompt.age}
                </Badge>
              )}
              {agent.prompt.gender && (
                <Badge variant="outline" className="text-xs">
                  Gênero: {agent.prompt.gender}
                </Badge>
              )}
              {agent.prompt.objective && (
                <Badge variant="outline" className="text-xs">
                  Com Objetivo
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
  );
}
