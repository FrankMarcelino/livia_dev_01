-- ============================================================================
-- Script de DEBUG para Base de Conhecimento
-- Execute este script no Supabase SQL Editor para verificar os dados
-- ============================================================================

-- 1. Verificar quantos registros existem
SELECT
    'knowledge_domains' as tabela,
    COUNT(*) as total
FROM knowledge_domains
UNION ALL
SELECT
    'base_conhecimentos',
    COUNT(*)
FROM base_conhecimentos;

-- 2. Ver domínios ativos
SELECT
    id,
    domain as nome_dominio,
    neurocore_id,
    active as ativo,
    created_at
FROM knowledge_domains
ORDER BY domain;

-- 3. Ver bases de conhecimento e seus domínios
SELECT
    bc.id,
    bc.name as nome_base,
    kd.domain as dominio,
    bc.is_active as ativo,
    bc.base_conhecimentos_vectors as tem_vetor,
    bc.created_at
FROM base_conhecimentos bc
LEFT JOIN knowledge_domains kd ON bc.domain = kd.id
ORDER BY bc.created_at DESC
LIMIT 20;

-- 4. Verificar bases SEM domínio (precisam migração)
SELECT
    id,
    name,
    neurocore_id,
    tenant_id,
    domain,
    is_active
FROM base_conhecimentos
WHERE domain IS NULL;

-- 5. Contagem de bases por domínio
SELECT
    kd.domain as dominio,
    COUNT(bc.id) as total_bases,
    SUM(CASE WHEN bc.is_active = true THEN 1 ELSE 0 END) as ativas,
    SUM(CASE WHEN bc.base_conhecimentos_vectors IS NOT NULL THEN 1 ELSE 0 END) as com_vetor
FROM knowledge_domains kd
LEFT JOIN base_conhecimentos bc ON bc.domain = kd.id
GROUP BY kd.domain, kd.id
ORDER BY kd.domain;

-- 6. Bases recentes (últimas 5)
SELECT
    bc.name,
    kd.domain,
    bc.is_active,
    bc.created_at,
    bc.updated_at,
    LENGTH(bc.description) as tamanho_conteudo
FROM base_conhecimentos bc
LEFT JOIN knowledge_domains kd ON bc.domain = kd.id
ORDER BY bc.created_at DESC
LIMIT 5;
