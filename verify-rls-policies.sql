-- VERIFICAÇÃO: Policies foram criadas corretamente?

-- 1. RLS está FORÇADO?
SELECT
  tablename,
  rowsecurity as "RLS Enabled",
  -- Em versões antigas do PostgreSQL não existe row_security_enforcement
  -- então vamos verificar através das policies
  (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'agents') as "Policies Count"
FROM pg_tables
WHERE schemaname = 'public' AND tablename = 'agents';

-- 2. Quais policies existem?
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual as "USING Expression (resumido - primeiros 100 chars)"
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'agents';

-- 3. A policy usa o campo correto?
SELECT
  policyname,
  CASE
    WHEN qual LIKE '%id_neurocore%' THEN '✓ Usa id_neurocore (CORRETO)'
    WHEN qual LIKE '%associated_neurocores%' THEN '✗ Usa campo inexistente'
    ELSE '? Campo desconhecido'
  END as "Validação Campo",
  CASE
    WHEN qual LIKE '%auth.uid()%' THEN '✓ Usa auth.uid()'
    ELSE '✗ NÃO usa auth.uid()'
  END as "Validação Auth"
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'agents'
  AND cmd = 'SELECT';
