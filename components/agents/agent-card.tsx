// Componente: Card de Agent Individual
// Feature: Meus Agentes IA

'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings2 } from 'lucide-react';
import { AgentEditDialog } from './agent-edit-dialog';
import type { AgentWithPrompt } from '@/types/agents';
import { AGENT_FUNCTION_LABELS } from '@/types/agents';

interface AgentCardProps {
  agent: AgentWithPrompt;
}

export function AgentCard({ agent }: AgentCardProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  
  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
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
          
          {/* Indicadores de Configuração */}
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
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => setIsEditOpen(true)}
            variant="outline"
          >
            <Settings2 className="w-4 h-4 mr-2" />
            Editar Configuração
          </Button>
        </CardFooter>
      </Card>
      
      <AgentEditDialog 
        agent={agent}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />
    </>
  );
}
