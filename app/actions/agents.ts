'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
      // JSONB fields
      limitations: validated.limitations || null,
      instructions: validated.instructions || null,
      guide_line: validated.guide_line || null,
      rules: validated.rules || null,
      others_instructions: validated.others_instructions || null,
      // Personality fields
      name: validated.name || null,
      age: validated.age || null,
      gender: validated.gender || null,
      objective: validated.objective || null,
      comunication: validated.comunication || null,
      personality: validated.personality || null,
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
        // JSONB fields
        limitations: baseAny.limitations,
        instructions: baseAny.instructions,
        guide_line: baseAny.guide_line,
        rules: baseAny.rules,
        others_instructions: baseAny.others_instructions,
        // Personality fields
        name: baseAny.name,
        age: baseAny.age,
        gender: baseAny.gender,
        objective: baseAny.objective,
        comunication: baseAny.comunication,
        personality: baseAny.personality,
        updated_at: new Date().toISOString(),
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


/**
 * Server Action: Busca o prompt de INTENÇÃO
 */
export async function getAgentPromptIntentionAction(agentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // 1. Tentar buscar prompt específico do tenant (bypassing RLS with Admin)
    const adminSupabase = createAdminClient();
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data, error } = await (adminSupabase as any)
      .from('agent_prompts_intention')
      .select('prompt')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching tenant intention prompt:', error);
    }

    // 2. Se não encontrar, buscar prompt padrão (id_tenant is null) usando ADMIN CLIENT
    if (!data) {
        const adminSupabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalResult = await (adminSupabase as any)
            .from('agent_prompts_intention')
            .select('prompt')
            .eq('id_agent', agentId)
            .is('id_tenant', null)
            .maybeSingle();
            
        if (globalResult.data) {
            data = globalResult.data;
        }
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Server Action: Busca o prompt de OBSERVADOR
 */
export async function getAgentPromptObserverAction(agentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // 1. Tentar buscar prompt específico do tenant (bypassing RLS with Admin)
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data, error } = await (adminSupabase as any)
      .from('agent_prompts_observer')
      .select('prompt')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    // 2. Se não encontrar, buscar prompt padrão (id_tenant is null) usando ADMIN CLIENT
    if (!data) {
        const adminSupabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalResult = await (adminSupabase as any)
            .from('agent_prompts_observer')
            .select('prompt')
            .eq('id_agent', agentId)
            .is('id_tenant', null)
            .maybeSingle();
            
        if (globalResult.data) {
            data = globalResult.data;
        }
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Server Action: Busca o prompt de GUARD RAILS
 */
export async function getAgentPromptGuardRailsAction(agentId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase.from('users').select('tenant_id').eq('id', user.id).single();
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // 1. Tentar buscar prompt específico do tenant (bypassing RLS with Admin)
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let { data, error } = await (adminSupabase as any)
      .from('agent_prompts_guard_rails')
      .select('prompt_jailbreak, prompt_nsfw')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    // 2. Se não encontrar, buscar prompt padrão (id_tenant is null) usando ADMIN CLIENT
    if (!data) {
        const adminSupabase = createAdminClient();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const globalResult = await (adminSupabase as any)
            .from('agent_prompts_guard_rails')
            .select('prompt_jailbreak, prompt_nsfw')
            .eq('id_agent', agentId)
            .is('id_tenant', null)
            .maybeSingle();
            
        if (globalResult.data) {
            data = globalResult.data;
        }
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Atualiza o prompt de INTENÇÃO de um agent
 */
export async function updateAgentPromptIntentionAction(
  agentId: string,
  prompt: string
) {
  try {
    const supabase = await createClient();
    
    // 1. Validar autenticação e tenant
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // 2. Verificar se já existe prompt para este tenant via Admin (Bypass RLS)
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPrompt } = await (adminSupabase as any)
      .from('agent_prompts_intention')
      .select('id')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    let data;
    let error;

    if (existingPrompt) {
        // Update
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_intention')
            .update({ prompt: prompt })
            .eq('id', existingPrompt.id)
            .select()
            .single();
        data = result.data;
        error = result.error;
    } else {
        // Insert
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_intention')
            .insert({
                id_agent: agentId,
                id_tenant: userData.tenant_id,
                prompt: prompt
            })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
      console.error('Error saving intention prompt:', error);
      return { success: false, error: 'Erro ao salvar prompt de intenção' };
    }

    revalidatePath('/meus-agentes');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateAgentPromptIntentionAction:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Atualiza o prompt de OBSERVADOR de um agent
 */
export async function updateAgentPromptObserverAction(
  agentId: string,
  prompt: string
) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // Verificar se existe via Admin (Bypass RLS)
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPrompt } = await (adminSupabase as any)
      .from('agent_prompts_observer')
      .select('id')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    let data;
    let error;

    if (existingPrompt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_observer')
            .update({ prompt: prompt })
            .eq('id', existingPrompt.id)
            .select()
            .single();
        data = result.data;
        error = result.error;
    } else {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_observer')
            .insert({
                id_agent: agentId,
                id_tenant: userData.tenant_id,
                prompt: prompt
            })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
      console.error('Error saving observer prompt:', error);
      return { success: false, error: 'Erro ao salvar prompt de observador' };
    }

    revalidatePath('/meus-agentes');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateAgentPromptObserverAction:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}

/**
 * Atualiza o prompt de GUARD RAILS de um agent
 */
export async function updateAgentPromptGuardRailsAction(
  agentId: string,
  promptJailbreak: string,
  promptNsfw: string
) {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Não autenticado' };
    
    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id')
      .eq('id', user.id)
      .single();
    
    if (!userData?.tenant_id) return { success: false, error: 'Tenant não encontrado' };

    // Verificar se existe via Admin (Bypass RLS)
    const adminSupabase = createAdminClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingPrompt } = await (adminSupabase as any)
      .from('agent_prompts_guard_rails')
      .select('id')
      .eq('id_agent', agentId)
      .eq('id_tenant', userData.tenant_id)
      .maybeSingle();

    let data;
    let error;

    if (existingPrompt) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_guard_rails')
            .update({
                prompt_jailbreak: promptJailbreak,
                prompt_nsfw: promptNsfw,
            })
            .eq('id', existingPrompt.id)
            .select()
            .single();
        data = result.data;
        error = result.error;
    } else {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await (adminSupabase as any)
            .from('agent_prompts_guard_rails')
            .insert({
                id_agent: agentId,
                id_tenant: userData.tenant_id,
                prompt_jailbreak: promptJailbreak,
                prompt_nsfw: promptNsfw,
            })
            .select()
            .single();
        data = result.data;
        error = result.error;
    }

    if (error) {
      console.error('Error saving guard rails prompt:', error);
      return { success: false, error: 'Erro ao salvar prompt de guard rails' };
    }

    revalidatePath('/meus-agentes');
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateAgentPromptGuardRailsAction:', error);
    return { success: false, error: 'Erro inesperado' };
  }
}
