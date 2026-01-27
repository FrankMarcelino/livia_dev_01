-- ============================================================
-- DELETE: Remover domain "Exames Laboratoriais" e suas bases
-- Tenant ID: 004ead16-af22-419c-8e19-28966d4c4d38
-- Data: 2026-01-27
-- ============================================================

DO $$
DECLARE
  v_tenant_id uuid := '004ead16-af22-419c-8e19-28966d4c4d38';
  v_neurocore_id uuid := 'e6c63068-f469-4c49-a3b6-723d07de8303';
  v_domain_id uuid;
  v_bases_count integer := 0;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Deletando domain "Exames Laboratoriais" e suas bases';
  RAISE NOTICE '============================================================';

  -- ============================================================
  -- 1. BUSCAR O DOMAIN "Exames Laboratoriais"
  -- ============================================================
  
  SELECT id INTO v_domain_id 
  FROM public.knowledge_domains 
  WHERE domain = 'Exames Laboratoriais' 
    AND neurocore_id = v_neurocore_id;

  -- Se não encontrar, tentar variações do nome
  IF v_domain_id IS NULL THEN
    SELECT id INTO v_domain_id 
    FROM public.knowledge_domains 
    WHERE domain ILIKE '%exames%laboratoriais%'
      AND neurocore_id = v_neurocore_id;
  END IF;

  IF v_domain_id IS NULL THEN
    RAISE NOTICE 'Domain "Exames Laboratoriais" não encontrado.';
    RAISE NOTICE 'Verificando todos os domains disponíveis...';
    
    -- Mostrar todos os domains para debug
    RAISE NOTICE '--- Domains existentes: ---';
    FOR v_domain_id IN 
      SELECT id 
      FROM public.knowledge_domains 
      WHERE neurocore_id = v_neurocore_id
    LOOP
      RAISE NOTICE 'Domain ID: %', v_domain_id;
    END LOOP;
    
    RETURN;
  END IF;

  RAISE NOTICE 'Domain encontrado: %', v_domain_id;

  -- ============================================================
  -- 2. DELETAR TODAS AS BASES DESTE DOMAIN
  -- ============================================================
  
  DELETE FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain = v_domain_id;

  GET DIAGNOSTICS v_bases_count = ROW_COUNT;
  RAISE NOTICE 'Bases de conhecimento deletadas: %', v_bases_count;

  -- ============================================================
  -- 3. DELETAR O DOMAIN
  -- ============================================================
  
  DELETE FROM public.knowledge_domains
  WHERE id = v_domain_id 
    AND neurocore_id = v_neurocore_id;
  
  RAISE NOTICE 'Domain deletado com sucesso!';

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'LIMPEZA CONCLUÍDA!';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- VERIFICAÇÃO: Listar todos os domains restantes
-- ============================================================

SELECT 
  domain,
  neurocore_id,
  active,
  created_at
FROM public.knowledge_domains 
WHERE neurocore_id = 'e6c63068-f469-4c49-a3b6-723d07de8303'
ORDER BY created_at DESC;

-- Verificar se ainda existe alguma base sem domain válido
SELECT 
  COUNT(*) as bases_sem_domain_valido
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain NOT IN (SELECT id FROM public.knowledge_domains WHERE neurocore_id = 'e6c63068-f469-4c49-a3b6-723d07de8303');
