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
// TODOS os campos que EXISTEM na tabela agent_prompts
export const agentPromptSchema = z.object({
  // Campos de Personalidade (TEXT/ENUM) - todos opcionais
  name: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
  age: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'neutral']).optional().nullable(),
  objective: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  comunication: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  personality: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),

  // Campos JSONB - TODOS usam a estrutura GuidelineStep[]
  limitations: z
    .array(guidelineStepSchema)
    .optional()
    .nullable(),

  instructions: z
    .array(guidelineStepSchema)
    .optional()
    .nullable(),

  guide_line: z
    .array(guidelineStepSchema)
    .optional()
    .nullable(),

  rules: z
    .array(guidelineStepSchema)
    .optional()
    .nullable(),

  others_instructions: z
    .array(guidelineStepSchema)
    .optional()
    .nullable(),
});

// Type inference
export type AgentPromptFormData = z.infer<typeof agentPromptSchema>;
export type GuidelineStep = z.infer<typeof guidelineStepSchema>;
export type GuidelineSubInstruction = z.infer<typeof guidelineSubInstructionSchema>;
