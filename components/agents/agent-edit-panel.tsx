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
    // ✅ Não fecha mais o painel automaticamente após salvar
    // Usuário pode continuar editando ou fechar manualmente
  };

  return (
    <div className="border rounded-lg shadow-sm bg-card">
      <AgentEditHeader agent={agent} onClose={onClose} />
      <div className="p-1">
        <AgentEditTabs
          agent={agent}
          onSuccess={handleSuccess}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
