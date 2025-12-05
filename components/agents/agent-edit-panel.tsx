// Component: Agent Edit Panel (Master-Detail Container)
// Feature: Meus Agentes IA

'use client';

import { AgentEditHeader } from './agent-edit-header';
import { AgentEditTabs } from './agent-edit-tabs';
import type { AgentWithPrompt } from '@/types/agents';

interface AgentEditPanelProps {
  agent: AgentWithPrompt | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AgentEditPanel({ agent, onClose, onSuccess }: AgentEditPanelProps) {
  if (!agent) {
    return null;
  }

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  return (
    <div className="border rounded-lg shadow-sm bg-card">
      <AgentEditHeader agent={agent} onClose={onClose} />

      <div>
        <AgentEditTabs
          agent={agent}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
