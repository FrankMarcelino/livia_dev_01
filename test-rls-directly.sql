-- TESTE DEFINITIVO: Por que RLS não funciona?
-- Execute no Supabase SQL Editor ENQUANTO estiver LOGADO na aplicação

-- 1. Verificar se auth.uid() retorna algo
SELECT
  auth.uid() as my_user_id,
  CASE
    WHEN auth.uid() IS NULL THEN '❌ auth.uid() é NULL - RLS não vai funcionar!'
    ELSE '✅ auth.uid() funcionando'
  END as status;

-- 2. Testar a mesma query que a aplicação faz
-- Se retornar 18, a RLS não está sendo aplicada
-- Se retornar 8, a RLS está funcionando
SELECT
  COUNT(*) as total_agents_visiveis,
  'Se for 18 = RLS quebrada, Se for 8 = RLS ok' as interpretacao
FROM agents;

-- 3. Ver quais agents são retornados (com neurocore)
SELECT
  a.id,
  a.name,
  a.id_neurocore,
  (
    SELECT t.neurocore_id
    FROM tenants t
    INNER JOIN users u ON u.tenant_id = t.id
    WHERE u.id = auth.uid()
  ) as meu_neurocore,
  CASE
    WHEN a.id_neurocore = (
      SELECT t.neurocore_id
      FROM tenants t
      INNER JOIN users u ON u.tenant_id = t.id
      WHERE u.id = auth.uid()
    ) THEN '✓ Deveria ver'
    ELSE '✗ NÃO deveria ver'
  END as deveria_ver
FROM agents
ORDER BY deveria_ver, a.name;

-- 4. Testar se a subquery da policy retorna algo
SELECT
  t.neurocore_id
FROM tenants t
INNER JOIN users u ON u.tenant_id = t.id
WHERE u.id = auth.uid();

-- Se retornar vazio, a policy não vai funcionar!
