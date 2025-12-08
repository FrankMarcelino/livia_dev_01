-- ====================================================================
-- INSPEÇÃO COMPLETA: Estrutura da tabela agent_prompts
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Ver TODOS os campos, tipos, nullable, e defaults
SELECT 
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'agent_prompts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Ver tipos ENUM usados na tabela
SELECT 
  c.column_name,
  t.typname as enum_type_name,
  array_agg(e.enumlabel ORDER BY e.enumsortorder) as possible_values
FROM information_schema.columns c
JOIN pg_type t ON c.udt_name = t.typname
LEFT JOIN pg_enum e ON t.oid = e.enumtypid
WHERE c.table_name = 'agent_prompts'
  AND c.table_schema = 'public'
  AND t.typtype = 'e'
GROUP BY c.column_name, t.typname;

-- 3. Ver se os campos JSONB têm CHECK constraints
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'agent_prompts'::regclass
  AND contype = 'c';

-- 4. Ver exemplos REAIS de dados JSONB (primeiros 3 registros)
SELECT 
  id,
  id_tenant,
  -- Ver tipo e estrutura dos JSONB
  jsonb_typeof(limitations) as limitations_type,
  jsonb_typeof(instructions) as instructions_type,
  jsonb_typeof(guide_line) as guide_line_type,
  jsonb_typeof(rules) as rules_type,
  jsonb_typeof(others_instructions) as others_instructions_type,
  -- Ver conteúdo real
  limitations::text as limitations_content,
  instructions::text as instructions_content,
  guide_line::text as guide_line_content,
  rules::text as rules_content,
  others_instructions::text as others_instructions_content
FROM agent_prompts
WHERE id_tenant IS NOT NULL  -- Apenas prompts de tenants
LIMIT 3;

-- 5. Ver se há dados com estrutura complexa (GuidelineStep) em limitations/instructions/rules
SELECT 
  COUNT(*) as total_rows,
  COUNT(CASE WHEN limitations IS NOT NULL THEN 1 END) as with_limitations,
  COUNT(CASE WHEN instructions IS NOT NULL THEN 1 END) as with_instructions,
  COUNT(CASE WHEN rules IS NOT NULL THEN 1 END) as with_rules,
  COUNT(CASE WHEN guide_line IS NOT NULL THEN 1 END) as with_guide_line,
  COUNT(CASE WHEN others_instructions IS NOT NULL THEN 1 END) as with_others_instructions
FROM agent_prompts;

-- 6. Testar se limitations é array de strings ou array de objetos
SELECT 
  id,
  id_tenant,
  limitations,
  CASE 
    WHEN limitations IS NULL THEN 'NULL'
    WHEN jsonb_typeof(limitations) != 'array' THEN 'NOT ARRAY'
    WHEN jsonb_array_length(limitations) = 0 THEN 'EMPTY ARRAY'
    ELSE jsonb_typeof(limitations->0)
  END as first_item_type,
  limitations->0 as first_item_content
FROM agent_prompts
WHERE limitations IS NOT NULL
  AND jsonb_array_length(limitations) > 0
LIMIT 5;
