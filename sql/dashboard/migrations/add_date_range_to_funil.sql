-- Migration: Add Custom Date Range Support to get_funil_data
-- Created: 2025-12-20
-- Purpose: Update function to accept p_start_date and p_end_date parameters
--
-- INSTRUCTIONS:
-- 1. Backup current function: pg_dump or copy SQL to backup file
-- 2. Execute this migration in Supabase SQL Editor
-- 3. Test with both old (days_ago) and new (date range) calls
-- 4. Monitor performance with large date ranges

-- ================================================================
-- UPDATED FUNCTION: get_funil_data
-- ================================================================

CREATE OR REPLACE FUNCTION get_funil_data(
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
  -- KPIs: Funnel metrics
  -- (No changes needed)
  -- ================================================================
  funnel_kpis AS (
    SELECT
      -- Status breakdown
      COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS "conversationsOpen",
      COUNT(*) FILTER (WHERE status = 'paused')::INTEGER AS "conversationsPaused",
      COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS "conversationsClosed",
      
      -- Conversion rate (open to closed)
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'closed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        1
      ) AS "conversionRate",
      
      -- Average time to pause (in seconds)
      ROUND(
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'paused')
      )::INTEGER AS "avgTimeToPauseSeconds",
      
      -- Average time to close (in seconds)
      ROUND(
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'closed')
      )::INTEGER AS "avgTimeToCloseSeconds"
      
    FROM base_conversations
  ),

  -- ================================================================
  -- STATUS EVOLUTION: Time series of status over time
  -- (No changes needed)
  -- ================================================================
  status_evolution AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'date', day::TEXT,
          'open', COALESCE(open_count, 0),
          'paused', COALESCE(paused_count, 0),
          'closed', COALESCE(closed_count, 0)
        )
        ORDER BY day
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        DATE(created_at) AS day,
        COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS open_count,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER AS paused_count,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS closed_count
      FROM base_conversations
      GROUP BY DATE(created_at)
      ORDER BY day
    ) daily_status
  ),

  -- ================================================================
  -- PAUSE REASONS: Mock data for MVP
  -- Note: Replace with actual data when reason field is available
  -- (No changes needed)
  -- ================================================================
  pause_reasons AS (
    SELECT json_agg(
      json_build_object(
        'reason', reason,
        'count', count,
        'percentage', ROUND((count::DECIMAL / NULLIF(total, 0)) * 100, 1)
      )
      ORDER BY count DESC
    ) AS data
    FROM (
      SELECT
        'Aguardando resposta do cliente' AS reason,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER AS count,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER AS total
      FROM base_conversations
      UNION ALL
      SELECT
        'Aguardando informações internas',
        ROUND(COUNT(*) FILTER (WHERE status = 'paused') * 0.3)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Aguardando aprovação',
        ROUND(COUNT(*) FILTER (WHERE status = 'paused') * 0.2)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Cliente solicitou pausa',
        ROUND(COUNT(*) FILTER (WHERE status = 'paused') * 0.15)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Fora do horário',
        ROUND(COUNT(*) FILTER (WHERE status = 'paused') * 0.10)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'paused')::INTEGER
      FROM base_conversations
    ) reasons
    WHERE count > 0
    LIMIT 10
  ),

  -- ================================================================
  -- CLOSURE REASONS: Mock data for MVP
  -- Note: Replace with actual data when reason field is available
  -- (No changes needed)
  -- ================================================================
  closure_reasons AS (
    SELECT json_agg(
      json_build_object(
        'reason', reason,
        'count', count,
        'percentage', ROUND((count::DECIMAL / NULLIF(total, 0)) * 100, 1)
      )
      ORDER BY count DESC
    ) AS data
    FROM (
      SELECT
        'Problema resolvido' AS reason,
        ROUND(COUNT(*) FILTER (WHERE status = 'closed') * 0.5)::INTEGER AS count,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS total
      FROM base_conversations
      UNION ALL
      SELECT
        'Cliente não respondeu',
        ROUND(COUNT(*) FILTER (WHERE status = 'closed') * 0.2)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Resolvido pela IA',
        ROUND(COUNT(*) FILTER (WHERE status = 'closed') * 0.15)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Cliente satisfeito',
        ROUND(COUNT(*) FILTER (WHERE status = 'closed') * 0.10)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER
      FROM base_conversations
      UNION ALL
      SELECT
        'Transferido para outro canal',
        ROUND(COUNT(*) FILTER (WHERE status = 'closed') * 0.05)::INTEGER,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER
      FROM base_conversations
    ) reasons
    WHERE count > 0
    LIMIT 10
  ),

  -- ================================================================
  -- REACTIVATION RATE: Conversations reopened after pause
  -- Note: This is a simplified calculation for MVP
  -- (No changes needed)
  -- ================================================================
  reactivation_rate AS (
    SELECT COALESCE(
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'open' AND updated_at > created_at + INTERVAL '1 hour')::DECIMAL 
         / NULLIF(COUNT(*) FILTER (WHERE status = 'paused'), 0)) * 100,
        1
      ),
      0
    ) AS rate
    FROM base_conversations
  )

  -- ================================================================
  -- FINAL RESULT: Combine all sections
  -- (No changes needed)
  -- ================================================================
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(funnel_kpis.*) FROM funnel_kpis),
    'statusEvolution', (SELECT data FROM status_evolution),
    'pauseReasons', (SELECT COALESCE(data, '[]'::json) FROM pause_reasons),
    'closureReasons', (SELECT COALESCE(data, '[]'::json) FROM closure_reasons),
    'reactivationRate', (SELECT rate FROM reactivation_rate)
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in get_funil_data: %', SQLERRM;
  RETURN json_build_object(
    'error', SQLERRM,
    'kpis', json_build_object(
      'conversationsOpen', 0,
      'conversationsPaused', 0,
      'conversationsClosed', 0,
      'conversionRate', 0,
      'avgTimeToPauseSeconds', 0,
      'avgTimeToCloseSeconds', 0
    ),
    'statusEvolution', '[]'::json,
    'pauseReasons', '[]'::json,
    'closureReasons', '[]'::json,
    'reactivationRate', 0
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
-- SELECT get_funil_data(
--   'your-tenant-id'::UUID,
--   30,
--   NULL
-- );
-- 
-- Test 2: New behavior (custom date range)
-- SELECT get_funil_data(
--   'your-tenant-id'::UUID,
--   30,
--   NULL,
--   '2024-01-01 00:00:00'::TIMESTAMP,
--   '2024-01-31 23:59:59'::TIMESTAMP
-- );
-- 
-- Test 3: Performance check with EXPLAIN ANALYZE
-- EXPLAIN ANALYZE
-- SELECT get_funil_data(
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
-- DROP FUNCTION get_funil_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP);
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
--   CREATE INDEX idx_conversations_channel_created ON conversations(channel_id, created_at);

-- VALIDATION CHECKLIST:
-- [ ] Function executes without errors
-- [ ] Old calls (days_ago only) return expected data
-- [ ] New calls (with date range) return expected data
-- [ ] KPIs are correct for both modes
-- [ ] Performance is acceptable (< 5s for 90 days)
-- [ ] No errors in application logs

