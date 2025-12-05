-- ====================================================================
-- FIX FINAL: RLS Policy CORRETA com nomes de colunas reais
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- ESTRUTURA CONFIRMADA:
-- - agents.id_neurocore → neurocores.id
-- - tenants.neurocore_id → neurocores.id  (ATENÇÃO: neurocore_id, não id_neurocore!)

-- ====================================================================
-- 1. REMOVER POLICIES ANTIGAS
-- ====================================================================

DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;
DROP POLICY IF EXISTS "Tenants can view agents from their neurocore" ON agents;
DROP POLICY IF EXISTS "Authenticated users can view all agents" ON agents;

-- ====================================================================
-- 2. CRIAR POLICY CORRETA
-- ====================================================================

CREATE POLICY "Tenants can view agents from their neurocore"
  ON agents
  FOR SELECT
  USING (
    id_neurocore = (
      SELECT neurocore_id
      FROM tenants
      WHERE id = (
        SELECT tenant_id
        FROM users
        WHERE id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "Tenants can view agents from their neurocore" ON agents
IS 'Tenants podem visualizar apenas agents do mesmo neurocore';

-- ====================================================================
-- 3. VERIFICAÇÃO
-- ====================================================================

DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies
  WHERE tablename = 'agents';

  RAISE NOTICE '✓ Policy criada com sucesso!';
  RAISE NOTICE '✓ Total de policies em agents: %', policy_count;
  RAISE NOTICE '✓ Agents filtrados: agents.id_neurocore = tenants.neurocore_id';
END $$;

-- Listar policies
SELECT policyname FROM pg_policies WHERE tablename = 'agents';
