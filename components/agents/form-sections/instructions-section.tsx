// Seção: Instruções
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
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import type { GuidelineStep } from '@/types/agents';

interface InstructionsSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function InstructionsSection({ form }: InstructionsSectionProps) {
  const instructions = form.watch('instructions') || [];
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
    form.setValue('instructions', [...instructions, newStep]);
    setExpandedSteps(prev => [...prev, instructions.length]);
  }

  function removeStep(index: number) {
    const updated = instructions.filter((_, i) => i !== index);
    form.setValue('instructions', updated);
    setExpandedSteps(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  }

  function updateStep(index: number, field: keyof GuidelineStep, value: unknown) {
    const updated = [...instructions];
    (updated[index] as Record<string, unknown>)[field] = value;
    form.setValue('instructions', updated);
  }

  function addSubInstruction(stepIndex: number) {
    const updated = [...instructions];
    if (!updated[stepIndex]) return;
    updated[stepIndex].sub.push({
      content: '',
      active: true,
    });
    form.setValue('instructions', updated);
  }

  function removeSubInstruction(stepIndex: number, subIndex: number) {
    const updated = [...instructions];
    if (!updated[stepIndex]) return;
    updated[stepIndex].sub = updated[stepIndex].sub.filter((_, i) => i !== subIndex);
    form.setValue('instructions', updated);
  }

  function updateSubInstruction(stepIndex: number, subIndex: number, field: 'content' | 'active', value: string | boolean) {
    const updated = [...instructions];
    if (!updated[stepIndex] || !updated[stepIndex].sub[subIndex]) return;
    updated[stepIndex].sub[subIndex][field] = value as never;
    form.setValue('instructions', updated);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Instruções</h3>
        <p className="text-sm text-muted-foreground">
          Defina o que o agent DEVE fazer (estrutura hierárquica)
        </p>
      </div>

      <div className="space-y-4">
        {instructions.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Nenhuma instrução configurada
          </p>
        )}

        {instructions.map((step, stepIndex) => {
          const isExpanded = expandedSteps.includes(stepIndex);

          return (
            <Card key={stepIndex} className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleStep(stepIndex)}
                  className="p-1 h-auto"
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </Button>

                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Título da instrução"
                    value={step.title}
                    onChange={(e) => updateStep(stepIndex, 'title', e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(stepIndex)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {isExpanded && (
                <div className="ml-8 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={step.active}
                        onCheckedChange={(checked) => updateStep(stepIndex, 'active', checked)}
                      />
                      <Label>Ativo</Label>
                    </div>

                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <Select
                        value={step.type}
                        onValueChange={(value) => updateStep(stepIndex, 'type', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="rank">Numerado</SelectItem>
                          <SelectItem value="markdown">Markdown</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Detalhes</Label>

                    {step.sub.map((sub, subIndex) => (
                      <div key={subIndex} className="flex items-start gap-2">
                        <Switch
                          checked={sub.active}
                          onCheckedChange={(checked) => updateSubInstruction(stepIndex, subIndex, 'active', checked)}
                        />
                        <Textarea
                          placeholder="Conteúdo"
                          value={sub.content}
                          onChange={(e) => updateSubInstruction(stepIndex, subIndex, 'content', e.target.value)}
                          rows={2}
                          className="flex-1"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubInstruction(stepIndex, subIndex)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
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
          Adicionar Instrução
        </Button>
      </div>
    </div>
  );
}
