-- Diagnóstico: Configuração do Realtime
-- Execute este script no Supabase SQL Editor

-- 1. Verificar se Realtime está habilitado na tabela conversations
SELECT
  schemaname,
  tablename,
  'REPLICA IDENTITY: ' ||
  CASE
    WHEN c.relreplident = 'd' THEN 'DEFAULT (primary key)'
    WHEN c.relreplident = 'n' THEN 'NOTHING (realtime disabled)'
    WHEN c.relreplident = 'f' THEN 'FULL (all columns)'
    WHEN c.relreplident = 'i' THEN 'INDEX'
  END as replica_identity_status
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
  AND tablename IN ('conversations', 'messages')
ORDER BY tablename;

-- 2. Verificar publicação do Realtime
SELECT
  p.pubname,
  p.puballtables,
  p.pubinsert,
  p.pubupdate,
  p.pubdelete
FROM pg_publication p
WHERE p.pubname = 'supabase_realtime';

-- 3. Verificar quais tabelas estão na publicação
SELECT
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN ('conversations', 'messages')
ORDER BY tablename;

-- 4. Verificar RLS policies na tabela conversations
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
WHERE schemaname = 'public'
  AND tablename = 'conversations'
ORDER BY policyname;

-- 5. SOLUÇÃO: Se conversations não estiver enviando UPDATE completo, execute:
-- (Descomente se necessário após diagnóstico)
-- ALTER TABLE conversations REPLICA IDENTITY FULL;
--
-- Isso faz o Realtime enviar TODAS as colunas no payload.new, não apenas as alteradas.
