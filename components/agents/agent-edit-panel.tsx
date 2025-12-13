import { AgentEditHeader } from './agent-edit-header';
import { AgentEditTabs } from './agent-edit-tabs';
import { IntentionAgentForm } from './intention/intention-agent-form';
import { ObserverAgentForm } from './observer/observer-agent-form';
import { GuardRailsAgentForm } from './guard-rails/guard-rails-agent-form';
import type { AgentWithPrompt } from '@/types/agents';
import { AgentCategory } from './navigation/agent-category-selector';

interface AgentEditPanelProps {
  agent: AgentWithPrompt | null;
  onClose: () => void;
  onSuccess?: () => void;
  currentCategory?: AgentCategory;
}

export function AgentEditPanel({ agent, onClose, onSuccess, currentCategory = 'main' }: AgentEditPanelProps) {
  if (!agent) {
    return null;
  }

  const handleSuccess = () => {
    onSuccess?.();
    // ✅ Não fecha mais o painel automaticamente após salvar
    // Usuário pode continuar editando ou fechar manualmente
  };

  const renderContent = () => {
    switch (currentCategory) {
      case 'intention':
        return (
          <IntentionAgentForm
            agentId={agent.id}
            tenantId={agent.prompt.id_tenant || ''} // Fallback safety, should be handled better
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        );
      case 'observer':
        return (
          <ObserverAgentForm
            agentId={agent.id}
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        );
      case 'guard-rails':
        return (
          <GuardRailsAgentForm
            agentId={agent.id}
            onCancel={onClose}
            onSuccess={handleSuccess}
          />
        );
      case 'main':
      default:
        return (
          <AgentEditTabs
            agent={agent}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        );
    }
  };

  return (
    <div className="border rounded-lg shadow-sm bg-card">
      <AgentEditHeader agent={agent} onClose={onClose} />
      <div className="p-1">
        {renderContent()}
      </div>
    </div>
  );
}
