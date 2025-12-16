-- ============================================================================
-- DEBUG: Por que os domínios não estão sendo encontrados?
-- ============================================================================

-- 1. Ver TODOS os domínios (ignorando neurocore_id e active)
SELECT
    id,
    domain,
    neurocore_id,
    active,
    created_at
FROM knowledge_domains
ORDER BY domain;

-- 2. Ver qual neurocore_id o tenant está usando
SELECT
    t.id as tenant_id,
    t.name as tenant_name,
    t.neurocore_id,
    n.name as neurocore_name
FROM tenants t
LEFT JOIN neurocores n ON n.id = t.neurocore_id
WHERE t.id = '70754914-235c-4e2c-bb42-dedd5352c0e5';

-- 3. Verificar se os domínios estão com o mesmo neurocore_id
SELECT
    kd.domain,
    kd.neurocore_id as dominio_neurocore,
    t.neurocore_id as tenant_neurocore,
    kd.active,
    CASE
        WHEN kd.neurocore_id = t.neurocore_id THEN '✅ MATCH'
        ELSE '❌ DIFERENTE'
    END as status
FROM knowledge_domains kd
CROSS JOIN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = '70754914-235c-4e2c-bb42-dedd5352c0e5'
) t
ORDER BY kd.domain;

-- 4. Ver se os domínios estão com active = true
SELECT
    domain,
    active,
    CASE WHEN active THEN '✅ ATIVO' ELSE '❌ INATIVO' END as status_ativo
FROM knowledge_domains
ORDER BY domain;

-- 5. Testar a query exata que o código está fazendo
SELECT *
FROM knowledge_domains
WHERE neurocore_id = 'c934ffe5-b72d-46b4-b5ba-ed63d65d474e'
  AND active = true
ORDER BY domain;

-- 6. Ver todas as bases e seus domínios
SELECT
    bc.name as base_name,
    kd.domain as domain_name,
    bc.domain as domain_id_na_base,
    kd.id as domain_id_real,
    CASE
        WHEN bc.domain = kd.id THEN '✅ VINCULADO'
        ELSE '❌ NÃO VINCULADO'
    END as status_vinculo
FROM base_conhecimentos bc
LEFT JOIN knowledge_domains kd ON bc.domain = kd.id
WHERE bc.tenant_id = '70754914-235c-4e2c-bb42-dedd5352c0e5'
LIMIT 10;
