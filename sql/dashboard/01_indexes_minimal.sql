-- Dashboard Performance Indexes (Minimal Version)
-- Created: 2025-12-19
-- Purpose: Essential indexes for dashboard queries
-- NOTE: Only core indexes on tables we know exist

-- ==================================================
-- CONVERSATIONS TABLE INDEXES
-- ==================================================

-- Main index for tenant + date filtering
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created
  ON conversations(tenant_id, created_at DESC);

-- Status filtering (for funnel analysis)
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations(tenant_id, status, created_at DESC);

-- IA active flag (for AI vs Human analysis)
CREATE INDEX IF NOT EXISTS idx_conversations_ia_active
  ON conversations(tenant_id, ia_active, created_at DESC);

-- ==================================================
-- MESSAGES TABLE INDEXES
-- ==================================================

-- Conversation + timestamp (for aggregations)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
  ON messages(conversation_id, timestamp DESC);

-- Sender type analysis (AI vs Human vs Customer)
CREATE INDEX IF NOT EXISTS idx_messages_sender_type
  ON messages(conversation_id, sender_type, timestamp DESC);

-- ==================================================
-- CONVERSATION_TAGS TABLE INDEXES
-- ==================================================

-- Conversation lookup (for tag filtering)
CREATE INDEX IF NOT EXISTS idx_conversation_tags_conversation
  ON conversation_tags(conversation_id);

-- Tag lookup (for reverse search)
CREATE INDEX IF NOT EXISTS idx_conversation_tags_tag
  ON conversation_tags(tag_id);

-- ==================================================
-- ANALYZE TABLES
-- ==================================================

-- Update table statistics for query planner
ANALYZE conversations;
ANALYZE messages;
ANALYZE conversation_tags;
