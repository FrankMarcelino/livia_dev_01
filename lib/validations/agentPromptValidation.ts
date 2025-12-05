// Zod validation schemas for Agent Prompts
// Feature: Meus Agentes IA (Plataforma Tenant)

import { z } from 'zod';

// Sub-instrução do guideline
export const guidelineSubInstructionSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(500, 'Máximo 500 caracteres'),
  active: z.boolean(),
});

// Etapa do guideline
export const guidelineStepSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'),
  type: z.enum(['rank', 'markdown'], {
    message: 'Tipo deve ser "rank" ou "markdown"',
  }),
  active: z.boolean(),
  sub: z.array(guidelineSubInstructionSchema),
});

// Schema completo do formulário de agent prompts
// Apenas campos que EXISTEM na tabela agent_prompts
export const agentPromptSchema = z.object({
  // Arrays de configuração JSONB
  limitations: z
    .array(z.string().min(1, 'Limitação não pode estar vazia'))
    .max(50, 'Máximo 50 limitações')
    .optional(),

  instructions: z
    .array(z.string().min(1, 'Instrução não pode estar vazia'))
    .max(50, 'Máximo 50 instruções')
    .optional(),

  guide_line: z
    .array(guidelineStepSchema)
    .optional(),

  rules: z
    .array(z.string().min(1, 'Regra não pode estar vazia'))
    .max(50, 'Máximo 50 regras')
    .optional(),
});

// Type inference
export type AgentPromptFormData = z.infer<typeof agentPromptSchema>;
export type GuidelineStep = z.infer<typeof guidelineStepSchema>;
export type GuidelineSubInstruction = z.infer<typeof guidelineSubInstructionSchema>;
