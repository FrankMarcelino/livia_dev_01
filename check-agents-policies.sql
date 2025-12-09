-- DIAGNÓSTICO: Verificar estado atual das policies de agents
-- Execute no Supabase Dashboard > SQL Editor para ver o que está configurado

-- 1. Verificar se RLS está habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'agents';

-- 2. Listar TODAS as policies de agents
SELECT
  schemaname,
  tablename,
  policyname,
  cmd as command_type,
  CASE
    WHEN qual LIKE '%id_neurocore%' THEN '✓ Usa id_neurocore (CORRETO)'
    WHEN qual LIKE '%associated_neurocores%' THEN '✗ Usa associated_neurocores (ERRADO)'
    ELSE 'Outro critério'
  END as campo_usado,
  qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'agents'
ORDER BY policyname;

-- 3. Verificar estrutura da tabela agents
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agents'
  AND column_name IN ('id_neurocore', 'associated_neurocores')
ORDER BY column_name;

-- 4. Verificar se existe relação tenant -> neurocore
SELECT
  t.id as tenant_id,
  t.neurocore_id,
  COUNT(a.id) as agents_count
FROM tenants t
LEFT JOIN agents a ON a.id_neurocore = t.neurocore_id
GROUP BY t.id, t.neurocore_id
ORDER BY agents_count DESC
LIMIT 5;
