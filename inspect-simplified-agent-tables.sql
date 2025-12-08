-- ====================================================================
-- INSPEÇÃO DETALHADA: Estrutura e dados das 3 tabelas simplificadas
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Schema completo de AGENT_PROMPTS_INTENTION
SELECT 
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_prompts_intention'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Exemplos de dados REAIS de AGENT_PROMPTS_INTENTION
SELECT *
FROM agent_prompts_intention
LIMIT 3;

-- 3. Schema completo de AGENT_PROMPTS_OBSERVER
SELECT 
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_prompts_observer'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Exemplos de dados REAIS de AGENT_PROMPTS_OBSERVER
SELECT *
FROM agent_prompts_observer
LIMIT 3;

-- 5. Schema completo de AGENT_PROMPTS_GUARD_RAILS
SELECT 
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'agent_prompts_guard_rails'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 6. Exemplos de dados REAIS de AGENT_PROMPTS_GUARD_RAILS
SELECT *
FROM agent_prompts_guard_rails
LIMIT 3;

-- 7. Verificar se há campos JSONB nessas tabelas
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name IN ('agent_prompts_intention', 'agent_prompts_observer', 'agent_prompts_guard_rails')
  AND data_type = 'jsonb'
ORDER BY table_name, column_name;

-- 8. Comparar número de campos entre as tabelas
SELECT 
  'agent_prompts' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'agent_prompts'
UNION ALL
SELECT 
  'agent_prompts_intention',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_intention'
UNION ALL
SELECT 
  'agent_prompts_observer',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_observer'
UNION ALL
SELECT 
  'agent_prompts_guard_rails',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_guard_rails';
