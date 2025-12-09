// Seção: Outras Instruções
// Feature: Meus Agentes IA

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import type { GuidelineStep } from '@/types/agents';

interface OthersInstructionsSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function OthersInstructionsSection({ form }: OthersInstructionsSectionProps) {
  const othersInstructions = form.watch('others_instructions') || [];
  const [expandedSteps, setExpandedSteps] = useState<number[]>([]);

  function toggleStep(index: number) {
    setExpandedSteps(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }

  function addStep() {
    const newStep: GuidelineStep = {
      title: '',
      type: 'markdown',
      active: true,
      sub: [],
    };
    form.setValue('others_instructions', [...othersInstructions, newStep]);
    setExpandedSteps(prev => [...prev, othersInstructions.length]);
  }

  function removeStep(index: number) {
    const updated = othersInstructions.filter((_, i) => i !== index);
    form.setValue('others_instructions', updated);
    setExpandedSteps(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  }

  function updateStep(index: number, field: keyof GuidelineStep, value: unknown) {
    const updated = [...othersInstructions];
    (updated[index] as Record<string, unknown>)[field] = value;
    form.setValue('others_instructions', updated);
  }

  function addSubInstruction(stepIndex: number) {
    const updated = [...othersInstructions];
    if (!updated[stepIndex]) return;
    updated[stepIndex].sub.push({
      content: '',
      active: true,
    });
    form.setValue('others_instructions', updated);
  }

  function removeSubInstruction(stepIndex: number, subIndex: number) {
    const updated = [...othersInstructions];
    if (!updated[stepIndex]) return;
    updated[stepIndex].sub = updated[stepIndex].sub.filter((_, i) => i !== subIndex);
    form.setValue('others_instructions', updated);
  }

  function updateSubInstruction(stepIndex: number, subIndex: number, field: 'content' | 'active', value: string | boolean) {
    const updated = [...othersInstructions];
    if (!updated[stepIndex] || !updated[stepIndex].sub[subIndex]) return;
    updated[stepIndex].sub[subIndex][field] = value as never;
    form.setValue('others_instructions', updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Outras Instruções</h3>
        <p className="text-sm text-muted-foreground">
          Instruções adicionais e complementares (estrutura hierárquica)
        </p>
      </div>

      <div className="space-y-4">
        {othersInstructions.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma instrução adicional configurada
          </p>
        )}

        {othersInstructions.map((step, stepIndex) => {
          const isExpanded = expandedSteps.includes(stepIndex);

          return (
            <Card key={stepIndex} className="p-4">
              {/* Header da Etapa */}
              <div className="flex items-start gap-2 mb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 h-8 w-8 p-0"
                  onClick={() => toggleStep(stepIndex)}
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={`Instrução ${stepIndex + 1}`}
                      value={step.title}
                      onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                      className="flex-1"
                    />
                    <Select
                      value={step.type}
                      onValueChange={(value) => updateStep(stepIndex, 'type', value)}
                    >
                      <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rank">Numerado (1, 2, 3...)</SelectItem>
                        <SelectItem value="markdown">Markdown (formatado)</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`step-active-${stepIndex}`} className="text-xs">
                        Ativa
                      </Label>
                      <Switch
                        id={`step-active-${stepIndex}`}
                        checked={step.active}
                        onCheckedChange={(checked) => updateStep(stepIndex, 'active', checked)}
                      />
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStep(stepIndex)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Conteúdo Expandido */}
              {isExpanded && (
                <div className="ml-10 mt-4 space-y-3">
                  <Label className="text-sm font-medium">Detalhes/Sub-instruções</Label>
                  
                  {step.sub.length === 0 && (
                    <p className="text-xs text-muted-foreground italic">
                      Nenhum detalhe configurado
                    </p>
                  )}
                  
                  {step.sub.map((sub, subIndex) => (
                    <div key={subIndex} className="flex items-start gap-2">
                      <Textarea
                        placeholder={`Detalhe ${subIndex + 1}`}
                        value={sub.content}
                        onChange={(e) => updateSubInstruction(stepIndex, subIndex, 'content', e.target.value)}
                        className="flex-1 resize-none"
                        rows={2}
                      />
                      
                      <div className="flex items-center gap-2 shrink-0">
                        <Switch
                          checked={sub.active}
                          onCheckedChange={(checked) => updateSubInstruction(stepIndex, subIndex, 'active', checked)}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSubInstruction(stepIndex, subIndex)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addSubInstruction(stepIndex)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Detalhe
                  </Button>
                </div>
              )}
            </Card>
          );
        })}

        <Button
          type="button"
          variant="outline"
          onClick={addStep}
        >
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Instrução Adicional
        </Button>
      </div>
    </div>
  );
}
