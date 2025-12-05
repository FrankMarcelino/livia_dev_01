-- Verificar status de RLS nas tabelas

-- 1. Verificar se RLS está ativo
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename IN ('agents', 'agent_prompts', 'agent_templates')
  AND schemaname = 'public';

-- 2. Listar todas as policies
SELECT
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN 'Has USING clause'
    ELSE 'No USING clause'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
    ELSE 'No WITH CHECK clause'
  END as with_check_clause
FROM pg_policies
WHERE tablename IN ('agents', 'agent_prompts', 'agent_templates')
ORDER BY tablename, policyname;

-- 3. Verificar se há agents cadastrados (como super admin ou sem RLS)
SELECT COUNT(*) as total_agents FROM agents;

-- 4. Verificar se há agent_prompts cadastrados
SELECT COUNT(*) as total_prompts FROM agent_prompts;

-- 5. Verificar a estrutura de relacionamento
SELECT
  COUNT(DISTINCT a.id) as total_agents,
  COUNT(DISTINCT ap.id) as total_prompts,
  COUNT(DISTINCT ap.id_tenant) as unique_tenants_in_prompts
FROM agents a
LEFT JOIN agent_prompts ap ON ap.id_agent = a.id;
