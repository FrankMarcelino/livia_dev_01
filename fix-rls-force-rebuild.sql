-- ========================================
-- RECONSTRUÇÃO TOTAL DA RLS DE AGENTS
-- ========================================
-- Este script reconstrói a segurança do zero

BEGIN;

-- PASSO 1: DESABILITAR RLS temporariamente
ALTER TABLE agents DISABLE ROW LEVEL SECURITY;

-- PASSO 2: REMOVER TODAS AS POLICIES (forçado)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'agents'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON agents', pol.policyname);
        RAISE NOTICE 'Policy removida: %', pol.policyname;
    END LOOP;
END $$;

-- PASSO 3: REABILITAR RLS
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

-- PASSO 4: FORÇAR RLS MESMO PARA TABLE OWNER (CRÍTICO!)
ALTER TABLE agents FORCE ROW LEVEL SECURITY;

-- PASSO 5: CRIAR POLICY SIMPLES E CLARA
CREATE POLICY "tenants_can_view_their_agents"
ON agents
FOR SELECT
USING (
  -- Buscar o neurocore_id do tenant do usuário logado
  id_neurocore IN (
    SELECT t.neurocore_id
    FROM tenants t
    INNER JOIN users u ON u.tenant_id = t.id
    WHERE u.id = auth.uid()
  )
);

COMMENT ON POLICY "tenants_can_view_their_agents" ON agents
IS 'Permite que tenants vejam apenas agents do seu neurocore';

-- PASSO 6: POLICY PARA SUPER ADMIN (acesso total)
CREATE POLICY "super_admins_full_access"
ON agents
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'super_admin'
  )
);

COMMIT;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- 1. Confirmar que RLS está habilitado E FORÇADO
SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Habilitado",
  CASE
    WHEN rowsecurity THEN '✓ Ativo'
    ELSE '✗ DESABILITADO - PROBLEMA!'
  END as status_rls
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'agents';

-- 2. Listar policies criadas
SELECT
  policyname as "Nome da Policy",
  cmd as "Tipo",
  CASE
    WHEN qual LIKE '%id_neurocore%' THEN '✓ Usa id_neurocore'
    ELSE 'Outro'
  END as "Campo Usado"
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'agents'
ORDER BY policyname;

-- 3. TESTE PRÁTICO: Executar query como se fosse a aplicação
-- IMPORTANTE: Você precisa estar LOGADO para ver este resultado correto
SELECT
  COUNT(*) as total_agents_visiveis,
  COUNT(DISTINCT id_neurocore) as neurocores_distintos
FROM agents;

-- Se neurocores_distintos = 1, a RLS está funcionando!
-- Se neurocores_distintos > 1, ainda há vazamento!
