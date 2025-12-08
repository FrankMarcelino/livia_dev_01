-- ====================================================================
-- INSPEÇÃO CONSOLIDADA: Schema das tabelas simplificadas
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

SELECT 
  table_name,
  column_name,
  data_type,
  udt_name as postgres_type,
  is_nullable
FROM information_schema.columns
WHERE table_name IN ('agent_prompts_intention', 'agent_prompts_observer', 'agent_prompts_guard_rails')
  AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
