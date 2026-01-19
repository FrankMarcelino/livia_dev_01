-- ============================================
-- SCRIPT: Verificar e Habilitar Realtime no Supabase
-- Data: 2026-01-19
-- ============================================

-- ============================================
-- PARTE 1: DIAGNÓSTICO - Execute primeiro para ver o status atual
-- ============================================

-- 1.1 Verificar quais tabelas estão na publicação do Realtime
SELECT
  schemaname,
  tablename,
  'HABILITADO' as realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- 1.2 Verificar REPLICA IDENTITY das tabelas do livechat
-- (precisa ser FULL para Realtime funcionar corretamente)
SELECT
  c.relname as tabela,
  CASE c.relreplident
    WHEN 'd' THEN 'DEFAULT (somente PK)'
    WHEN 'n' THEN 'NOTHING'
    WHEN 'f' THEN 'FULL ✅'
    WHEN 'i' THEN 'INDEX'
  END as replica_identity,
  CASE
    WHEN c.relreplident = 'f' THEN '✅ OK'
    ELSE '❌ PRECISA CORRIGIR'
  END as status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relname IN ('messages', 'conversations', 'conversation_tags', 'contacts')
  AND n.nspname = 'public'
ORDER BY c.relname;

-- 1.3 Verificar se as tabelas necessárias estão no Realtime
SELECT
  t.table_name,
  CASE
    WHEN pt.tablename IS NOT NULL THEN '✅ HABILITADO'
    ELSE '❌ NÃO HABILITADO'
  END as realtime_status
FROM information_schema.tables t
LEFT JOIN pg_publication_tables pt
  ON pt.tablename = t.table_name
  AND pt.pubname = 'supabase_realtime'
WHERE t.table_schema = 'public'
  AND t.table_name IN ('messages', 'conversations', 'conversation_tags', 'contacts')
ORDER BY t.table_name;


-- ============================================
-- PARTE 2: CORREÇÃO - Execute SE houver problemas
-- ============================================

-- 2.1 Habilitar Realtime nas tabelas (se não estiver habilitado)
-- DESCOMENTE as linhas abaixo conforme necessário:

-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversation_tags;
-- ALTER PUBLICATION supabase_realtime ADD TABLE contacts;

-- 2.2 Configurar REPLICA IDENTITY FULL (se não estiver configurado)
-- DESCOMENTE as linhas abaixo conforme necessário:

-- ALTER TABLE messages REPLICA IDENTITY FULL;
-- ALTER TABLE conversations REPLICA IDENTITY FULL;
-- ALTER TABLE conversation_tags REPLICA IDENTITY FULL;
-- ALTER TABLE contacts REPLICA IDENTITY FULL;


-- ============================================
-- PARTE 3: VERIFICAÇÃO FINAL - Execute após correções
-- ============================================

-- Verificar se tudo está configurado corretamente
SELECT
  'messages' as tabela,
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN '✅' ELSE '❌' END) as realtime,
  (SELECT CASE WHEN relreplident = 'f' THEN '✅' ELSE '❌' END FROM pg_class WHERE relname = 'messages') as replica_full
UNION ALL
SELECT
  'conversations',
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversations') THEN '✅' ELSE '❌' END),
  (SELECT CASE WHEN relreplident = 'f' THEN '✅' ELSE '❌' END FROM pg_class WHERE relname = 'conversations')
UNION ALL
SELECT
  'conversation_tags',
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'conversation_tags') THEN '✅' ELSE '❌' END),
  (SELECT CASE WHEN relreplident = 'f' THEN '✅' ELSE '❌' END FROM pg_class WHERE relname = 'conversation_tags')
UNION ALL
SELECT
  'contacts',
  (SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'contacts') THEN '✅' ELSE '❌' END),
  (SELECT CASE WHEN relreplident = 'f' THEN '✅' ELSE '❌' END FROM pg_class WHERE relname = 'contacts');
