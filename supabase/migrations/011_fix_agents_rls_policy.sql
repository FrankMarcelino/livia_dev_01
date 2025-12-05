-- Migration: Fix RLS Policy for Agents Table
-- Problema: Policy anterior só mostrava agents que JÁ têm prompts para o tenant
-- Solução: Mostrar agents do neurocore do tenant (via tenants.id_neurocore)

BEGIN;

-- Remover policy antiga
DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;

-- Criar nova policy que permite ver agents do neurocore associado ao tenant
CREATE POLICY "Tenants can view agents from their neurocore"
  ON agents
  FOR SELECT
  USING (
    -- Permite ver agents cujos neurocores associados incluem o neurocore do tenant
    associated_neurocores && ARRAY[(
      SELECT id_neurocore::text
      FROM tenants
      WHERE id = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )]
  );

COMMENT ON POLICY "Tenants can view agents from their neurocore" ON agents
IS 'Tenants podem visualizar agents associados ao neurocore do seu tenant';

COMMIT;

-- Verificação pós-migration
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agents'
    AND policyname = 'Tenants can view agents from their neurocore'
  ) INTO policy_exists;

  IF policy_exists THEN
    RAISE NOTICE '✓ Policy "Tenants can view agents from their neurocore" criada com sucesso';
  ELSE
    RAISE EXCEPTION '✗ Falha ao criar policy';
  END IF;

  RAISE NOTICE '=== MIGRATION 011 COMPLETA ===';
END $$;
