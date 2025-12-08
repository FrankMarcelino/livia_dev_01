-- ====================================================================
-- INSPEÇÃO: Todas as tabelas de agent prompts
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. AGENT_PROMPTS (Principal - já conhecemos)
SELECT 
  'agent_prompts' as table_name,
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_prompts'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. AGENT_PROMPTS_INTENTION
SELECT 
  'agent_prompts_intention' as table_name,
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_prompts_intention'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. AGENT_PROMPTS_OBSERVER
SELECT 
  'agent_prompts_observer' as table_name,
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_prompts_observer'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. AGENT_PROMPTS_GUARD_RAILS
SELECT 
  'agent_prompts_guard_rails' as table_name,
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'agent_prompts_guard_rails'
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 5. Comparação: Contagem de campos por tabela
SELECT 
  'agent_prompts' as table_name,
  COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'agent_prompts' AND table_schema = 'public'
UNION ALL
SELECT 
  'agent_prompts_intention',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_intention' AND table_schema = 'public'
UNION ALL
SELECT 
  'agent_prompts_observer',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_observer' AND table_schema = 'public'
UNION ALL
SELECT 
  'agent_prompts_guard_rails',
  COUNT(*)
FROM information_schema.columns
WHERE table_name = 'agent_prompts_guard_rails' AND table_schema = 'public';

-- 6. Verificar se as tabelas existem
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE tablename LIKE 'agent_prompts%'
  AND schemaname = 'public'
ORDER BY tablename;

-- 7. Ver exemplos de dados de cada tabela (se existirem)
SELECT 'agent_prompts' as table_name, COUNT(*) as total_rows
FROM agent_prompts
UNION ALL
SELECT 'agent_prompts_intention', COUNT(*)
FROM agent_prompts_intention
UNION ALL
SELECT 'agent_prompts_observer', COUNT(*)
FROM agent_prompts_observer
UNION ALL
SELECT 'agent_prompts_guard_rails', COUNT(*)
FROM agent_prompts_guard_rails;
