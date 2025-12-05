-- Verificar TODOS os campos da tabela agent_prompts
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
