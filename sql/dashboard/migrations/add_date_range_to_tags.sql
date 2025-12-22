-- Migration: Add Custom Date Range Support to get_tags_data
-- Created: 2025-12-20
-- Purpose: Update function to accept p_start_date and p_end_date parameters
--
-- INSTRUCTIONS:
-- 1. Backup current function: pg_dump or copy SQL to backup file
-- 2. Execute this migration in Supabase SQL Editor
-- 3. Test with both old (days_ago) and new (date range) calls
-- 4. Monitor performance with large date ranges

-- ================================================================
-- UPDATED FUNCTION: get_tags_data
-- ================================================================

CREATE OR REPLACE FUNCTION get_tags_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,  -- ✨ NEW: Custom start date
  p_end_date TIMESTAMP DEFAULT NULL     -- ✨ NEW: Custom end date
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_result JSON;
BEGIN
  -- ================================================================
  -- UPDATED: Calculate date range with custom date support
  -- If custom date range is provided, use it; otherwise use days_ago
  -- ================================================================
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;

  WITH

  -- ================================================================
  -- BASE DATA: Conversations
  -- (No changes needed - already uses v_start_date and v_end_date)
  -- ================================================================
  base_conversations AS (
    SELECT
      c.id,
      c.tenant_id,
      c.status,
      c.ia_active,
      c.created_at,
      c.updated_at
    FROM conversations c
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- ================================================================
  -- MESSAGES: Aggregated per conversation
  -- (No changes needed)
  -- ================================================================
  messages_agg AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS total_messages,
      MIN(m.timestamp) FILTER (WHERE m.sender_type IN ('ai', 'attendant')) AS first_response_timestamp
    FROM messages m
    WHERE EXISTS (
      SELECT 1 FROM base_conversations bc WHERE bc.id = m.conversation_id
    )
    GROUP BY m.conversation_id
  ),

  -- ================================================================
  -- ENRICHED: Combine conversations with messages
  -- (No changes needed)
  -- ================================================================
  enriched_conversations AS (
    SELECT
      bc.*,
      COALESCE(ma.total_messages, 0) AS total_messages,
      CASE
        WHEN ma.first_response_timestamp IS NOT NULL AND bc.created_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (ma.first_response_timestamp - bc.created_at))::INTEGER
        ELSE NULL
      END AS first_response_time_seconds
    FROM base_conversations bc
    LEFT JOIN messages_agg ma ON ma.conversation_id = bc.id
  ),

  -- ================================================================
  -- ALL TAGS: Get all tags for the tenant
  -- (No changes needed)
  -- ================================================================
  all_tags AS (
    SELECT
      t.id,
      t.tag_name,
      t.created_at
    FROM tags t
    WHERE t.id_tenant = p_tenant_id
  ),

  -- ================================================================
  -- KPIs: Tags metrics
  -- (No changes needed)
  -- ================================================================
  tags_kpis AS (
    SELECT
      -- Total active tags
      (SELECT COUNT(*)::INTEGER FROM all_tags) AS "totalActiveTags",
      
      -- Conversations with tags
      COUNT(DISTINCT ec.id) FILTER (
        WHERE EXISTS (
          SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = ec.id
        )
      )::INTEGER AS "conversationsWithTags",
      
      -- Conversations without tags
      COUNT(DISTINCT ec.id) FILTER (
        WHERE NOT EXISTS (
          SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = ec.id
        )
      )::INTEGER AS "conversationsWithoutTags",
      
      -- Categorization rate
      ROUND(
        (COUNT(DISTINCT ec.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = ec.id)
        )::DECIMAL / NULLIF(COUNT(DISTINCT ec.id), 0)) * 100,
        1
      ) AS "categorizationRate"
      
    FROM enriched_conversations ec
  ),

  -- ================================================================
  -- TOP TAGS: Most used tags with counts
  -- (No changes needed)
  -- ================================================================
  top_tags AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagName', tag_name,
          'count', tag_count,
          'percentage', ROUND((tag_count::DECIMAL / NULLIF(total_conversations, 0)) * 100, 1)
        )
        ORDER BY tag_count DESC
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        t.tag_name,
        COUNT(DISTINCT ct.conversation_id)::INTEGER AS tag_count,
        (SELECT COUNT(DISTINCT id) FROM base_conversations)::INTEGER AS total_conversations
      FROM conversation_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      WHERE EXISTS (
        SELECT 1 FROM base_conversations bc WHERE bc.id = ct.conversation_id
      )
      AND t.id_tenant = p_tenant_id
      GROUP BY t.tag_name
      ORDER BY tag_count DESC
      LIMIT 10
    ) top_tags_data
  ),

  -- ================================================================
  -- TAGS EVOLUTION: Tag usage over time
  -- (No changes needed)
  -- ================================================================
  tags_evolution AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'date', day::TEXT,
          'withTags', COALESCE(with_tags_count, 0),
          'withoutTags', COALESCE(without_tags_count, 0)
        )
        ORDER BY day
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        DATE(bc.created_at) AS day,
        COUNT(DISTINCT bc.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = bc.id)
        )::INTEGER AS with_tags_count,
        COUNT(DISTINCT bc.id) FILTER (
          WHERE NOT EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = bc.id)
        )::INTEGER AS without_tags_count
      FROM base_conversations bc
      GROUP BY DATE(bc.created_at)
      ORDER BY day
    ) daily_tags
  ),

  -- ================================================================
  -- TAGS BY STATUS: Tag distribution across conversation statuses
  -- (No changes needed)
  -- ================================================================
  tags_by_status AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'status', status,
          'withTags', with_tags,
          'withoutTags', without_tags,
          'categorizationRate', categorization_rate
        )
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        bc.status,
        COUNT(DISTINCT bc.id) FILTER (
          WHERE EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = bc.id)
        )::INTEGER AS with_tags,
        COUNT(DISTINCT bc.id) FILTER (
          WHERE NOT EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = bc.id)
        )::INTEGER AS without_tags,
        ROUND(
          (COUNT(DISTINCT bc.id) FILTER (
            WHERE EXISTS (SELECT 1 FROM conversation_tags ct WHERE ct.conversation_id = bc.id)
          )::DECIMAL / NULLIF(COUNT(DISTINCT bc.id), 0)) * 100,
          1
        ) AS categorization_rate
      FROM base_conversations bc
      GROUP BY bc.status
    ) status_tags
  ),

  -- ================================================================
  -- AVG TAGS PER CONVERSATION: Average number of tags
  -- (No changes needed)
  -- ================================================================
  avg_tags_per_conversation AS (
    SELECT COALESCE(
      ROUND(
        AVG(tag_count)::NUMERIC,
        1
      ),
      0
    ) AS avg_tags
    FROM (
      SELECT
        bc.id,
        COUNT(ct.tag_id)::INTEGER AS tag_count
      FROM base_conversations bc
      LEFT JOIN conversation_tags ct ON ct.conversation_id = bc.id
      GROUP BY bc.id
    ) conversation_tag_counts
  )

  -- ================================================================
  -- FINAL RESULT: Combine all sections
  -- (No changes needed)
  -- ================================================================
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(tags_kpis.*) FROM tags_kpis),
    'topTags', (SELECT data FROM top_tags),
    'tagsEvolution', (SELECT data FROM tags_evolution),
    'tagsByStatus', (SELECT data FROM tags_by_status),
    'avgTagsPerConversation', (SELECT avg_tags FROM avg_tags_per_conversation)
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in get_tags_data: %', SQLERRM;
  RETURN json_build_object(
    'error', SQLERRM,
    'kpis', json_build_object(
      'totalActiveTags', 0,
      'conversationsWithTags', 0,
      'conversationsWithoutTags', 0,
      'categorizationRate', 0
    ),
    'topTags', '[]'::json,
    'tagsEvolution', '[]'::json,
    'tagsByStatus', '[]'::json,
    'avgTagsPerConversation', 0
  );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- MIGRATION COMPLETED
