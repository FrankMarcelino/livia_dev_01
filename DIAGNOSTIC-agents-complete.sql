-- ====================================================================
-- DIAGNÓSTICO COMPLETO: Meus Agentes IA
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- ====================================================================
-- PARTE 1: ESTRUTURA DAS TABELAS
-- ====================================================================

-- 1.1 Estrutura da tabela agents
SELECT '=== ESTRUTURA: agents ===' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'agents'
ORDER BY ordinal_position;

-- 1.2 Estrutura da tabela agent_prompts
SELECT '=== ESTRUTURA: agent_prompts ===' as section;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'agent_prompts'
ORDER BY ordinal_position;

-- ====================================================================
-- PARTE 2: CONTAGEM DE DADOS
-- ====================================================================

SELECT '=== CONTAGENS ===' as section;

SELECT 'Total de agents' as metric, COUNT(*) as count FROM agents
UNION ALL
SELECT 'Total de agent_prompts', COUNT(*) FROM agent_prompts
UNION ALL
SELECT 'Prompts base (id_tenant NULL)', COUNT(*) FROM agent_prompts WHERE id_tenant IS NULL
UNION ALL
SELECT 'Prompts de tenants', COUNT(*) FROM agent_prompts WHERE id_tenant IS NOT NULL
UNION ALL
SELECT 'Agents sem prompts', COUNT(*) FROM agents a LEFT JOIN agent_prompts ap ON ap.id_agent = a.id WHERE ap.id IS NULL;

-- ====================================================================
-- PARTE 3: VERIFICAR RLS POLICIES
-- ====================================================================

SELECT '=== RLS POLICIES ===' as section;

SELECT tablename, policyname, cmd,
       CASE WHEN qual IS NOT NULL THEN 'Has USING' ELSE 'No USING' END as using_clause
FROM pg_policies
WHERE tablename IN ('agents', 'agent_prompts')
ORDER BY tablename, policyname;

-- ====================================================================
-- PARTE 4: VERIFICAR TENANTS E SEUS PROMPTS
-- ====================================================================

SELECT '=== TENANTS E PROMPTS ===' as section;

SELECT
    t.name as tenant_name,
    t.id as tenant_id,
    COUNT(ap.id) as total_prompts
FROM tenants t
LEFT JOIN agent_prompts ap ON ap.id_tenant = t.id
GROUP BY t.id, t.name
ORDER BY t.name
LIMIT 10;

-- ====================================================================
-- PARTE 5: SAMPLE DE DADOS
-- ====================================================================

SELECT '=== SAMPLE: agents (primeiros 3) ===' as section;
-- Usando apenas colunas que com certeza existem
SELECT id, name, created_at
FROM agents
ORDER BY name
LIMIT 3;

SELECT '=== SAMPLE: agent_prompts (primeiros 3) ===' as section;
SELECT id, id_agent, id_tenant,
       CASE WHEN limitations IS NOT NULL THEN 'yes' ELSE 'no' END as has_limitations,
       CASE WHEN instructions IS NOT NULL THEN 'yes' ELSE 'no' END as has_instructions,
       CASE WHEN guide_line IS NOT NULL THEN 'yes' ELSE 'no' END as has_guideline
FROM agent_prompts
ORDER BY created_at DESC
LIMIT 3;

-- ====================================================================
-- PARTE 6: TESTE DE JOIN (simula query do app)
-- ====================================================================

SELECT '=== TESTE DE JOIN (agents + prompts) ===' as section;

-- Simula a query que o app faz
SELECT
    a.id,
    a.name,
    COUNT(ap.id) as prompts_count
FROM agents a
LEFT JOIN agent_prompts ap ON ap.id_agent = a.id AND ap.id_tenant IS NOT NULL
GROUP BY a.id, a.name
ORDER BY a.name
LIMIT 5;

-- ====================================================================
-- DIAGNÓSTICO: O que pode estar errado?
-- ====================================================================

SELECT '=== DIAGNÓSTICO ===' as section;

SELECT
    CASE
        WHEN (SELECT COUNT(*) FROM agents) = 0 THEN '❌ Nenhum agent cadastrado'
        ELSE '✓ Agents existem: ' || (SELECT COUNT(*)::text FROM agents)
    END as check_1,
    CASE
        WHEN (SELECT COUNT(*) FROM agent_prompts WHERE id_tenant IS NULL) = 0 THEN '❌ Nenhum prompt base (id_tenant NULL)'
        ELSE '✓ Prompts base existem: ' || (SELECT COUNT(*)::text FROM agent_prompts WHERE id_tenant IS NULL)
    END as check_2,
    CASE
        WHEN NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents') THEN '❌ SEM RLS policies em agents'
        ELSE '✓ RLS policies existem em agents: ' || (SELECT COUNT(*)::text FROM pg_policies WHERE tablename = 'agents')
    END as check_3,
    CASE
        WHEN (SELECT COUNT(*) FROM agent_prompts WHERE id_tenant IS NOT NULL) = 0 THEN '⚠️ Nenhum tenant tem prompts personalizados ainda'
        ELSE '✓ Tenants com prompts: ' || (SELECT COUNT(DISTINCT id_tenant)::text FROM agent_prompts WHERE id_tenant IS NOT NULL)
    END as check_4;
