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
import { LimitationsSection } from './form-sections/limitations-section';
import { InstructionsSection } from './form-sections/instructions-section';
import { GuidelineSection } from './form-sections/guideline-section';

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
      limitations: agent.prompt.limitations || [],
      instructions: agent.prompt.instructions || [],
      guide_line: agent.prompt.guide_line || [],
      rules: agent.prompt.rules || [],
      // Campos de personalidade comentados até existirem no banco
      // persona_name: agent.prompt.persona_name || '',
      // age: agent.prompt.age || '',
      // gender: agent.prompt.gender || '',
      // objective: agent.prompt.objective || '',
      // communication: agent.prompt.communication || '',
      // personality: agent.prompt.personality || '',
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
            limitations: result.data.limitations || [],
            instructions: result.data.instructions || [],
            guide_line: result.data.guide_line || [],
            rules: result.data.rules || [],
            // Campos de personalidade comentados
            // persona_name: result.data.persona_name || '',
            // age: result.data.age || '',
            // gender: result.data.gender || '',
            // objective: result.data.objective || '',
            // communication: result.data.communication || '',
            // personality: result.data.personality || '',
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

        {/* Personalidade - Desabilitado temporariamente (campos não existem no banco ainda) */}
        {/* <PersonalitySection form={form} /> */}
        {/* <Separator /> */}
        
        {/* Limitações */}
        <LimitationsSection form={form} />
        
        <Separator />
        
        {/* Instruções */}
        <InstructionsSection form={form} />
        
        <Separator />
        
        {/* Guideline/Roteiro */}
        <GuidelineSection form={form} />
        
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
