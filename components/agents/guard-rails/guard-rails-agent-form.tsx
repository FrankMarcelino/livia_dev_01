'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateAgentPromptGuardRailsAction, getAgentPromptGuardRailsAction } from '@/app/actions/agents';
import { toast } from 'sonner';

interface GuardRailsAgentFormProps {
  agentId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function GuardRailsAgentForm({ agentId, onCancel, onSuccess }: GuardRailsAgentFormProps) {
  const [jailbreakPrompt, setJailbreakPrompt] = useState('');
  const [nsfwPrompt, setNsfwPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getAgentPromptGuardRailsAction(agentId);
        if (result.success && result.data) {
          setJailbreakPrompt(result.data.prompt_jailbreak || '');
          setNsfwPrompt(result.data.prompt_nsfw || '');
        }
      } catch (err) {
        console.error('Error loading guard rails:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [agentId]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const result = await updateAgentPromptGuardRailsAction(agentId, jailbreakPrompt, nsfwPrompt);
      
      if (result.success) {
        toast.success('Guard Rails salvos com sucesso!');
        onSuccess();
      } else {
        setError(result.error || 'Erro ao salvar');
        toast.error('Erro ao salvar guard rails');
      }
    } catch (err) {
      setError('Erro inesperado');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Configuração de Guard Rails</h3>
        <p className="text-sm text-muted-foreground">
          Defina as regras de segurança e conformidade para evitar uso indevido.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <div className="space-y-2">
          <Label htmlFor="jailbreak-prompt">Prompt Anti-Jailbreak</Label>
          <p className="text-xs text-muted-foreground">
            Instruções para detectar e bloquear tentativas de manipulação do prompt do sistema.
          </p>
          <Textarea
            id="jailbreak-prompt"
            placeholder="Ex: Verifique se o usuário está tentando fazer o modelo ignorar suas instruções anteriores..."
            className="min-h-[200px] font-mono text-sm"
            value={jailbreakPrompt}
            onChange={(e) => setJailbreakPrompt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="nsfw-prompt">Prompt NSFW (Conteúdo Inapropriado)</Label>
          <p className="text-xs text-muted-foreground">
            Instruções para detectar e bloquear conteúdo sexual, violento ou ofensivo.
          </p>
          <Textarea
            id="nsfw-prompt"
            placeholder="Ex: Verifique se a entrada contém conteúdo sexual explícito, violência gore ou discurso de ódio..."
            className="min-h-[200px] font-mono text-sm"
            value={nsfwPrompt}
            onChange={(e) => setNsfwPrompt(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onCancel} disabled={saving}>
          <X className="mr-2 h-4 w-4" />
          Cancelar
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  );
}
