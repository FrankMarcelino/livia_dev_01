// Seção: Limitações
// Feature: Meus Agentes IA

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';

interface LimitationsSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function LimitationsSection({ form }: LimitationsSectionProps) {
  const limitations = form.watch('limitations') || [];
  
  function addLimitation() {
    form.setValue('limitations', [...limitations, '']);
  }
  
  function removeLimitation(index: number) {
    const updated = limitations.filter((_, i) => i !== index);
    form.setValue('limitations', updated);
  }
  
  function updateLimitation(index: number, value: string) {
    const updated = [...limitations];
    updated[index] = value;
    form.setValue('limitations', updated);
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Limitações</h3>
        <p className="text-sm text-muted-foreground">
          Defina o que o agent NÃO deve fazer
        </p>
      </div>
      
      <div className="space-y-3">
        {limitations.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma limitação configurada
          </p>
        )}
        
        {limitations.map((limitation, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Limitação ${index + 1}`}
              value={limitation}
              onChange={(e) => updateLimitation(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeLimitation(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addLimitation}
          disabled={limitations.length >= 50}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Limitação
        </Button>
        
        {limitations.length >= 50 && (
          <p className="text-xs text-destructive">
            Máximo de 50 limitações atingido
          </p>
        )}
      </div>
    </div>
  );
}
