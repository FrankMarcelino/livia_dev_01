-- Fix Function Overloading Issue
-- Created: 2025-12-20
-- Purpose: Remove old get_dashboard_data function signatures to avoid ambiguity

-- Drop all existing versions of get_dashboard_data
DROP FUNCTION IF EXISTS get_dashboard_data(UUID, INTEGER, UUID);
DROP FUNCTION IF EXISTS get_dashboard_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP);

-- Now recreate only the new version with all parameters
-- (Copy from 02_function_get_dashboard_data.sql)
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
  -- If custom date range is provided, use it; otherwise use days_ago
  IF p_start_date IS NOT NULL AND p_end_date IS NOT NULL THEN
    v_start_date := p_start_date;
    v_end_date := p_end_date;
  ELSE
    v_end_date := CURRENT_TIMESTAMP;
    v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;
  END IF;

  WITH

  -- ================================================================
  -- BASE DATA: Conversations with all needed joins
  -- ================================================================
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
      -- Calculate duration (created → updated)
      EXTRACT(EPOCH FROM (c.updated_at - c.created_at))::INTEGER AS duration_seconds
    FROM conversations c
    LEFT JOIN channels ch ON ch.id = c.channel_id
    WHERE c.tenant_id = p_tenant_id
      AND c.created_at >= v_start_date
      AND c.created_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- ================================================================
  -- STAGE 1: Pending & In-Progress (new + human handling)
  -- ================================================================
  stage_new AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COUNT(*) FILTER (WHERE ia_active = FALSE) as without_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration_seconds
    FROM base_conversations
    WHERE status IN ('pending', 'in_progress')
  ),

  -- ================================================================
  -- STAGE 2: Finalized
  -- ================================================================
  stage_finalized AS (
    SELECT
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE ia_active = TRUE) as with_ia,
      COUNT(*) FILTER (WHERE ia_active = FALSE) as without_ia,
      COALESCE(AVG(duration_seconds) FILTER (WHERE duration_seconds > 0), 0)::INTEGER as avg_duration_seconds
    FROM base_conversations
    WHERE status = 'finalized'
  ),

  -- ================================================================
  -- CONTACTS STATS (unique contacts, new vs returning)
  -- ================================================================
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

  -- ================================================================
  -- CHANNELS DISTRIBUTION
  -- ================================================================
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

  -- ================================================================
  -- ORIGIN DISTRIBUTION (IA vs Manual)
  -- ================================================================
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

  -- ================================================================
  -- HOURLY DISTRIBUTION (24-hour breakdown)
  -- ================================================================
  hourly_distribution AS (
    SELECT
      EXTRACT(HOUR FROM created_at AT TIME ZONE v_time_zone)::INTEGER as hour,
      COUNT(*) as conversation_count
    FROM base_conversations
    GROUP BY hour
    ORDER BY hour
  ),

  -- ================================================================
  -- DAILY TIMELINE (grouped by day)
  -- ================================================================
  daily_timeline AS (
    SELECT
      DATE(created_at AT TIME ZONE v_time_zone) as date,
      COUNT(*) as conversation_count,
      COUNT(*) FILTER (WHERE status = 'finalized') as finalized_count,
      COUNT(*) FILTER (WHERE status IN ('pending', 'in_progress')) as pending_count
    FROM base_conversations
    GROUP BY date
    ORDER BY date
  ),

  -- ================================================================
  -- STATUS DISTRIBUTION (detailed breakdown)
  -- ================================================================
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

  -- ================================================================
  -- FINAL JSON ASSEMBLY
  -- ================================================================
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO authenticated;
GRANT EXECUTE ON FUNCTION get_dashboard_data(UUID, INTEGER, UUID, TIMESTAMP, TIMESTAMP) TO service_role;





