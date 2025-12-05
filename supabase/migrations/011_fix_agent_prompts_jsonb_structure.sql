-- Migration: Corrigir estrutura JSONB dos campos de agent_prompts
-- Data: 2025-12-05
--
-- PROBLEMA: Os campos limitations, instructions, rules, others_instructions
-- estão com estrutura complexa (GuidelineStep[]) quando deveriam ser string[]
--
-- Apenas guide_line deve ter estrutura GuidelineStep[]

-- 1. Alterar defaults para arrays vazios simples
ALTER TABLE agent_prompts
  ALTER COLUMN limitations SET DEFAULT '[]'::jsonb,
  ALTER COLUMN instructions SET DEFAULT '[]'::jsonb,
  ALTER COLUMN rules SET DEFAULT '[]'::jsonb,
  ALTER COLUMN others_instructions SET DEFAULT '[]'::jsonb;

-- 2. Manter guide_line com estrutura complexa (está correto)
ALTER TABLE agent_prompts
  ALTER COLUMN guide_line SET DEFAULT '[{"sub": [{"active": true, "content": ""}], "type": "markdown", "title": "", "active": true}]'::jsonb;

-- 3. Comentários para documentação
COMMENT ON COLUMN agent_prompts.limitations IS 'Array de strings simples: ["limitação 1", "limitação 2"]';
COMMENT ON COLUMN agent_prompts.instructions IS 'Array de strings simples: ["instrução 1", "instrução 2"]';
COMMENT ON COLUMN agent_prompts.rules IS 'Array de strings simples: ["regra 1", "regra 2"]';
COMMENT ON COLUMN agent_prompts.others_instructions IS 'Array de strings simples: ["instrução 1", "instrução 2"]';
COMMENT ON COLUMN agent_prompts.guide_line IS 'Array de GuidelineStep: [{"title": "...", "type": "rank|markdown", "active": true, "sub": [...]}]';

-- 4. NOTA IMPORTANTE:
-- Esta migration NÃO converte dados existentes automaticamente.
-- Os dados existentes com estrutura complexa precisam ser convertidos manualmente
-- ou via script de migração de dados.
--
-- Para converter dados existentes:
-- 1. Extrair os "title" de cada objeto em limitations/instructions/rules
-- 2. Criar novo array apenas com os títulos
--
-- Exemplo de conversão manual:
-- UPDATE agent_prompts
-- SET limitations = (
--   SELECT jsonb_agg(item->>'title')
--   FROM jsonb_array_elements(limitations) AS item
--   WHERE limitations IS NOT NULL AND jsonb_typeof(limitations) = 'array'
-- )
-- WHERE jsonb_typeof(limitations) = 'array';
