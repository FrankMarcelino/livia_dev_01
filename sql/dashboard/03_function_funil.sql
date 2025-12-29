-- Funil Data Function
-- Created: 2025-12-19
-- Purpose: Fetch funnel metrics for conversion analysis (Open → Paused → Closed)

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






