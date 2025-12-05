// Seção: Personalidade
// Feature: Meus Agentes IA

'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { UseFormReturn } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';

interface PersonalitySectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

export function PersonalitySection({ form }: PersonalitySectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Personalidade</h3>
        <p className="text-sm text-muted-foreground">
          Configure a personalidade e características do agent
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label htmlFor="name">Nome da Persona</Label>
          <Input
            id="name"
            placeholder="Ex: Maria Atendente"
            {...form.register('name')}
          />
          <p className="text-xs text-muted-foreground">
            Nome que o agent usa para se identificar
          </p>
        </div>

        {/* Idade */}
        <div className="space-y-2">
          <Label htmlFor="age">Idade</Label>
          <Input
            id="age"
            placeholder="Ex: 28 anos"
            {...form.register('age')}
          />
          <p className="text-xs text-muted-foreground">
            Idade aparente da persona
          </p>
        </div>

        {/* Gênero */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gênero</Label>
          <Select
            value={form.watch('gender') || ''}
            onValueChange={(value) => form.setValue('gender', value as any)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione o gênero" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Masculino</SelectItem>
              <SelectItem value="female">Feminino</SelectItem>
              <SelectItem value="neutral">Neutro</SelectItem>
              <SelectItem value="other">Outro</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Gênero da persona
          </p>
        </div>

        {/* Comunicação (typo no banco: comunication) */}
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="comunication">Estilo de Comunicação</Label>
          <Input
            id="comunication"
            placeholder="Ex: Amigável, formal, descontraído"
            {...form.register('comunication')}
          />
          <p className="text-xs text-muted-foreground">
            Como o agent se comunica
          </p>
        </div>
      </div>

      {/* Objetivo */}
      <div className="space-y-2">
        <Label htmlFor="objective">Objetivo</Label>
        <Textarea
          id="objective"
          placeholder="Descreva o objetivo principal deste agent..."
          rows={3}
          {...form.register('objective')}
        />
        <p className="text-xs text-muted-foreground">
          Qual é o propósito principal deste agent
        </p>
      </div>

      {/* Personalidade */}
      <div className="space-y-2">
        <Label htmlFor="personality">Traços de Personalidade</Label>
        <Textarea
          id="personality"
          placeholder="Descreva os traços de personalidade (ex: paciente, empático, direto)..."
          rows={3}
          {...form.register('personality')}
        />
        <p className="text-xs text-muted-foreground">
          Características de comportamento e atitude
        </p>
      </div>
    </div>
  );
}
