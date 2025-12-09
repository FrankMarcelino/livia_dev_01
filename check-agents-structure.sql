-- Script para descobrir a estrutura REAL da tabela agents em produção
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Ver todas as colunas da tabela agents
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agents'
ORDER BY ordinal_position;

-- 2. Ver as policies RLS ativas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'agents';

-- 3. Verificar se RLS está habilitado
SELECT
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'agents';

-- 4. Buscar um agent de exemplo para ver os dados
SELECT * FROM agents LIMIT 1;
