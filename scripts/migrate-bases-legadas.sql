-- ============================================================================
-- Script para migrar bases de conhecimento legadas (sem domain)
-- ============================================================================

-- Passo 1: Criar domínio padrão "Geral" para cada neurocore que tenha bases sem domínio
DO $$
DECLARE
    v_neurocore_id UUID;
    v_domain_id UUID;
BEGIN
    -- Para cada neurocore que tem bases sem domínio
    FOR v_neurocore_id IN
        SELECT DISTINCT neurocore_id
        FROM base_conhecimentos
        WHERE domain IS NULL
    LOOP
        -- Verificar se já existe domínio "Geral" para este neurocore
        SELECT id INTO v_domain_id
        FROM knowledge_domains
        WHERE neurocore_id = v_neurocore_id
          AND domain = 'Geral'
        LIMIT 1;

        -- Se não existir, criar
        IF v_domain_id IS NULL THEN
            INSERT INTO knowledge_domains (neurocore_id, domain, active)
            VALUES (v_neurocore_id, 'Geral', true)
            RETURNING id INTO v_domain_id;

            RAISE NOTICE 'Criado domínio "Geral" (%) para neurocore %', v_domain_id, v_neurocore_id;
        END IF;

        -- Atualizar bases sem domínio para usar o domínio "Geral"
        UPDATE base_conhecimentos
        SET domain = v_domain_id
        WHERE neurocore_id = v_neurocore_id
          AND domain IS NULL;

        RAISE NOTICE 'Bases migradas para domínio "Geral" do neurocore %', v_neurocore_id;
    END LOOP;
END $$;

-- Verificar resultado
SELECT
    'Bases com domain' as status,
    COUNT(*) as total
FROM base_conhecimentos
WHERE domain IS NOT NULL

UNION ALL

SELECT
    'Bases SEM domain' as status,
    COUNT(*) as total
FROM base_conhecimentos
WHERE domain IS NULL;

-- Ver bases por domínio
SELECT
    kd.domain,
    kd.neurocore_id,
    COUNT(bc.id) as bases_count
FROM knowledge_domains kd
LEFT JOIN base_conhecimentos bc ON bc.domain = kd.id
GROUP BY kd.domain, kd.neurocore_id
ORDER BY kd.domain;
