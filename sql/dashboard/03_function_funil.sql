-- Funil Data Function
-- Created: 2025-12-19
-- Updated: 2025-12-31 - Removed 'paused' status, simplified to Open → Closed
-- Purpose: Fetch funnel metrics for conversion analysis (Open → Closed)

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
  -- Calculate date range
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
  -- Filtra por updated_at para capturar conversas com atividade no período
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
      AND c.updated_at >= v_start_date
      AND c.updated_at <= v_end_date
      AND (p_channel_id IS NULL OR c.channel_id = p_channel_id)
  ),

  -- ================================================================
  -- KPIs: Funnel metrics (simplified - only open and closed)
  -- ================================================================
  funnel_kpis AS (
    SELECT
      -- Status breakdown
      COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS "conversationsOpen",
      COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS "conversationsClosed",

      -- IA breakdown (new metrics)
      COUNT(*) FILTER (WHERE status = 'open' AND ia_active = true)::INTEGER AS "conversationsIA",
      COUNT(*) FILTER (WHERE status = 'open' AND ia_active = false)::INTEGER AS "conversationsManual",

      -- Conversion rate (open to closed)
      ROUND(
        (COUNT(*) FILTER (WHERE status = 'closed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        1
      ) AS "conversionRate",

      -- Average time to close (in seconds)
      ROUND(
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) FILTER (WHERE status = 'closed')
      )::INTEGER AS "avgTimeToCloseSeconds"

    FROM base_conversations
  ),

  -- ================================================================
  -- STATUS EVOLUTION: Time series of status over time
  -- ================================================================
  status_evolution AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'date', day::TEXT,
          'open', COALESCE(open_count, 0),
          'closed', COALESCE(closed_count, 0),
          'ia', COALESCE(ia_count, 0),
          'manual', COALESCE(manual_count, 0)
        )
        ORDER BY day
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        DATE(updated_at) AS day,
        COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS open_count,
        COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS closed_count,
        COUNT(*) FILTER (WHERE status = 'open' AND ia_active = true)::INTEGER AS ia_count,
        COUNT(*) FILTER (WHERE status = 'open' AND ia_active = false)::INTEGER AS manual_count
      FROM base_conversations
      GROUP BY DATE(updated_at)
      ORDER BY day
    ) daily_status
  ),

  -- ================================================================
  -- CLOSURE REASONS: Real data from database
  -- ================================================================
  closure_reasons AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'reason', reason,
          'count', count,
          'percentage', ROUND((count::DECIMAL / NULLIF(total, 0)) * 100, 1)
        )
        ORDER BY count DESC
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        COALESCE(r.description, 'Não especificado') AS reason,
        COUNT(*)::INTEGER AS count,
        (SELECT COUNT(*) FROM base_conversations WHERE status = 'closed')::INTEGER AS total
      FROM base_conversations c
      LEFT JOIN conversation_reasons_pauses_and_closures r
        ON r.id = c.conversation_closure_reason_id
        AND r.reason_type = 'closure'
      WHERE c.status = 'closed'
      GROUP BY r.description
      ORDER BY count DESC
      LIMIT 10
    ) reasons
    WHERE total > 0
  )

  -- ================================================================
  -- FINAL RESULT: Combine all sections
  -- ================================================================
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(funnel_kpis.*) FROM funnel_kpis),
    'statusEvolution', (SELECT data FROM status_evolution),
    'closureReasons', (SELECT COALESCE(data, '[]'::json) FROM closure_reasons)
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in get_funil_data: %', SQLERRM;
  RETURN json_build_object(
    'error', SQLERRM,
    'kpis', json_build_object(
      'conversationsOpen', 0,
      'conversationsClosed', 0,
      'conversationsIA', 0,
      'conversationsManual', 0,
      'conversionRate', 0,
      'avgTimeToCloseSeconds', 0
    ),
    'statusEvolution', '[]'::json,
    'closureReasons', '[]'::json
  );
END;
$$ LANGUAGE plpgsql;
