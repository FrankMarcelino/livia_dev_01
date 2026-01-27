-- ============================================================
-- HELPER: Listar e Deletar Domains
-- Use este script para ver todos os domains e deletar o correto
-- ============================================================

-- ============================================================
-- PARTE 1: LISTAR TODOS OS DOMAINS
-- ============================================================

SELECT 
  id,
  domain as nome_domain,
  neurocore_id,
  active,
  created_at
FROM public.knowledge_domains 
WHERE neurocore_id = 'e6c63068-f469-4c49-a3b6-723d07de8303'
ORDER BY created_at DESC;

-- ============================================================
-- PARTE 2: CONTAR BASES EM CADA DOMAIN
-- ============================================================

SELECT 
  kd.domain as nome_domain,
  kd.id as domain_id,
  COUNT(bc.id) as quantidade_bases
FROM public.knowledge_domains kd
LEFT JOIN public.base_conhecimentos bc 
  ON bc.domain = kd.id 
  AND bc.tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
WHERE kd.neurocore_id = 'e6c63068-f469-4c49-a3b6-723d07de8303'
GROUP BY kd.domain, kd.id
ORDER BY kd.created_at DESC;

-- ============================================================
-- PARTE 3: DELETAR UM DOMAIN ESPECÍFICO
-- ============================================================
-- INSTRUÇÕES:
-- 1. Execute as consultas acima para ver os domains
-- 2. Copie o ID do domain que você quer deletar
-- 3. Substitua 'SEU_DOMAIN_ID_AQUI' pelo ID correto
-- 4. Descomente as linhas abaixo e execute
-- ============================================================

/*
DO $$
DECLARE
  v_tenant_id uuid := '004ead16-af22-419c-8e19-28966d4c4d38';
  v_domain_id uuid := 'SEU_DOMAIN_ID_AQUI'; -- SUBSTITUA AQUI!
  v_bases_count integer := 0;
BEGIN
  RAISE NOTICE 'Deletando domain: %', v_domain_id;

  -- Deletar bases
  DELETE FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain = v_domain_id;

  GET DIAGNOSTICS v_bases_count = ROW_COUNT;
  RAISE NOTICE 'Bases deletadas: %', v_bases_count;

  -- Deletar domain
  DELETE FROM public.knowledge_domains
  WHERE id = v_domain_id;
  
  RAISE NOTICE 'Domain deletado!';
END $$;
*/

-- ============================================================
-- ALTERNATIVA: DELETAR POR NOME (mais fácil)
-- ============================================================
-- Descomente e ajuste o nome do domain abaixo:

/*
DO $$
DECLARE
  v_tenant_id uuid := '004ead16-af22-419c-8e19-28966d4c4d38';
  v_neurocore_id uuid := 'e6c63068-f469-4c49-a3b6-723d07de8303';
  v_domain_id uuid;
  v_bases_count integer := 0;
  v_domain_name text := 'Exames Laboratoriais'; -- AJUSTE O NOME AQUI!
BEGIN
  RAISE NOTICE 'Buscando domain: %', v_domain_name;

  -- Buscar domain
  SELECT id INTO v_domain_id 
  FROM public.knowledge_domains 
  WHERE domain = v_domain_name
    AND neurocore_id = v_neurocore_id;

  IF v_domain_id IS NULL THEN
    RAISE NOTICE 'Domain não encontrado: %', v_domain_name;
    RETURN;
  END IF;

  RAISE NOTICE 'Domain encontrado: %', v_domain_id;

  -- Deletar bases
  DELETE FROM public.base_conhecimentos
  WHERE tenant_id = v_tenant_id
    AND domain = v_domain_id;

  GET DIAGNOSTICS v_bases_count = ROW_COUNT;
  RAISE NOTICE 'Bases deletadas: %', v_bases_count;

  -- Deletar domain
  DELETE FROM public.knowledge_domains
  WHERE id = v_domain_id;
  
  RAISE NOTICE 'Domain deletado: %', v_domain_name;
END $$;
*/
