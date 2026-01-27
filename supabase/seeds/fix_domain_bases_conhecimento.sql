-- ============================================================
-- FIX: Preencher campo domain nas bases de conhecimento
-- Tenant ID: af814af9-464b-4d9a-9756-32d25ffd7d7c
-- Domain ID: 6fd431bd-bca4-4084-9945-488ef7fb26d7
-- Data: 2026-01-27
-- ============================================================

DO $$
DECLARE
  v_tenant_id uuid := 'af814af9-464b-4d9a-9756-32d25ffd7d7c';
  v_domain_id uuid := '6fd431bd-bca4-4084-9945-488ef7fb26d7';
  v_bases_null integer := 0;
  v_bases_updated integer := 0;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Corrigindo campo domain nas bases de conhecimento';
  RAISE NOTICE 'Tenant: %', v_tenant_id;
  RAISE NOTICE 'Domain: %', v_domain_id;
  RAISE NOTICE '============================================================';

  -- ============================================================
  -- 1. VERIFICAR QUANTAS BASES ESTÃO SEM DOMAIN (NULL)
  -- ============================================================
  
  SELECT COUNT(*) INTO v_bases_null
  FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain IS NULL;

  RAISE NOTICE 'Bases com domain NULL: %', v_bases_null;

  -- ============================================================
  -- 2. VERIFICAR SE O DOMAIN EXISTE
  -- ============================================================
  
  PERFORM 1
  FROM public.knowledge_domains
  WHERE id = v_domain_id;

  IF NOT FOUND THEN
    RAISE WARNING 'ATENÇÃO: Domain % não encontrado na tabela knowledge_domains!', v_domain_id;
    RAISE NOTICE 'Continuando mesmo assim...';
  ELSE
    RAISE NOTICE 'Domain verificado e existe na tabela knowledge_domains.';
  END IF;

  -- ============================================================
  -- 3. ATUALIZAR BASES QUE ESTÃO COM DOMAIN NULL
  -- ============================================================
  
  UPDATE public.base_conhecimentos
  SET domain = v_domain_id
  WHERE tenant_id = v_tenant_id
    AND domain IS NULL;

  GET DIAGNOSTICS v_bases_updated = ROW_COUNT;
  RAISE NOTICE 'Bases atualizadas: %', v_bases_updated;

  -- ============================================================
  -- 4. VERIFICAR SE HÁ BASES COM OUTROS DOMAINS INCORRETOS
  -- ============================================================
  
  SELECT COUNT(*) INTO v_bases_null
  FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain IS NOT NULL
    AND domain != v_domain_id;

  IF v_bases_null > 0 THEN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ATENÇÃO: Existem % bases com outros domains!', v_bases_null;
    RAISE NOTICE 'Se quiser atualizar TODAS as bases para o mesmo domain,';
    RAISE NOTICE 'descomente a seção OPCIONAL no final do script.';
    RAISE NOTICE '============================================================';
  END IF;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'CORREÇÃO CONCLUÍDA!';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- VERIFICAÇÃO: Ver situação atual
-- ============================================================

-- Contar bases por domain
SELECT 
  CASE 
    WHEN domain IS NULL THEN 'NULL (SEM DOMAIN)'
    WHEN domain = '6fd431bd-bca4-4084-9945-488ef7fb26d7' THEN 'DOMAIN CORRETO'
    ELSE 'OUTRO DOMAIN: ' || domain::text
  END as status_domain,
  COUNT(*) as quantidade
FROM public.base_conhecimentos
WHERE tenant_id = 'af814af9-464b-4d9a-9756-32d25ffd7d7c'
GROUP BY domain
ORDER BY COUNT(*) DESC;

-- Listar algumas bases para verificar
SELECT 
  id,
  name,
  domain,
  is_active,
  created_at
FROM public.base_conhecimentos
WHERE tenant_id = 'af814af9-464b-4d9a-9756-32d25ffd7d7c'
ORDER BY created_at DESC
LIMIT 10;

-- ============================================================
-- OPCIONAL: Atualizar TODAS as bases para o mesmo domain
-- ============================================================
-- Se você quiser que TODAS as bases (mesmo as que já têm domain)
-- sejam atualizadas para o domain correto, descomente abaixo:

/*
DO $$
DECLARE
  v_tenant_id uuid := 'af814af9-464b-4d9a-9756-32d25ffd7d7c';
  v_domain_id uuid := '6fd431bd-bca4-4084-9945-488ef7fb26d7';
  v_bases_updated integer := 0;
BEGIN
  RAISE NOTICE 'Atualizando TODAS as bases para o domain: %', v_domain_id;

  UPDATE public.base_conhecimentos
  SET domain = v_domain_id
  WHERE tenant_id = v_tenant_id;

  GET DIAGNOSTICS v_bases_updated = ROW_COUNT;
  RAISE NOTICE 'Total de bases atualizadas: %', v_bases_updated;

END $$;
*/
