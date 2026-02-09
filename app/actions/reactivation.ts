'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { reactivationFormSchema } from '@/lib/validations/reactivationValidation';

/**
 * Salva a configuracao completa de reativacao (settings + steps + tags)
 *
 * Estrategia: Upsert settings + Delete-all steps + Re-insert
 * (evita diffing complexo, seguro pois dados sao por tenant)
 */
export async function saveReactivationConfig(formData: unknown) {
  try {
    const supabase = await createClient();

    // 1. Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Nao autenticado' };
    }

    // 2. Buscar tenant_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.tenant_id) {
      return { success: false, error: 'Tenant nao encontrado' };
    }

    const tenantId = userData.tenant_id;

    // 3. Validar com Zod
    const validationResult = reactivationFormSchema.safeParse(formData);
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Dados invalidos',
        details: validationResult.error.format(),
      };
    }

    const { settings, steps } = validationResult.data;

    // 4. Upsert settings
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: settingsError } = await (supabase as any)
      .from('tenant_reactivation_settings')
      .upsert(
        {
          tenant_id: tenantId,
          exhausted_action: settings.exhausted_action,
          exhausted_message: settings.exhausted_message || null,
          max_reactivation_window_minutes: settings.max_reactivation_window_minutes,
          max_window_action: settings.max_window_action,
          max_window_message: settings.max_window_message || null,
        },
        { onConflict: 'tenant_id' }
      );

    if (settingsError) {
      console.error('Error upserting reactivation settings:', settingsError);
      return { success: false, error: 'Erro ao salvar configuracoes' };
    }

    // 5. Delete todos os steps existentes (cascade deleta tags)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: deleteError } = await (supabase as any)
      .from('tenant_reactivation_rules_steps')
      .delete()
      .eq('tenant_id', tenantId);

    if (deleteError) {
      console.error('Error deleting existing steps:', deleteError);
      return { success: false, error: 'Erro ao limpar etapas anteriores' };
    }

    // 6. Insert novos steps
    for (const [i, step] of steps.entries()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: insertedStep, error: stepError } = await (supabase as any)
        .from('tenant_reactivation_rules_steps')
        .insert({
          tenant_id: tenantId,
          sequence: i + 1,
          wait_time_minutes: step.wait_time_minutes,
          action_type: step.action_type,
          action_parameter: step.action_type === 'send_message' ? step.action_parameter : null,
          start_time: step.start_time?.trim() || null,
          end_time: step.end_time?.trim() || null,
        })
        .select('id')
        .single();

      if (stepError || !insertedStep) {
        console.error(`Error inserting step ${i + 1}:`, stepError);
        return { success: false, error: `Erro ao salvar etapa ${i + 1}` };
      }

      // 7. Insert associacoes step-tag
      if (step.tag_ids && step.tag_ids.length > 0) {
        const tagRows = step.tag_ids.map((tagId: string) => ({
          step_id: insertedStep.id,
          tag_id: tagId,
        }));

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: tagError } = await (supabase as any)
          .from('tenant_reactivation_rules_steps_tags')
          .insert(tagRows);

        if (tagError) {
          console.error(`Error inserting tags for step ${i + 1}:`, tagError);
          return { success: false, error: `Erro ao salvar tags da etapa ${i + 1}` };
        }
      }
    }

    // 8. Revalidar cache
    revalidatePath('/reativacao');

    return { success: true };
  } catch (error) {
    console.error('Unexpected error saving reactivation config:', error);
    return { success: false, error: 'Erro inesperado ao salvar configuracao' };
  }
}
