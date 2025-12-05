// Types for Agent Templates Feature
// Feature: Meus Agentes IA (Plataforma Tenant)

import type { Database } from './database';

// Agent type com campos relevantes para a UI
// NOTA: Apenas campos essenciais que EXISTEM na tabela real
export type Agent = {
  id: string;
  template_id: string | null;
  name: string;
  type: Database['public']['Enums']['agent_type_enum'];
  function?: Database['public']['Enums']['agent_function_enum']; // Opcional - campo não existe no banco
  created_at: string;
  updated_at: string;
};

// AgentPrompt - apenas campos JSONB que EXISTEM na tabela agent_prompts
export type AgentPrompt = {
  id: string;
  id_agent: string;
  id_tenant: string | null; // NULL = configuração base do template
  // Campos JSONB que existem na tabela
  limitations: string[] | null;
  instructions: string[] | null;
  guide_line: GuidelineStep[] | null;
  rules: string[] | null;
  created_at: string;
  updated_at: string;
};

// AgentTemplate - configurações base criadas pelo Super Admin
export type AgentTemplate = {
  id: string;
  name: string;
  type: string;
  reactive: boolean;
  limitations: string[] | null;
  instructions: string[] | null;
  guide_line: GuidelineStep[] | null;
  persona_name: string | null;
  age: string | null;
  gender: string | null;
  objective: string | null;
  communication: string | null;
  personality: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Guideline structure (JSONB)
export type GuidelineSubInstruction = {
  content: string;
  active: boolean;
};

export type GuidelineStep = {
  title: string;
  type: 'rank' | 'markdown'; // rank = numerado, markdown = formatado
  active: boolean;
  sub: GuidelineSubInstruction[];
};

// Extended types for UI
export type AgentWithPrompt = Agent & {
  template_name: string | null;
  prompt: AgentPrompt;
  is_customized: boolean;
};

export type AgentWithTemplate = Agent & {
  agent_templates: {
    name: string;
  } | null;
};

// Form data types - apenas campos que existem em agent_prompts
export type AgentPromptFormData = {
  limitations?: string[];
  instructions?: string[];
  guide_line?: GuidelineStep[];
  rules?: string[];
};

// Agent type labels for UI (baseado em agent_type_enum)
export const AGENT_TYPE_LABELS: Record<string, string> = {
  active: 'Proativo',    // database usa "active" não "proactive"
  reactive: 'Reativo',
};

// Agent function labels for UI (baseado em agent_function_enum)
export const AGENT_FUNCTION_LABELS: Record<string, string> = {
  support: 'Suporte',
  sales: 'Vendas',
  after_sales: 'Pós-vendas',
  research: 'Pesquisa',
};
