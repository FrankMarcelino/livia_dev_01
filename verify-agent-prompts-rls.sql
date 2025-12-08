-- ====================================================================
-- VERIFICAÇÃO: RLS Policies para agent_prompts
-- Execute no Supabase Dashboard > SQL Editor
-- ====================================================================

-- 1. Verificar se RLS está ativo em agent_prompts
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ ATIVO' ELSE '❌ DESATIVADO' END as rls_status
FROM pg_tables
WHERE tablename = 'agent_prompts' 
  AND schemaname = 'public';

-- 2. Listar todas as policies em agent_prompts
SELECT 
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN '✅ Has USING'
    ELSE '❌ No USING'
  END as using_clause,
  CASE 
    WHEN with_check IS NOT NULL THEN '✅ Has WITH CHECK'
    ELSE '❌ No WITH CHECK' 
  END as with_check_clause
FROM pg_policies
WHERE tablename = 'agent_prompts'
ORDER BY cmd, policyname;

-- 3. Verificar se as policies específicas existem
DO $$
DECLARE
  policy_exists BOOLEAN;
BEGIN
  -- Policy de SELECT
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_prompts' 
    AND policyname = 'Tenants can view their own prompts'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Policy SELECT: "Tenants can view their own prompts" existe';
  ELSE
    RAISE NOTICE '❌ Policy SELECT: "Tenants can view their own prompts" NÃO EXISTE';
  END IF;
  
  -- Policy de UPDATE
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_prompts' 
    AND policyname = 'Tenants can update their own prompts'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Policy UPDATE: "Tenants can update their own prompts" existe';
  ELSE
    RAISE NOTICE '❌ Policy UPDATE: "Tenants can update their own prompts" NÃO EXISTE';
  END IF;
  
  -- Policy de INSERT
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_prompts' 
    AND policyname = 'Tenants can insert their own prompts'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Policy INSERT: "Tenants can insert their own prompts" existe';
  ELSE
    RAISE NOTICE '❌ Policy INSERT: "Tenants can insert their own prompts" NÃO EXISTE';
  END IF;
  
  -- Policy de Super Admin
  SELECT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'agent_prompts' 
    AND policyname = 'Super Admins have full access to agent_prompts'
  ) INTO policy_exists;
  
  IF policy_exists THEN
    RAISE NOTICE '✅ Policy ALL (Super Admin): "Super Admins have full access to agent_prompts" existe';
  ELSE
    RAISE NOTICE '❌ Policy ALL (Super Admin): "Super Admins have full access to agent_prompts" NÃO EXISTE';
  END IF;
END $$;

-- 4. Ver detalhes completos das policies
SELECT 
  policyname,
  cmd,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies
WHERE tablename = 'agent_prompts'
ORDER BY cmd, policyname;
