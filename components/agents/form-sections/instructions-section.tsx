// Seção: Instruções
// Feature: Meus Agentes IA

'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';

interface InstructionsSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function InstructionsSection({ form }: InstructionsSectionProps) {
  const instructions = form.watch('instructions') || [];
  
  function addInstruction() {
    form.setValue('instructions', [...instructions, '']);
  }
  
  function removeInstruction(index: number) {
    const updated = instructions.filter((_, i) => i !== index);
    form.setValue('instructions', updated);
  }
  
  function updateInstruction(index: number, value: string) {
    const updated = [...instructions];
    updated[index] = value;
    form.setValue('instructions', updated);
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Instruções</h3>
        <p className="text-sm text-muted-foreground">
          Diretrizes gerais de comportamento do agent
        </p>
      </div>
      
      <div className="space-y-3">
        {instructions.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma instrução configurada
          </p>
        )}
        
        {instructions.map((instruction, index) => (
          <div key={index} className="flex gap-2">
            <Input
              placeholder={`Instrução ${index + 1}`}
              value={instruction}
              onChange={(e) => updateInstruction(index, e.target.value)}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeInstruction(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addInstruction}
          disabled={instructions.length >= 50}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Instrução
        </Button>
        
        {instructions.length >= 50 && (
          <p className="text-xs text-destructive">
            Máximo de 50 instruções atingido
          </p>
        )}
      </div>
    </div>
  );
}
