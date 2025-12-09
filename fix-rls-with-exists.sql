-- ========================================
-- CORREÇÃO FINAL: RLS com EXISTS ao invés de IN
-- ========================================
-- O problema pode ser o uso de IN (subquery) na policy

BEGIN;

-- Remover policy quebrada
DROP POLICY IF EXISTS "tenants_can_view_their_agents" ON agents;
DROP POLICY IF EXISTS "Tenants view agents from their neurocore" ON agents;

-- Criar policy usando EXISTS (mais eficiente e confiável)
CREATE POLICY "tenant_agents_isolation"
ON agents
FOR SELECT
USING (
  -- Usar EXISTS ao invés de IN para melhor performance e confiabilidade
  EXISTS (
    SELECT 1
    FROM users u
    INNER JOIN tenants t ON t.id = u.tenant_id
    WHERE u.id = auth.uid()
      AND t.neurocore_id = agents.id_neurocore
  )
);

COMMENT ON POLICY "tenant_agents_isolation" ON agents
IS 'Isola agents por neurocore - cada tenant vê apenas seus próprios agents';

COMMIT;

-- Verificação
SELECT
  policyname,
  cmd,
  CASE
    WHEN qual LIKE '%EXISTS%' THEN '✓ Usa EXISTS'
    WHEN qual LIKE '%IN (%' THEN '⚠️ Usa IN (pode ter problemas)'
    ELSE 'Outro'
  END as tipo_query
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'agents';
