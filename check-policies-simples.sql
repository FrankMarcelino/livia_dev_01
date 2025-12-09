-- QUERY MAIS IMPORTANTE: Ver se está usando campo correto

SELECT
  policyname,
  cmd as tipo,
  CASE
    WHEN qual LIKE '%id_neurocore%' THEN '✓ CORRETO - usa id_neurocore'
    WHEN qual LIKE '%associated_neurocores%' THEN '✗ ERRADO - usa campo que não existe'
    ELSE 'Outro critério'
  END as status_policy
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'agents'
ORDER BY policyname;
