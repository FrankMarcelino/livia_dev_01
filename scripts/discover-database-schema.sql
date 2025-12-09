-- =====================================================================
-- SCRIPT DE DISCOVERY COMPLETO DO BANCO DE DADOS
-- Execute este script no Supabase Dashboard > SQL Editor
-- Ele irá mapear TODA a estrutura real do banco
-- =====================================================================

-- =====================================================================
-- 1. LISTAR TODAS AS TABELAS E SUAS COLUNAS
-- =====================================================================
SELECT
    '=== TABELAS E COLUNAS ===' as section,
    null as table_name,
    null as column_name,
    null as data_type,
    null as is_nullable,
    null as column_default,
    null as character_maximum_length
UNION ALL
SELECT
    '' as section,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length::text
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
ORDER BY section DESC, table_name, ordinal_position;

-- =====================================================================
-- 2. LISTAR TODOS OS ENUMS
-- =====================================================================
SELECT
    '=== ENUMS ===' as info,
    t.typname as enum_name,
    string_agg(e.enumlabel, ' | ' ORDER BY e.enumsortorder) as possible_values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;

-- =====================================================================
-- 3. LISTAR TODAS AS FOREIGN KEYS (RELACIONAMENTOS)
-- =====================================================================
SELECT
    '=== FOREIGN KEYS ===' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================================
-- 4. LISTAR TODAS AS POLICIES RLS
-- =====================================================================
SELECT
    '=== RLS POLICIES ===' as info,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    LEFT(qual::text, 100) as condition_preview,
    LEFT(with_check::text, 100) as with_check_preview
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================================
-- 5. VERIFICAR QUAIS TABELAS TÊM RLS HABILITADO
-- =====================================================================
SELECT
    '=== RLS STATUS ===' as info,
    tablename,
    CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
ORDER BY tablename;

-- =====================================================================
-- 6. LISTAR TODOS OS ÍNDICES
-- =====================================================================
SELECT
    '=== INDEXES ===' as info,
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- =====================================================================
-- 7. LISTAR TODAS AS CONSTRAINTS (UNIQUE, CHECK, etc)
-- =====================================================================
SELECT
    '=== CONSTRAINTS ===' as info,
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'public'
    AND tc.constraint_type IN ('UNIQUE', 'CHECK', 'PRIMARY KEY')
ORDER BY tc.table_name, tc.constraint_type, tc.constraint_name;

-- =====================================================================
-- 8. AMOSTRA DE DADOS DE CADA TABELA (1 registro)
-- =====================================================================
-- Esta parte precisa ser executada manualmente para cada tabela
-- ou use o script JavaScript que vou criar a seguir
