-- ============================================================
-- ROLLBACK: Remover seed incorreto de exames (synapses)
-- Tenant ID: 004ead16-af22-419c-8e19-28966d4c4d38
-- Data: 2026-01-27
-- ============================================================
-- ATENÇÃO: Este script remove APENAS os dados criados incorretamente
-- NÃO remove o domain "exames" se você já tiver outros dados nele
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
  RAISE NOTICE 'Iniciando ROLLBACK do seed incorreto';
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
  -- 1. REMOVER SYNAPSES criadas incorretamente
  -- ============================================================
  
  -- Contar synapses antes
  SELECT COUNT(*) INTO v_synapses_count
  FROM public.synapses
  WHERE tenant_id = v_tenant_id;

  RAISE NOTICE 'Synapses encontradas: %', v_synapses_count;

  -- Deletar synapses do tenant (criadas no seed anterior)
  DELETE FROM public.synapses
  WHERE tenant_id = v_tenant_id
    AND created_at >= CURRENT_DATE; -- Apenas as criadas hoje

  GET DIAGNOSTICS v_synapses_count = ROW_COUNT;
  RAISE NOTICE 'Synapses deletadas: %', v_synapses_count;

  -- ============================================================
  -- 2. REMOVER BASES DE CONHECIMENTO duplicadas/incorretas (OPCIONAL)
  -- ============================================================
  
  -- Se você executou o seed anterior que criou uma base "Exames" única:
  -- DELETE FROM public.base_conhecimentos
  -- WHERE tenant_id = v_tenant_id
  --   AND domain = v_domain_id
  --   AND name = 'Exames';

  -- OU se quiser remover TODAS as bases criadas HOJE no domain exames:
  -- CUIDADO: Isso remove tudo que foi criado hoje!
  /*
  DELETE FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain = v_domain_id
    AND created_at >= CURRENT_DATE;

  GET DIAGNOSTICS v_bases_count = ROW_COUNT;
  RAISE NOTICE 'Bases de conhecimento deletadas: %', v_bases_count;
  */

  -- ============================================================
  -- 3. REMOVER DOMAIN (SOMENTE SE NECESSÁRIO)
  -- ============================================================
  
  -- ATENÇÃO: Só descomente isso se você tiver certeza que quer deletar o domain!
  -- Isso vai remover TUDO relacionado a "exames"
  /*
  DELETE FROM public.knowledge_domains
  WHERE domain = 'exames' AND neurocore_id = v_neurocore_id;
  
  RAISE NOTICE 'Domain "exames" deletado';
  */

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'ROLLBACK CONCLUÍDO!';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- CONSULTAS DE VERIFICAÇÃO PÓS-ROLLBACK
-- ============================================================

-- Verificar synapses restantes
SELECT 
  COUNT(*) as synapses_restantes
FROM public.synapses
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38';

-- Verificar bases de conhecimento no domain exames
SELECT 
  COUNT(*) as bases_no_domain_exames
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames');

-- Listar bases restantes (se houver)
SELECT 
  name,
  LEFT(description, 60) as preview,
  created_at
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames')
ORDER BY created_at DESC
LIMIT 10;