-- ================================================================
-- 
-- To test this function, replace 'your-tenant-id' with your actual tenant UUID:
-- 
-- Test 1: Old behavior (days_ago) - should still work
-- SELECT get_tags_data(
--   'your-tenant-id'::UUID,
--   30,
--   NULL
-- );
-- 
-- Test 2: New behavior (custom date range)
-- SELECT get_tags_data(
--   'your-tenant-id'::UUID,
--   30,
--   NULL,
--   '2024-01-01 00:00:00'::TIMESTAMP,
--   '2024-01-31 23:59:59'::TIMESTAMP
-- );
-- 
-- Test 3: Performance check with EXPLAIN ANALYZE
-- EXPLAIN ANALYZE
-- SELECT get_tags_data(
--   'your-tenant-id'::UUID,
--   30,
--   NULL,
--   '2024-01-01 00:00:00'::TIMESTAMP,
--   '2024-03-31 23:59:59'::TIMESTAMP
-- );

-- ================================================================
-- ROLLBACK (if needed)
-- ================================================================

-- To rollback, restore from backup or use original function SQL
-- DROP FUNCTION get_tags_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP);
-- Then execute original function SQL

-- ================================================================
-- NOTES
-- ================================================================

-- CHANGES SUMMARY:
-- 1. Added p_start_date and p_end_date parameters (DEFAULT NULL for backwards compatibility)
-- 2. Updated date range calculation logic with IF condition
-- 3. All CTEs remain unchanged (already used v_start_date and v_end_date)
-- 4. No schema changes needed
-- 5. Fully backwards compatible (old calls still work)

-- BACKWARDS COMPATIBILITY:
-- ✅ Old calls without date params → uses days_ago (unchanged behavior)
-- ✅ New calls with date params → uses custom date range (new behavior)

-- PERFORMANCE CONSIDERATIONS:
-- - Monitor query performance with large date ranges (90+ days)
-- - Consider adding indexes if needed:
--   CREATE INDEX idx_conversations_tenant_created ON conversations(tenant_id, created_at);
--   CREATE INDEX idx_conversation_tags_conversation ON conversation_tags(conversation_id);
--   CREATE INDEX idx_tags_tenant ON tags(id_tenant);

-- VALIDATION CHECKLIST:
-- [ ] Function executes without errors
-- [ ] Old calls (days_ago only) return expected data
-- [ ] New calls (with date range) return expected data
-- [ ] KPIs are correct for both modes
-- [ ] Top tags list is accurate
-- [ ] Performance is acceptable (< 5s for 90 days)
-- [ ] No errors in application logs

