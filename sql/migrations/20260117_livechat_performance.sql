-- ============================================
-- FASE 0: LIVECHAT PERFORMANCE IMPROVEMENTS
-- Data: 2026-01-17
-- ============================================
--
-- Este script configura:
-- 1. REPLICA IDENTITY FULL para tabelas do realtime
-- 2. Índices de performance para queries do livechat
--
-- IMPORTANTE: Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- FASE 0.1: REPLICA IDENTITY FULL
-- ============================================
-- Por que: Supabase Realtime precisa de REPLICA IDENTITY FULL
-- para retornar todos os campos em eventos UPDATE/DELETE.
-- Sem isso, payload.new pode não ter campos como 'content'.

-- Tabela de mensagens (mais crítica)
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Tabela de conversas
ALTER TABLE conversations REPLICA IDENTITY FULL;

-- Tabela de tags de conversas
ALTER TABLE conversation_tags REPLICA IDENTITY FULL;

-- Tabela de contatos
ALTER TABLE contacts REPLICA IDENTITY FULL;

-- ============================================
-- FASE 0.2: ÍNDICES PARA PERFORMANCE
-- ============================================
-- Por que: Queries do livechat fazem ORDER BY last_message_at
-- e filtros por tenant_id. Sem índice, PostgreSQL faz sequential scan.

-- Índice principal: Listagem de conversas ordenadas
-- Usado em: getConversationsWithContact()
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_last_message
  ON conversations(tenant_id, last_message_at DESC);

-- Índice para mensagens de uma conversa
-- Usado em: getMessages()
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
  ON messages(conversation_id, timestamp DESC);

-- Índice para tags de conversa (JOINs)
-- Usado em: queries com tags
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation
  ON conversation_tags(conversation_id);

-- Índice para contatos por tenant
-- Usado em: listagem de contatos
CREATE INDEX IF NOT EXISTS idx_contacts_tenant_last_interaction
  ON contacts(tenant_id, last_interaction_at DESC);

-- Índice para status de mensagens
-- Usado em: filtros por status
CREATE INDEX IF NOT EXISTS idx_messages_status
  ON messages(status) WHERE status != 'sent';

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Verificar REPLICA IDENTITY
SELECT relname, relreplident
FROM pg_class
WHERE relname IN ('messages', 'conversations', 'conversation_tags', 'contacts');
-- Deve retornar 'f' (full) para todas

-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('conversations', 'messages', 'conversation_tags', 'contacts')
  AND indexname LIKE 'idx_%';
