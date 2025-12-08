'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AlertCircle, Save, X, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { updateAgentPromptObserverAction, getAgentPromptObserverAction } from '@/app/actions/agents';
import { toast } from 'sonner';

interface ObserverAgentFormProps {
  agentId: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function ObserverAgentForm({ agentId, onCancel, onSuccess }: ObserverAgentFormProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const result = await getAgentPromptObserverAction(agentId);
        if (result.success && result.data) {
          setPrompt(result.data.prompt || '');
        }
      } catch (err) {
        console.error('Error loading observer:', err);
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
      const result = await updateAgentPromptObserverAction(agentId, prompt);
      
      if (result.success) {
        toast.success('Agente observador salvo com sucesso!');
        onSuccess();
      } else {
        setError(result.error || 'Erro ao salvar');
        toast.error('Erro ao salvar agente');
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
        <h3 className="text-lg font-medium">Configuração de Observador</h3>
        <p className="text-sm text-muted-foreground">
          Defina o que este agente deve observar nas conversas (ex: sentimento, keywords, qualidade).
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="observer-prompt">Prompt de Observação</Label>
        <Textarea
          id="observer-prompt"
          placeholder="Ex: Analise a conversa e identifique se o cliente está satisfeito ou irritado..."
          className="min-h-[300px] font-mono text-sm"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
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
