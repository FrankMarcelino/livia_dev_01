-- CORREÇÃO FORÇADA DE RLS PARA AGENTS
-- Remove e recria as policies independente do estado atual
-- Execute este script no Supabase Dashboard > SQL Editor

-- PASSO 1: Remover TODAS as policies existentes (sem erro se não existirem)
DO $$
BEGIN
    -- Lista de todas as policies conhecidas
    DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;
    DROP POLICY IF EXISTS "Tenants can view agents from their neurocore" ON agents;
    DROP POLICY IF EXISTS "Tenants view agents via prompts" ON agents;
    DROP POLICY IF EXISTS "Super Admins have full access to agents" ON agents;
    DROP POLICY IF EXISTS "Tenants view agents from their neurocore" ON agents;

    RAISE NOTICE 'Policies antigas removidas com sucesso';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Erro ao remover policies: %', SQLERRM;
END $$;

-- PASSO 2: Criar POLICY DEFINITIVA
CREATE POLICY "Tenants view agents from their neurocore"
  ON agents
  FOR SELECT
  USING (
    -- Permite ver agents cujo id_neurocore corresponde ao neurocore do tenant
    id_neurocore = (
      SELECT t.neurocore_id
      FROM tenants t
      WHERE t.id = (
        SELECT tenant_id
        FROM users
        WHERE id = auth.uid()
      )
    )
    OR
    -- OU permite para super admin
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

COMMENT ON POLICY "Tenants view agents from their neurocore" ON agents
IS 'Tenants podem visualizar apenas agents do neurocore associado ao seu tenant';

-- PASSO 3: Policy para Super Admin (acesso total)
CREATE POLICY "Super Admins have full access to agents"
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

-- PASSO 4: Verificação
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%id_neurocore%' THEN '✓ Usa id_neurocore (CORRETO)'
    WHEN qual LIKE '%associated_neurocores%' THEN '✗ Usa associated_neurocores (ERRADO - campo não existe!)'
    ELSE 'Super admin ou outro'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'agents'
ORDER BY policyname;
