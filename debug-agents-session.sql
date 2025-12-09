-- DIAGNÓSTICO COMPLETO: Por que tenants veem agents de outros?
-- Execute no Supabase Dashboard enquanto estiver LOGADO na aplicação

-- 1. QUEM SOU EU? (usuário autenticado)
SELECT
  auth.uid() as my_user_id,
  u.full_name,
  u.email,
  u.tenant_id,
  u.role
FROM users u
WHERE u.id = auth.uid();

-- 2. QUAL MEU NEUROCORE?
SELECT
  t.id as tenant_id,
  t.name as tenant_name,
  t.neurocore_id
FROM tenants t
WHERE t.id = (
  SELECT tenant_id
  FROM users
  WHERE id = auth.uid()
);

-- 3. QUAIS AGENTS EU DEVERIA VER? (pela RLS)
SELECT
  a.id,
  a.name,
  a.type,
  a.id_neurocore,
  CASE
    WHEN a.id_neurocore = (
      SELECT t.neurocore_id
      FROM tenants t
      WHERE t.id = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    ) THEN '✓ DEVERIA VER (meu neurocore)'
    ELSE '✗ NÃO DEVERIA VER (outro neurocore)'
  END as visibilidade_esperada
FROM agents a
ORDER BY visibilidade_esperada, a.name;

-- 4. VERIFICAR SE ALGUM AGENT TEM id_neurocore NULL
SELECT
  COUNT(*) as total_agents,
  COUNT(id_neurocore) as agents_com_neurocore,
  COUNT(*) - COUNT(id_neurocore) as agents_sem_neurocore
FROM agents;

-- 5. LISTAR AGENTS SEM NEUROCORE (potencial problema)
SELECT
  id,
  name,
  type,
  id_neurocore,
  'PROBLEMA: Agent sem neurocore será visível para todos!' as alerta
FROM agents
WHERE id_neurocore IS NULL
LIMIT 10;
