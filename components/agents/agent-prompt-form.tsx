// Componente: Formulário Principal de Edição de Agent Prompt
// Feature: Meus Agentes IA

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Loader2, RotateCcw } from 'lucide-react';
import type { AgentWithPrompt } from '@/types/agents';
import { agentPromptSchema, type AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import { updateAgentPromptAction, resetAgentPromptToDefaultAction } from '@/app/actions/agents';
import { BasicInfoSection } from './form-sections/basic-info-section';
import { PersonalitySection } from './form-sections/personality-section';
import { LimitationsSection } from './form-sections/limitations-section';
import { InstructionsSection } from './form-sections/instructions-section';
import { GuidelineSection } from './form-sections/guideline-section';
import { RulesSection } from './form-sections/rules-section';
import { OthersInstructionsSection } from './form-sections/others-instructions-section';

interface AgentPromptFormProps {
  agent: AgentWithPrompt;
  onSuccess?: () => void;
}

export function AgentPromptForm({ agent, onSuccess }: AgentPromptFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  const form = useForm<AgentPromptFormData>({
    resolver: zodResolver(agentPromptSchema),
    defaultValues: {
      // Campos JSONB
      limitations: agent.prompt.limitations || null,
      instructions: agent.prompt.instructions || null,
      guide_line: agent.prompt.guide_line || null,
      rules: agent.prompt.rules || null,
      others_instructions: agent.prompt.others_instructions || null,
      // Campos de personalidade
      name: agent.prompt.name || null,
      age: agent.prompt.age || null,
      gender: agent.prompt.gender || null,
      objective: agent.prompt.objective || null,
      comunication: agent.prompt.comunication || null,
      personality: agent.prompt.personality || null,
    },
  });
  
  async function onSubmit(data: AgentPromptFormData) {
    setIsSubmitting(true);

    try {
      const result = await updateAgentPromptAction(agent.id, data);

      if (result.success) {
        toast.success('Configuração atualizada com sucesso!');
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erro ao atualizar configuração');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Erro inesperado ao atualizar');
    } finally {
      setIsSubmitting(false);
    }
  }
  
  async function handleReset() {
    if (!confirm('Deseja resetar para a configuração padrão? Todas as personalizações serão perdidas.')) {
      return;
    }
    
    setIsResetting(true);
    
    try {
      const result = await resetAgentPromptToDefaultAction(agent.id);
      
      if (result.success) {
        toast.success('Configuração resetada com sucesso!');
        
        // Atualizar form com valores padrão
        if (result.data) {
          form.reset({
            // JSONB fields
            limitations: result.data.limitations || null,
            instructions: result.data.instructions || null,
            guide_line: result.data.guide_line || null,
            rules: result.data.rules || null,
            others_instructions: result.data.others_instructions || null,
            // Personality fields
            name: result.data.name || null,
            age: result.data.age || null,
            gender: result.data.gender || null,
            objective: result.data.objective || null,
            comunication: result.data.comunication || null,
            personality: result.data.personality || null,
          });
        }
        
        onSuccess?.();
      } else {
        toast.error(result.error || 'Erro ao resetar configuração');
      }
    } catch (error) {
      console.error('Error resetting prompt:', error);
      toast.error('Erro inesperado ao resetar');
    } finally {
      setIsResetting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informações Básicas (Read-only) */}
        <BasicInfoSection agent={agent} />

        <Separator />

        {/* Personalidade */}
        <PersonalitySection form={form} />

        <Separator />

        {/* Limitações */}
        <LimitationsSection form={form} />

        <Separator />

        {/* Instruções */}
        <InstructionsSection form={form} />

        <Separator />

        {/* Guideline/Roteiro */}
        <GuidelineSection form={form} />

        <Separator />

        {/* Regras */}
        <RulesSection form={form} />

        <Separator />

        {/* Outras Instruções */}
        <OthersInstructionsSection form={form} />

        {/* Ações */}
        <div className="flex items-center justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isSubmitting || isResetting}
          >
            {isResetting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resetando...
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Resetar para Padrão
              </>
            )}
          </Button>
          
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || isResetting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
