// Component: Agent Edit Tabs
// Feature: Meus Agentes IA - Master-Detail

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RotateCcw } from 'lucide-react';
import type { AgentWithPrompt } from '@/types/agents';
import { agentPromptSchema, type AgentPromptFormData } from '@/lib/validations/agentPromptValidation';
import { updateAgentPromptAction, resetAgentPromptToDefaultAction } from '@/app/actions/agents';
import { PersonalitySection } from './form-sections/personality-section';
import { LimitationsSectionV2 as LimitationsSection } from './form-sections/limitations-section-v2';
import { InstructionsSectionV2 as InstructionsSection } from './form-sections/instructions-section-v2';
import { GuidelineSectionV2 as GuidelineSection } from './form-sections/guideline-section-v2';
import { RulesSectionV2 as RulesSection } from './form-sections/rules-section-v2';
import { OthersInstructionsSectionV2 as OthersInstructionsSection } from './form-sections/others-instructions-section-v2';

interface AgentEditTabsProps {
  agent: AgentWithPrompt;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function AgentEditTabs({ agent, onSuccess, onCancel }: AgentEditTabsProps) {
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

        // ✅ Reset do form para marcar como pristine (não modificado)
        // Mantém os valores atuais mas remove o estado "dirty"
        form.reset(data);

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

  function onInvalid(errors: Partial<Record<keyof AgentPromptFormData, unknown>>) {
    console.error('Form validation errors:', errors);
    toast.error('Existem erros no formulário. Verifique os campos em vermelho nas abas.', {
      duration: 5000,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="flex flex-col">
        <Tabs defaultValue="personality" className="w-full">
          <TabsList className="w-full justify-start border-b rounded-none h-auto flex-wrap">
            <TabsTrigger value="personality">Personalidade</TabsTrigger>
            <TabsTrigger value="limitations">Limitações</TabsTrigger>
            <TabsTrigger value="instructions">Instruções</TabsTrigger>
            <TabsTrigger value="guideline">Guideline</TabsTrigger>
            <TabsTrigger value="rules">Regras</TabsTrigger>
            <TabsTrigger value="others">Outras Instruções</TabsTrigger>
          </TabsList>

          <div>
            <TabsContent value="personality" className="p-6 mt-0">
              <PersonalitySection form={form} />
            </TabsContent>

            <TabsContent value="limitations" className="p-6 mt-0">
              <LimitationsSection form={form} />
            </TabsContent>

            <TabsContent value="instructions" className="p-6 mt-0">
              <InstructionsSection form={form} />
            </TabsContent>

            <TabsContent value="guideline" className="p-6 mt-0">
              <GuidelineSection form={form} />
            </TabsContent>

            <TabsContent value="rules" className="p-6 mt-0">
              <RulesSection form={form} />
            </TabsContent>

            <TabsContent value="others" className="p-6 mt-0">
              <OthersInstructionsSection form={form} />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer com ações */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting || isResetting}
              size="sm"
            >
              {isResetting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Resetando...
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isResetting}
            >
              Cancelar
            </Button>

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
