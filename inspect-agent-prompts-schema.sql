-- ====================================================================
-- VERIFICAÇÃO: Estrutura completa da tabela agent_prompts
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Ver todos os campos e seus tipos
SELECT 
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_prompts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver tipos ENUM específicos
SELECT 
  t.typname as enum_type,
  e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname LIKE '%agent%'
ORDER BY t.typname, e.enumsortorder;

-- 3. Ver constraints e defaults
SELECT 
  pg_get_constraintdef(c.oid) as constraint_definition,
  contype as constraint_type
FROM pg_constraint c
WHERE conrelid = 'agent_prompts'::regclass;

-- 4. Exemplo de dados para ver estrutura JSONB
SELECT 
  id,
  id_agent,
  id_tenant,
  jsonb_typeof(limitations) as limitations_type,
  jsonb_typeof(instructions) as instructions_type,
  jsonb_typeof(guide_line) as guide_line_type,
  jsonb_typeof(rules) as rules_type,
  jsonb_typeof(others_instructions) as others_instructions_type,
  limitations,
  instructions
FROM agent_prompts
LIMIT 3;
