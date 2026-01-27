-- ============================================================
-- ROLLBACK COMPLETO: Remover TUDO relacionado a exames
-- Tenant ID: 004ead16-af22-419c-8e19-28966d4c4d38
-- Data: 2026-01-27
-- ============================================================
-- ⚠️ ATENÇÃO: Este script remove TUDO - Domain + Bases + Synapses
-- Use apenas se quiser começar completamente do ZERO!
-- ============================================================

DO $$
DECLARE
  v_tenant_id uuid := '004ead16-af22-419c-8e19-28966d4c4d38';
  v_neurocore_id uuid := 'e6c63068-f469-4c49-a3b6-723d07de8303';
  v_domain_id uuid;
  v_synapses_count integer := 0;
  v_bases_count integer := 0;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE '⚠️  ROLLBACK COMPLETO - REMOVENDO TUDO!';
  RAISE NOTICE '============================================================';

  -- Buscar o domain ID
  SELECT id INTO v_domain_id 
  FROM public.knowledge_domains 
  WHERE domain = 'exames' AND neurocore_id = v_neurocore_id;

  IF v_domain_id IS NULL THEN
    RAISE NOTICE 'Domain "exames" não encontrado. Nada para fazer.';
    RETURN;
  END IF;

  RAISE NOTICE 'Domain encontrado: %', v_domain_id;

  -- ============================================================
  -- 1. REMOVER TODAS AS SYNAPSES do tenant
  -- ============================================================
  
  DELETE FROM public.synapses
  WHERE tenant_id = v_tenant_id;

  GET DIAGNOSTICS v_synapses_count = ROW_COUNT;
  RAISE NOTICE 'Synapses deletadas: %', v_synapses_count;

  -- ============================================================
  -- 2. REMOVER TODAS AS BASES DE CONHECIMENTO do domain exames
  -- ============================================================
  
  DELETE FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain = v_domain_id;

  GET DIAGNOSTICS v_bases_count = ROW_COUNT;
  RAISE NOTICE 'Bases de conhecimento deletadas: %', v_bases_count;

  -- ============================================================
  -- 3. REMOVER O DOMAIN "exames"
  -- ============================================================
  
  DELETE FROM public.knowledge_domains
  WHERE domain = 'exames' AND neurocore_id = v_neurocore_id;
  
  RAISE NOTICE 'Domain "exames" deletado';

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ROLLBACK COMPLETO CONCLUÍDO!';
  RAISE NOTICE 'Você pode agora executar os seeds novos do zero.';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- CONSULTAS DE VERIFICAÇÃO - DEVE ESTAR TUDO ZERADO
-- ============================================================

-- Verificar domain (não deve existir)
SELECT 
  COUNT(*) as domains_exames
FROM public.knowledge_domains 
WHERE domain = 'exames' AND neurocore_id = 'e6c63068-f469-4c49-a3b6-723d07de8303';

-- Verificar synapses (deve ser 0)
SELECT 
  COUNT(*) as synapses_tenant
FROM public.synapses
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38';

-- Verificar bases (não deve ter nenhuma no domain exames)
SELECT 
  COUNT(*) as bases_exames
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames');
