// Componente: Lista de Agents
// Feature: Meus Agentes IA

'use client';

import { AgentCard } from './agent-card';
import type { AgentWithPrompt } from '@/types/agents';

interface AgentsListProps {
  agents: AgentWithPrompt[];
}

export function AgentsList({ agents }: AgentsListProps) {
  if (agents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold mb-2">Nenhum agent encontrado</h3>
        <p className="text-muted-foreground max-w-md">
          Seu Neurocore ainda não possui agents configurados. Entre em contato com o
          administrador para configurar seus agents.
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {agents.map((agent) => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  );
}
