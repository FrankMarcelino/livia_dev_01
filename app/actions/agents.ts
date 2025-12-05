// Server Actions para Agent Templates
// Feature: Meus Agentes IA (Plataforma Tenant)

'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { agentPromptSchema } from '@/lib/validations/agentPromptValidation';
import { getBaseAgentPrompt } from '@/lib/queries/agents';

/**
 * Atualiza o prompt personalizado de um agent para o tenant
 */
export async function updateAgentPromptAction(
  agentId: string,
  updates: unknown
) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Não autenticado',
      };
    }
    
    // 2. Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData?.tenant_id) {
      return {
        success: false,
        error: 'Tenant não encontrado',
      };
    }
    
    // 3. Validar schema com Zod
    const validationResult = agentPromptSchema.safeParse(updates);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: 'Dados inválidos',
        details: validationResult.error.format(),
      };
    }
    
    const validated = validationResult.data;
    
    // 4. Verificar se já existe um prompt para este agent e tenant
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPrompt } = await (supabase as any)
      .from('agent_prompts')
      .select('id')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    const promptData = {
      limitations: validated.limitations || null,
      instructions: validated.instructions || null,
      guide_line: validated.guide_line || null,
      rules: validated.rules || null,
      updated_at: new Date().toISOString(),
    };

    let data;
    let error;

    if (existingPrompt) {
      // Atualizar prompt existente
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('agent_prompts')
        .update(promptData)
        .eq('id_agent', agentId)
        .eq('id_tenant', userData.tenant_id)
        .select()
        .single();

      data = result.data;
      error = result.error;
    } else {
      // Criar novo prompt para o tenant
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (supabase as any)
        .from('agent_prompts')
        .insert({
          id_agent: agentId,
          id_tenant: userData.tenant_id,
          ...promptData,
        })
        .select()
        .single();

      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Error saving agent prompt:', error);
      return {
        success: false,
        error: 'Erro ao salvar configuração',
      };
    }
    
    // 5. Revalidar cache
    revalidatePath('/meus-agentes');
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Unexpected error in updateAgentPromptAction:', error);
    return {
      success: false,
      error: 'Erro inesperado ao atualizar',
    };
  }
}

/**
 * Reseta o prompt do tenant para a configuração padrão do template
 */
export async function resetAgentPromptToDefaultAction(agentId: string) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Não autenticado',
      };
    }
    
    // 2. Buscar tenant_id do usuário
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    
    if (userError || !userData?.tenant_id) {
      return {
        success: false,
        error: 'Tenant não encontrado',
      };
    }
    
    // 3. Buscar configuração base (id_tenant = NULL)
    const basePrompt = await getBaseAgentPrompt(agentId);
    
    if (!basePrompt) {
      return {
        success: false,
        error: 'Configuração padrão não encontrada',
      };
    }
    
    // 4. Copiar configuração base para o tenant (apenas campos que existem)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseAny = basePrompt as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('agent_prompts')
      .update({
        limitations: baseAny.limitations,
        instructions: baseAny.instructions,
        guide_line: baseAny.guide_line,
        rules: baseAny.rules,
        updated_at: new Date().toISOString(),
        // Campos de personalidade removidos temporariamente
        // persona_name: baseAny.persona_name,
        // age: baseAny.age,
        // gender: baseAny.gender,
        // objective: baseAny.objective,
        // communication: baseAny.communication,
        // personality: baseAny.personality,
      })
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .select()
      .single();
    
    if (error) {
      console.error('Error resetting agent prompt:', error);
      return {
        success: false,
        error: 'Erro ao resetar configuração',
      };
    }
    
    // 5. Revalidar cache
    revalidatePath('/meus-agentes');
    
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Unexpected error in resetAgentPromptToDefaultAction:', error);
    return {
      success: false,
      error: 'Erro inesperado ao resetar',
    };
  }
}
