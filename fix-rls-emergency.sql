-- ⚠️ CORREÇÃO EMERGENCIAL CRÍTICA DE SEGURANÇA ⚠️
-- VAZAMENTO DE DADOS: Tenants estão vendo agents de outros tenants
-- Execute este script no Supabase Dashboard > SQL Editor IMEDIATAMENTE

BEGIN;

-- Remover TODAS as policies existentes de agents que podem estar quebradas
DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;
DROP POLICY IF EXISTS "Tenants can view agents from their neurocore" ON agents;
DROP POLICY IF EXISTS "Super Admins have full access to agents" ON agents;

-- OPÇÃO 1: Policy baseada em agent_prompts (mais permissiva, mas segura)
-- Mostra todos os agents que têm prompts para o tenant OU que são "globais" (sem prompts)
CREATE POLICY "Tenants view agents via prompts"
  ON agents
  FOR SELECT
  USING (
    -- Permite ver agents que têm prompts do tenant
    EXISTS (
      SELECT 1
      FROM agent_prompts ap
      WHERE ap.id_agent = agents.id
      AND ap.id_tenant = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
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

COMMENT ON POLICY "Tenants view agents via prompts" ON agents
IS 'EMERGENCY FIX: Tenants veem apenas agents que têm prompts para eles';

-- Re-criar policy de super admin
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

-- Verificar que as policies foram criadas
SELECT
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'agents'
ORDER BY policyname;
