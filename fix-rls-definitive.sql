-- CORREÇÃO DEFINITIVA DE RLS PARA AGENTS
-- Baseado na estrutura REAL descoberta: agents tem campo `id_neurocore` (singular)
-- Execute este script no Supabase Dashboard > SQL Editor

BEGIN;

-- Remover TODAS as policies existentes de agents
DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;
DROP POLICY IF EXISTS "Tenants can view agents from their neurocore" ON agents;
DROP POLICY IF EXISTS "Tenants view agents via prompts" ON agents;
DROP POLICY IF EXISTS "Super Admins have full access to agents" ON agents;

-- POLICY DEFINITIVA: Filtrar por id_neurocore do tenant
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

-- Policy para Super Admin (acesso total)
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

COMMIT;

-- Verificação pós-aplicação
DO $$
BEGIN
  RAISE NOTICE '=== VERIFICAÇÃO DE POLICIES ===';
  RAISE NOTICE '';

  -- Verificar se RLS está habilitado
  IF EXISTS (
    SELECT 1 FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename = 'agents'
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✓ RLS está HABILITADO na tabela agents';
  ELSE
    RAISE WARNING '✗ RLS NÃO está habilitado na tabela agents!';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE 'Policies criadas:';

  -- Listar policies
  FOR rec IN
    SELECT policyname, cmd
    FROM pg_policies
    WHERE tablename = 'agents'
    ORDER BY policyname
  LOOP
    RAISE NOTICE '  ✓ % (%)', rec.policyname, rec.cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== CORREÇÃO APLICADA COM SUCESSO ===';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  AÇÃO NECESSÁRIA:';
  RAISE NOTICE '   1. Teste com 2 tenants diferentes';
  RAISE NOTICE '   2. Verifique que Tenant A NÃO vê agents do Tenant B';
  RAISE NOTICE '   3. Atualize o arquivo types/database.ts no código';
END $$;
