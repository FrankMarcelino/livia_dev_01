-- SOLUÇÃO: Criar agent_prompts para um tenant
-- Execute este SQL substituindo 'SEU_TENANT_ID_AQUI' pelo ID real do tenant

-- PASSO 1: Verificar se o tenant existe
DO $$
DECLARE
    tenant_exists BOOLEAN;
    tenant_name TEXT;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM tenants WHERE id = 'SEU_TENANT_ID_AQUI'::uuid
    ) INTO tenant_exists;

    IF NOT tenant_exists THEN
        RAISE EXCEPTION 'Tenant com ID SEU_TENANT_ID_AQUI não existe!';
    END IF;

    SELECT name INTO tenant_name FROM tenants WHERE id = 'SEU_TENANT_ID_AQUI'::uuid;
    RAISE NOTICE 'Tenant encontrado: %', tenant_name;
END $$;

-- PASSO 2: Verificar quantos prompts base existem
SELECT
    'Prompts base disponíveis' as info,
    COUNT(*) as total
FROM agent_prompts
WHERE id_tenant IS NULL;

-- PASSO 3: Criar prompts para o tenant copiando da configuração base
-- IMPORTANTE: Isto cria UMA cópia dos prompts base para o tenant
INSERT INTO agent_prompts (id_agent, id_tenant, limitations, instructions, guide_line, rules)
SELECT
    ap.id_agent,
    'SEU_TENANT_ID_AQUI'::uuid,  -- <-- SUBSTITUA AQUI
    ap.limitations,
    ap.instructions,
    ap.guide_line,
    ap.rules
FROM agent_prompts ap
WHERE ap.id_tenant IS NULL  -- Somente prompts base
AND NOT EXISTS (
    -- Não criar se já existe
    SELECT 1
    FROM agent_prompts existing
    WHERE existing.id_agent = ap.id_agent
    AND existing.id_tenant = 'SEU_TENANT_ID_AQUI'::uuid  -- <-- SUBSTITUA AQUI
)
RETURNING id, id_agent, id_tenant;

-- PASSO 4: Verificar o resultado
SELECT
    t.name as tenant_name,
    COUNT(ap.id) as total_prompts_criados
FROM tenants t
INNER JOIN agent_prompts ap ON ap.id_tenant = t.id
WHERE t.id = 'SEU_TENANT_ID_AQUI'::uuid  -- <-- SUBSTITUA AQUI
GROUP BY t.name;
