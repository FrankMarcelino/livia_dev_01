'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { reactivationFormSchema, type ReactivationFormDataValidated } from '@/lib/validations/reactivationValidation';
import { saveReactivationConfig } from '@/app/actions/reactivation';
import { SettingsCard } from './settings-card';
import { StepsList } from './steps-list';
import { TimelinePreview } from './timeline-preview';
import type { ReactivationPageData } from '@/types/reactivation';

interface ReactivationPageProps {
  initialData: ReactivationPageData;
}

export function ReactivationPage({ initialData }: ReactivationPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Converter steps do DB para form data
  const initialSteps = initialData.steps.map((step) => ({
    wait_time_minutes: step.wait_time_minutes,
    // Se action_type e send_audio (escondido), converter para send_message
    action_type: step.action_type === 'send_audio' ? 'send_message' as const : step.action_type as Exclude<typeof step.action_type, 'send_audio'>,
    action_parameter: step.action_parameter || '',
    start_time: step.start_time || '',
    end_time: step.end_time || '',
    tag_ids: step.tags.map((t) => t.id),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<ReactivationFormDataValidated>({
    resolver: zodResolver(reactivationFormSchema) as any,
    defaultValues: {
      settings: {
        exhausted_action: initialData.settings?.exhausted_action || 'end_conversation',
        exhausted_message: initialData.settings?.exhausted_message || '',
        max_reactivation_window_minutes: initialData.settings?.max_reactivation_window_minutes ?? null,
        max_window_action: initialData.settings?.max_window_action || 'end_conversation',
        max_window_message: initialData.settings?.max_window_message || '',
      },
      steps: initialSteps.length > 0 ? initialSteps : [],
    },
  });

  const fieldArray = useFieldArray({
    control: form.control,
    name: 'steps',
  });

  // Watch para timeline reativa
  const watchedSteps = form.watch('steps');
  const watchedSettings = form.watch('settings');

  async function onSubmit(data: ReactivationFormDataValidated) {
    setIsSubmitting(true);
    try {
      const result = await saveReactivationConfig(data);
      if (result.success) {
        toast.success('Configuracao salva com sucesso!');
      } else {
        toast.error(result.error || 'Erro ao salvar configuracao');
      }
    } catch (error) {
      console.error('Error saving reactivation config:', error);
      toast.error('Erro inesperado ao salvar');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Reativacao de Conversas</h1>
        <p className="text-muted-foreground mt-1">
          Configure as regras de reativacao automatica quando o contato nao responde.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Coluna esquerda: Configuracoes */}
            <div className="lg:col-span-3 space-y-6">
              <SettingsCard form={form} />

              <StepsList
                form={form}
                fieldArray={fieldArray}
                availableTags={initialData.availableTags}
              />

              {/* Botao Salvar */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting} size="lg">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Salvar Configuracao
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Coluna direita: Timeline Preview */}
            <div className="lg:col-span-2">
              <TimelinePreview
                steps={watchedSteps || []}
                settings={watchedSettings}
                availableTags={initialData.availableTags}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
