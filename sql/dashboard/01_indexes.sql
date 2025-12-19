-- Dashboard Performance Indexes
-- Created: 2025-12-19
-- Purpose: Optimize dashboard queries for LIVIA MVP

-- ==================================================
-- CONVERSATIONS TABLE INDEXES
-- ==================================================

-- Main index for tenant + date filtering
-- Partial index: only last 90 days (most common use case)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_tenant_created_90d
  ON conversations(tenant_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- Channel filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_channel_created_90d
  ON conversations(channel_id, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- Status filtering (for funnel analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_status
  ON conversations(tenant_id, status, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- IA active flag (for AI vs Human analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_ia_active
  ON conversations(tenant_id, ia_active, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- Composite index for full filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversations_dashboard
  ON conversations(tenant_id, channel_id, status, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- ==================================================
-- MESSAGES TABLE INDEXES
-- ==================================================

-- Conversation + timestamp (for aggregations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_timestamp
  ON messages(conversation_id, timestamp DESC);

-- Sender type analysis (AI vs Human vs Customer)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_sender_type_timestamp
  ON messages(sender_type, timestamp DESC)
  WHERE timestamp >= NOW() - INTERVAL '90 days';

-- Composite for first response time calculation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_messages_conversation_sender
  ON messages(conversation_id, sender_type, timestamp ASC)
  WHERE sender_type IN ('ai', 'attendant');

-- ==================================================
-- CONVERSATION_TAGS TABLE INDEXES
-- ==================================================

-- For tag aggregations
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_tags_conversation
  ON conversation_tags(conversation_id, tag_id);

-- Reverse lookup (tag to conversations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_conversation_tags_tag
  ON conversation_tags(tag_id, conversation_id);

-- ==================================================
-- FEEDBACKS TABLE INDEXES
-- ==================================================

-- Conversation + type (for satisfaction calculation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_conversation_type
  ON feedbacks(conversation_id, feedback_type, created_at DESC);

-- Tenant filtering (if needed in future)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedbacks_tenant
  ON feedbacks(tenant_id, feedback_type, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- ==================================================
-- USAGES TABLE INDEXES (Token tracking)
-- ==================================================

-- Conversation aggregation (for cost calculation)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usages_conversation
  ON usages(id_conversation, created_at DESC);

-- Tenant aggregation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usages_tenant
  ON usages(id_tenant, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- Agent analysis
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_usages_agent
  ON usages(id_agent, id_conversation, created_at DESC)
  WHERE created_at >= NOW() - INTERVAL '90 days';

-- ==================================================
-- CHANNELS TABLE INDEXES
-- ==================================================

-- Tenant lookup (for channel filter options)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_channels_tenant_active
  ON channels(tenant_id, is_active)
  WHERE is_active = true;

-- ==================================================
-- TAGS TABLE INDEXES
-- ==================================================

-- Tenant lookup (for tag filter options)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tags_tenant_active
  ON tags(id_tenant, active)
  WHERE active = true;

-- ==================================================
-- ANALYSIS & STATISTICS
-- ==================================================

-- Analyze tables to update planner statistics
ANALYZE conversations;
ANALYZE messages;
ANALYZE conversation_tags;
ANALYZE feedbacks;
ANALYZE usages;
ANALYZE channels;
ANALYZE tags;

-- ==================================================
-- COMMENTS
-- ==================================================

COMMENT ON INDEX idx_conversations_tenant_created_90d IS
  'Optimizes dashboard queries filtering by tenant and date (last 90 days)';

COMMENT ON INDEX idx_conversations_dashboard IS
  'Composite index for full dashboard filtering (tenant + channel + status + date)';

COMMENT ON INDEX idx_messages_conversation_sender IS
  'Optimizes first response time calculation (first AI/attendant message per conversation)';

COMMENT ON INDEX idx_usages_conversation IS
  'Optimizes token aggregation per conversation for cost calculation';
