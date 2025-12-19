-- Dashboard Performance Indexes (Simple Version)
-- Created: 2025-12-19
-- Purpose: Optimize dashboard queries for LIVIA MVP
-- NOTE: Version without date filters in WHERE clause (compatible with Supabase)

-- ==================================================
-- CONVERSATIONS TABLE INDEXES
-- ==================================================

-- Main index for tenant + date filtering
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created
  ON conversations(tenant_id, created_at DESC);

-- Channel filtering
CREATE INDEX IF NOT EXISTS idx_conversations_channel_created
  ON conversations(channel_id, created_at DESC);

-- Status filtering (for funnel analysis)
CREATE INDEX IF NOT EXISTS idx_conversations_status
  ON conversations(tenant_id, status, created_at DESC);

-- IA active flag (for AI vs Human analysis)
CREATE INDEX IF NOT EXISTS idx_conversations_ia_active
  ON conversations(tenant_id, ia_active, created_at DESC);

-- Composite index for full filtering
CREATE INDEX IF NOT EXISTS idx_conversations_dashboard
  ON conversations(tenant_id, channel_id, status, created_at DESC);

-- ==================================================
-- MESSAGES TABLE INDEXES
-- ==================================================

-- Conversation + timestamp (for aggregations)
CREATE INDEX IF NOT EXISTS idx_messages_conversation_timestamp
  ON messages(conversation_id, timestamp DESC);

-- Sender type analysis (AI vs Human vs Customer)
CREATE INDEX IF NOT EXISTS idx_messages_sender_type_timestamp
  ON messages(sender_type, timestamp DESC);

-- Composite for first response time calculation
CREATE INDEX IF NOT EXISTS idx_messages_conversation_sender
  ON messages(conversation_id, sender_type, timestamp ASC);

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
-- FEEDBACKS TABLE INDEXES
-- ==================================================

-- Conversation feedback lookup
CREATE INDEX IF NOT EXISTS idx_feedbacks_conversation
  ON feedbacks(conversation_id, created_at DESC);

-- Feedback type for satisfaction analysis
CREATE INDEX IF NOT EXISTS idx_feedbacks_conversation_type
  ON feedbacks(conversation_id, feedback_type, created_at DESC);

-- ==================================================
-- USAGES TABLE INDEXES (Token tracking)
-- ==================================================

-- Conversation usage lookup
CREATE INDEX IF NOT EXISTS idx_usages_conversation
  ON usages(conversation_id);

-- Date for cost analysis
CREATE INDEX IF NOT EXISTS idx_usages_created
  ON usages(created_at DESC);

-- Agent model analysis
CREATE INDEX IF NOT EXISTS idx_usages_agent_model
  ON usages(agent_id, model, created_at DESC);

-- ==================================================
-- CHANNELS & TAGS (for filter dropdowns)
-- ==================================================

-- Active channels only
CREATE INDEX IF NOT EXISTS idx_channels_active
  ON channels(id)
  WHERE active = true;

-- Active tags only
CREATE INDEX IF NOT EXISTS idx_tags_active
  ON tags(id, tag_name)
  WHERE active = true;

-- ==================================================
-- ANALYZE TABLES
-- ==================================================

-- Update table statistics for query planner
ANALYZE conversations;
ANALYZE messages;
ANALYZE conversation_tags;
ANALYZE feedbacks;
ANALYZE usages;
ANALYZE channels;
ANALYZE tags;
