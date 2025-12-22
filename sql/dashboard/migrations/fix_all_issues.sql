-- Fix All Dashboard Issues
-- Created: 2025-12-20
-- Purpose: 
--   1. Drop old function signatures to fix overloading
--   2. Fix status enum values (pending/in_progress/finalized → open/paused/closed)

-- ============================================================================
-- STEP 1: Drop old function signatures
-- ============================================================================

-- Drop old get_funil_data (3 params)
DROP FUNCTION IF EXISTS get_funil_data(UUID, INTEGER, UUID);

-- Drop old get_tags_data (3 params)
DROP FUNCTION IF EXISTS get_tags_data(UUID, INTEGER, UUID);

-- Drop old get_dashboard_data (just in case)
DROP FUNCTION IF EXISTS get_dashboard_data(UUID, INTEGER, UUID);

-- ============================================================================
-- STEP 2: Recreate get_dashboard_data with CORRECT status values
-- ============================================================================

CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_time_zone TEXT := 'America/Sao_Paulo';
  v_result JSON;
BEGIN
  -- Calculate date range
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;

  WITH

  -- Base conversations
  base_conversations AS (
    SELECT
      c.id,
      c.tenant_id,
      c.contact_id,
      c.channel_id,
      c.status,
      c.ia_active,
      c.created_at,
      c.updated_at,
      c.last_message_at,
      ch.identification_number AS channel_name,
      EXTRACT(EPOCH FROM (c.updated_at - c.created_at))::INTEGER AS duration_seconds
    FROM conversations c
    LEFT JOIN channels ch ON ch.id = c.channel_id
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- STAGE 1: Open & Paused (FIXED: was pending & in_progress)
  stage_new AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COUNT(*) FILTER (WHERE ia_active = FALSE) as without_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration_seconds
    FROM base_conversations
    WHERE status IN ('open', 'paused')  -- FIXED: was 'pending', 'in_progress'
  ),

  -- STAGE 2: Closed (FIXED: was finalized)
  stage_finalized AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COUNT(*) FILTER (WHERE ia_active = FALSE) as without_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration_seconds
    FROM base_conversations
    WHERE status = 'closed'  -- FIXED: was 'finalized'
  ),

  -- Rest of the query remains the same...
  contacts_stats AS (
    SELECT
      COUNT(DISTINCT bc.contact_id) as unique_contacts,
      COUNT(DISTINCT bc.contact_id) FILTER (
        WHERE (
          SELECT COUNT(*)
          FROM conversations prev
          WHERE prev.tenant_id = p_tenant_id
            AND prev.contact_id = bc.contact_id
            AND prev.created_at < v_start_date
        ) = 0
      ) as new_contacts
    FROM base_conversations bc
  ),

  channels_distribution AS (
    SELECT
      COALESCE(bc.channel_name, 'Unknown') as channel_name,
      COUNT(*) as conversation_count,
      ROUND(
        (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM base_conversations), 0) * 100)::NUMERIC,
        1
      ) as percentage
    FROM base_conversations bc
    GROUP BY bc.channel_name
    ORDER BY conversation_count DESC
  ),

  origin_distribution AS (
    SELECT
      CASE
        WHEN ia_active = TRUE THEN 'IA'
        ELSE 'Manual'
      END as origin,
      COUNT(*) as conversation_count,
      ROUND(
        (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM base_conversations), 0) * 100)::NUMERIC,
        1
      ) as percentage
    FROM base_conversations
    GROUP BY ia_active
  ),

  hourly_distribution AS (
    SELECT
      EXTRACT(HOUR FROM created_at AT TIME ZONE v_time_zone)::INTEGER as hour,
      COUNT(*) as conversation_count
    FROM base_conversations
    GROUP BY hour
    ORDER BY hour
  ),

  daily_timeline AS (
    SELECT
      DATE(created_at AT TIME ZONE v_time_zone) as date,
      COUNT(*) as conversation_count,
      COUNT(*) FILTER (WHERE status = 'closed') as finalized_count,  -- FIXED: was 'finalized'
      COUNT(*) FILTER (WHERE status IN ('open', 'paused')) as pending_count  -- FIXED: was 'pending', 'in_progress'
    FROM base_conversations
    GROUP BY date
    ORDER BY date
  ),

  status_distribution AS (
    SELECT
      status,
      COUNT(*) as conversation_count,
      ROUND(
        (COUNT(*)::NUMERIC / NULLIF((SELECT COUNT(*) FROM base_conversations), 0) * 100)::NUMERIC,
        1
      ) as percentage
    FROM base_conversations
    GROUP BY status
  )

  SELECT json_build_object(
    'summary', json_build_object(
      'total_conversations', (SELECT COUNT(*) FROM base_conversations),
      'unique_contacts', (SELECT unique_contacts FROM contacts_stats),
      'new_contacts', (SELECT new_contacts FROM contacts_stats),
      'returning_contacts', (SELECT unique_contacts - new_contacts FROM contacts_stats),
      'avg_duration_seconds', (
        SELECT COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER
        FROM base_conversations
      )
    ),
    'funnel', json_build_object(
      'new', json_build_object(
        'total', (SELECT total FROM stage_new),
        'with_ia', (SELECT with_ia FROM stage_new),
        'without_ia', (SELECT without_ia FROM stage_new),
        'avg_duration_seconds', (SELECT avg_duration_seconds FROM stage_new)
      ),
      'finalized', json_build_object(
        'total', (SELECT total FROM stage_finalized),
        'with_ia', (SELECT with_ia FROM stage_finalized),
        'without_ia', (SELECT without_ia FROM stage_finalized),
        'avg_duration_seconds', (SELECT avg_duration_seconds FROM stage_finalized)
      )
    ),
    'channels_distribution', (
      SELECT COALESCE(json_agg(json_build_object(
        'channel_name', channel_name,
        'conversation_count', conversation_count,
        'percentage', percentage
      )), '[]'::json)
      FROM channels_distribution
    ),
    'origin_distribution', (
      SELECT COALESCE(json_agg(json_build_object(
        'origin', origin,
        'conversation_count', conversation_count,
        'percentage', percentage
      )), '[]'::json)
      FROM origin_distribution
    ),
    'hourly_distribution', (
      SELECT COALESCE(json_agg(json_build_object(
        'hour', hour,
        'conversation_count', conversation_count
      ) ORDER BY hour), '[]'::json)
      FROM hourly_distribution
    ),
    'daily_timeline', (
      SELECT COALESCE(json_agg(json_build_object(
        'date', date,
        'conversation_count', conversation_count,
        'finalized_count', finalized_count,
        'pending_count', pending_count
      ) ORDER BY date), '[]'::json)
      FROM daily_timeline
    ),
    'status_distribution', (
      SELECT COALESCE(json_agg(json_build_object(
        'status', status,
        'conversation_count', conversation_count,
        'percentage', percentage
      )), '[]'::json)
      FROM status_distribution
    ),
    'date_range', json_build_object(
      'start_date', v_start_date,
      'end_date', v_end_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO service_role;

-- ============================================================================
-- STEP 3: Recreate get_funil_data with CORRECT status values (only new signature)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_funil_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_result JSON;
BEGIN
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;

  WITH
  base_conversations AS (
    SELECT
      c.id,
      c.tenant_id,
      c.status,
      c.ia_active,
      c.channel_id,
      c.created_at,
      EXTRACT(EPOCH FROM (c.updated_at - c.created_at))::INTEGER AS duration_seconds
    FROM conversations c
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  stage_open AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0 AND status = 'closed'), 0)::INTEGER as avg_duration
    FROM base_conversations
    WHERE status = 'open'  -- FIXED
  ),

  stage_paused AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration
    FROM base_conversations
    WHERE status = 'paused'  -- FIXED
  ),

  stage_closed AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration
    FROM base_conversations
    WHERE status = 'closed'  -- FIXED
  )

  SELECT json_build_object(
    'stages', json_build_object(
      'open', json_build_object(
        'total', (SELECT total FROM stage_open),
        'with_ia', (SELECT with_ia FROM stage_open),
        'without_ia', (SELECT total - with_ia FROM stage_open),
        'avg_duration_seconds', (SELECT avg_duration FROM stage_open),
        'conversion_rate', NULL
      ),
      'paused', json_build_object(
        'total', (SELECT total FROM stage_paused),
        'with_ia', (SELECT with_ia FROM stage_paused),
        'without_ia', (SELECT total - with_ia FROM stage_paused),
        'avg_duration_seconds', (SELECT avg_duration FROM stage_paused),
        'conversion_rate', CASE 
          WHEN (SELECT total FROM stage_open) > 0 
          THEN ROUND(((SELECT total FROM stage_paused)::NUMERIC / (SELECT total FROM stage_open) * 100), 1)
          ELSE NULL
        END
      ),
      'closed', json_build_object(
        'total', (SELECT total FROM stage_closed),
        'with_ia', (SELECT with_ia FROM stage_closed),
        'without_ia', (SELECT total - with_ia FROM stage_closed),
        'avg_duration_seconds', (SELECT avg_duration FROM stage_closed),
        'conversion_rate', CASE 
          WHEN (SELECT total FROM stage_paused) > 0 
          THEN ROUND(((SELECT total FROM stage_closed)::NUMERIC / (SELECT total FROM stage_paused) * 100), 1)
          ELSE NULL
        END
      )
    ),
    'total_conversations', (SELECT COUNT(*) FROM base_conversations),
    'date_range', json_build_object(
      'start_date', v_start_date,
      'end_date', v_end_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_funil_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_funil_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO service_role;

-- ============================================================================
-- STEP 4: Recreate get_tags_data (only new signature)
-- ============================================================================

CREATE OR REPLACE FUNCTION get_tags_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL,
  p_start_date TIMESTAMP DEFAULT NULL,
  p_end_date TIMESTAMP DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_result JSON;
BEGIN
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;

  WITH
  conversation_tags AS (
    SELECT
      ct.tag_id,
      t.name as tag_name,
      t.color as tag_color,
      COUNT(DISTINCT ct.conversation_id) as conversation_count,
      c.created_at
    FROM conversation_tags ct
    INNER JOIN tags t ON t.id = ct.tag_id
    INNER JOIN conversations c ON c.id = ct.conversation_id
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
    GROUP BY ct.tag_id, t.name, t.color, c.created_at
  ),

  tag_summary AS (
    SELECT
      tag_id,
      tag_name,
      tag_color,
      SUM(conversation_count) as total_conversations,
      ROUND(
        (SUM(conversation_count)::NUMERIC / NULLIF(
          (SELECT COUNT(DISTINCT conversation_id) 
           FROM conversation_tags ct2
           INNER JOIN conversations c2 ON c2.id = ct2.conversation_id
           WHERE c2.tenant_id = p_tenant_id
             AND c2.created_at >= v_start_date
             AND c2.created_at <= v_end_date
             AND (p_channel_id IS NULL OR c2.channel_id = p_channel_id)
          ), 0
        ) * 100), 1
      ) as percentage
    FROM conversation_tags
    GROUP BY tag_id, tag_name, tag_color
    ORDER BY total_conversations DESC
  )

  SELECT json_build_object(
    'tags', COALESCE(
      (SELECT json_agg(json_build_object(
        'tag_id', tag_id,
        'tag_name', tag_name,
        'tag_color', tag_color,
        'conversation_count', total_conversations,
        'percentage', percentage
      ) ORDER BY total_conversations DESC)
      FROM tag_summary), '[]'::json
    ),
    'total_tagged_conversations', (
      SELECT COUNT(DISTINCT conversation_id)
      FROM conversation_tags ct
      INNER JOIN conversations c ON c.id = ct.conversation_id
      WHERE c.tenant_id = p_tenant_id
        AND c.created_at >= v_start_date
        AND c.created_at <= v_end_date
        AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
    ),
    'date_range', json_build_object(
      'start_date', v_start_date,
      'end_date', v_end_date
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql STABLE;

GRANT EXECUTE ON FUNCTION get_tags_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_tags_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO service_role;

