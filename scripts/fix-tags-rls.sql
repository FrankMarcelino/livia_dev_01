-- =====================================================================
-- FIX: Corrigir RLS policies para tags e conversation_tags
-- =====================================================================
--
-- Problema: A tabela 'tags' não tem policy RLS, impedindo que usuários
-- autenticados vejam as tags através de JOINs.
--
-- Execute este script no Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Habilitar RLS nas tabelas (se ainda não estiver)
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;

-- 2. Remover policies antigas (se existirem)
DROP POLICY IF EXISTS "Tenants can view their tags" ON tags;
DROP POLICY IF EXISTS "Tenants can view their tags" ON conversation_tags;
DROP POLICY IF EXISTS "Users can view conversation_tags" ON conversation_tags;

-- 3. Criar policy para tags
-- Permite que usuários vejam tags do seu tenant
CREATE POLICY "Tenants can view their tags"
  ON tags FOR SELECT
  USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- 4. Criar policy para conversation_tags
-- Permite que usuários vejam conversation_tags que referenciam tags do seu tenant
CREATE POLICY "Users can view conversation_tags"
  ON conversation_tags FOR SELECT
  USING (
    tag_id IN (
      SELECT id FROM tags
      WHERE id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  );

-- 5. Verificar se as policies foram criadas
SELECT
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('tags', 'conversation_tags')
ORDER BY tablename, policyname;
