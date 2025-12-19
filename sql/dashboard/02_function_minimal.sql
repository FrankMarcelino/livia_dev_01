-- Dashboard Data Function (Minimal Version)
-- Created: 2025-12-19
-- Purpose: Fetch dashboard metrics from core tables only

CREATE OR REPLACE FUNCTION get_dashboard_data(
  p_tenant_id UUID,
  p_days_ago INTEGER DEFAULT 30,
  p_channel_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_start_date TIMESTAMP;
  v_end_date TIMESTAMP;
  v_result JSON;
BEGIN
  -- Calculate date range
  v_end_date := CURRENT_TIMESTAMP;
  v_start_date := v_end_date - (p_days_ago || ' days')::INTERVAL;

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
  -- MESSAGES: Aggregated per conversation
  -- ================================================================
  messages_agg AS (
    SELECT
      m.conversation_id,
      COUNT(*) AS total_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'ai') AS ai_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'attendant') AS human_messages,
      COUNT(*) FILTER (WHERE m.sender_type = 'customer') AS customer_messages,
      MIN(m.timestamp) FILTER (WHERE m.sender_type IN ('ai', 'attendant')) AS first_response_timestamp
    FROM messages m
    WHERE EXISTS (
      SELECT 1 FROM base_conversations bc WHERE bc.id = m.conversation_id
    )
    GROUP BY m.conversation_id
  ),

  -- ================================================================
  -- ENRICHED: Combine conversations with messages
  -- ================================================================
  enriched_conversations AS (
    SELECT
      bc.*,
      COALESCE(ma.total_messages, 0) AS total_messages,
      COALESCE(ma.ai_messages, 0) AS ai_messages,
      COALESCE(ma.human_messages, 0) AS human_messages,
      COALESCE(ma.customer_messages, 0) AS customer_messages,
      CASE
        WHEN ma.first_response_timestamp IS NOT NULL AND bc.created_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (ma.first_response_timestamp - bc.created_at))::INTEGER
        ELSE NULL
      END AS first_response_time_seconds
    FROM base_conversations bc
    LEFT JOIN messages_agg ma ON ma.conversation_id = bc.id
  ),

  -- ================================================================
  -- KPIs: Calculate all metrics
  -- ================================================================
  kpis AS (
    SELECT
      -- Volume metrics
      COUNT(*)::INTEGER AS "totalConversations",
      SUM(total_messages)::INTEGER AS "totalMessages",
      ROUND(AVG(total_messages), 1) AS "avgMessagesPerConversation",
      COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS "activeConversations",

      -- Status breakdown
      COUNT(*) FILTER (WHERE status = 'open')::INTEGER AS "conversationsOpen",
      COUNT(*) FILTER (WHERE status = 'paused')::INTEGER AS "conversationsPaused",
      COUNT(*) FILTER (WHERE status = 'closed')::INTEGER AS "conversationsClosed",

      -- AI vs Human
      COUNT(*) FILTER (WHERE ia_active = true)::INTEGER AS "conversationsWithAi",
      COUNT(*) FILTER (WHERE ia_active = false OR ia_active IS NULL)::INTEGER AS "conversationsHumanOnly",
      ROUND(
        (COUNT(*) FILTER (WHERE ia_active = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
        1
      ) AS "aiPercentage",

      -- Quality metrics (placeholder - no feedbacks table)
      0::INTEGER AS "totalFeedbacks",
      0::INTEGER AS "positiveFeedbacks",
      0::INTEGER AS "negativeFeedbacks",
      0::DECIMAL AS "satisfactionRate",

      -- Efficiency metrics
      ROUND(AVG(first_response_time_seconds))::INTEGER AS "avgFirstResponseTimeSeconds",
      NULL::INTEGER AS "avgResolutionTimeSeconds",

      -- Cost metrics (placeholder - no usages table)
      0::BIGINT AS "totalTokens",
      0::BIGINT AS "totalInputTokens",
      0::BIGINT AS "totalOutputTokens",
      0::DECIMAL AS "estimatedCostUsd",

      -- Peak day
      (
        SELECT json_build_object(
          'date', peak_date::TEXT,
          'count', peak_count
        )
        FROM (
          SELECT
            DATE(created_at) AS peak_date,
            COUNT(*) AS peak_count
          FROM enriched_conversations
          GROUP BY DATE(created_at)
          ORDER BY peak_count DESC
          LIMIT 1
        ) peak
      ) AS "peakDay"

    FROM enriched_conversations
  ),

  -- ================================================================
  -- DAILY CONVERSATIONS: Time series data
  -- ================================================================
  daily_conversations AS (
    SELECT json_agg(
      json_build_object(
        'date', day::TEXT,
        'total', COALESCE(total, 0),
        'avgMessages', COALESCE(avg_messages, 0),
        'withAI', COALESCE(with_ai, 0),
        'humanOnly', COALESCE(human_only, 0)
      )
      ORDER BY day
    ) AS data
    FROM (
      SELECT
        DATE(created_at) AS day,
        COUNT(*)::INTEGER AS total,
        ROUND(AVG(total_messages), 1) AS avg_messages,
        COUNT(*) FILTER (WHERE ia_active = true)::INTEGER AS with_ai,
        COUNT(*) FILTER (WHERE ia_active = false OR ia_active IS NULL)::INTEGER AS human_only
      FROM enriched_conversations
      GROUP BY DATE(created_at)
      ORDER BY day
    ) daily
  ),

  -- ================================================================
  -- CONVERSATIONS BY TAG: Tag distribution over time
  -- ================================================================
  conversations_by_tag AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'date', tag_date::TEXT,
          'tag_name', tag_name,
          'count', tag_count
        )
        ORDER BY tag_date, tag_name
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        DATE(bc.created_at) AS tag_date,
        COALESCE(t.tag_name, 'Sem Tag') AS tag_name,
        COUNT(DISTINCT bc.id)::INTEGER AS tag_count
      FROM base_conversations bc
      LEFT JOIN conversation_tags ct ON ct.conversation_id = bc.id
      LEFT JOIN tags t ON t.id = ct.tag_id
      GROUP BY DATE(bc.created_at), t.tag_name
      ORDER BY tag_date, tag_name
    ) tag_data
  ),

  -- ================================================================
  -- HEATMAP: Day of week × Hour
  -- ================================================================
  heatmap AS (
    SELECT json_agg(
      json_build_object(
        'dayOfWeek', day_of_week,
        'hour', hour,
        'count', count
      )
      ORDER BY day_of_week, hour
    ) AS data
    FROM (
      SELECT
        EXTRACT(DOW FROM created_at)::INTEGER AS day_of_week,
        EXTRACT(HOUR FROM created_at)::INTEGER AS hour,
        COUNT(*)::INTEGER AS count
      FROM base_conversations
      GROUP BY
        EXTRACT(DOW FROM created_at),
        EXTRACT(HOUR FROM created_at)
      ORDER BY day_of_week, hour
    ) heatmap_data
  ),

  -- ================================================================
  -- FUNNEL: Status distribution
  -- ================================================================
  funnel AS (
    SELECT json_build_object(
      'open', COALESCE(SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END), 0)::INTEGER,
      'paused', COALESCE(SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END), 0)::INTEGER,
      'closed', COALESCE(SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END), 0)::INTEGER
    ) AS data
    FROM base_conversations
  ),

  -- ================================================================
  -- BY CHANNEL: Placeholder (empty array for now)
  -- ================================================================
  by_channel AS (
    SELECT '[]'::json AS data
  ),

  -- ================================================================
  -- SATISFACTION OVER TIME: Placeholder (empty array)
  -- ================================================================
  satisfaction_over_time AS (
    SELECT '[]'::json AS data
  ),

  -- ================================================================
  -- COST OVER TIME: Placeholder (empty array)
  -- ================================================================
  cost_over_time AS (
    SELECT '[]'::json AS data
  ),

  -- ================================================================
  -- AI VS HUMAN: Summary comparison
  -- ================================================================
  ai_vs_human AS (
    SELECT json_agg(comparison) AS data
    FROM (
      SELECT json_build_object(
        'type', 'AI',
        'volume', COUNT(*) FILTER (WHERE ia_active = true)::INTEGER,
        'avgResponseTime', ROUND(AVG(first_response_time_seconds) FILTER (WHERE ia_active = true))::INTEGER,
        'satisfaction', NULL::INTEGER
      ) AS comparison
      FROM enriched_conversations
      UNION ALL
      SELECT json_build_object(
        'type', 'Human',
        'volume', COUNT(*) FILTER (WHERE ia_active = false OR ia_active IS NULL)::INTEGER,
        'avgResponseTime', ROUND(AVG(first_response_time_seconds) FILTER (WHERE ia_active = false OR ia_active IS NULL))::INTEGER,
        'satisfaction', NULL::INTEGER
      ) AS comparison
      FROM enriched_conversations
    ) comparisons
  ),

  -- ================================================================
  -- CHANNEL PERFORMANCE: Placeholder (empty array)
  -- ================================================================
  channel_performance AS (
    SELECT '[]'::json AS data
  ),

  -- ================================================================
  -- TOP TAGS: Most used tags
  -- ================================================================
  top_tags AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagName', tag_name,
          'count', tag_count,
          'percentage', ROUND((tag_count::DECIMAL / NULLIF(total_convs, 0)) * 100, 1)
        )
        ORDER BY tag_count DESC
      ) FILTER (WHERE tag_name IS NOT NULL),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        t.tag_name,
        COUNT(DISTINCT ct.conversation_id)::INTEGER AS tag_count,
        (SELECT COUNT(*) FROM base_conversations)::INTEGER AS total_convs
      FROM conversation_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      WHERE EXISTS (
        SELECT 1 FROM base_conversations bc WHERE bc.id = ct.conversation_id
      )
      GROUP BY t.tag_name
      ORDER BY tag_count DESC
      LIMIT 10
    ) top_tag_data
  ),

  -- ================================================================
  -- RESPONSE TIME DISTRIBUTION: Placeholder (empty array)
  -- ================================================================
  response_time_distribution AS (
    SELECT '[]'::json AS data
  )

  -- ================================================================
  -- FINAL RESULT: Combine all sections
  -- ================================================================
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(kpis.*) FROM kpis),
    'dailyConversations', (SELECT COALESCE(data, '[]'::json) FROM daily_conversations),
    'conversationsByTag', (SELECT data FROM conversations_by_tag),
    'heatmap', (SELECT COALESCE(data, '[]'::json) FROM heatmap),
    'funnel', (SELECT data FROM funnel),
    'byChannel', (SELECT data FROM by_channel),
    'satisfactionOverTime', (SELECT data FROM satisfaction_over_time),
    'costOverTime', (SELECT data FROM cost_over_time),
    'aiVsHuman', (SELECT COALESCE(data, '[]'::json) FROM ai_vs_human),
    'channelPerformance', (SELECT data FROM channel_performance),
    'topTags', (SELECT data FROM top_tags),
    'responseTimeDistribution', (SELECT data FROM response_time_distribution)
  ) INTO v_result;

  RETURN v_result;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error in get_dashboard_data: %', SQLERRM;
  RETURN json_build_object(
    'error', SQLERRM,
    'kpis', json_build_object(),
    'dailyConversations', '[]'::json,
    'conversationsByTag', '[]'::json,
    'heatmap', '[]'::json,
    'funnel', json_build_object('open', 0, 'paused', 0, 'closed', 0),
    'byChannel', '[]'::json,
    'satisfactionOverTime', '[]'::json,
    'costOverTime', '[]'::json,
    'aiVsHuman', '[]'::json,
    'channelPerformance', '[]'::json,
    'topTags', '[]'::json,
    'responseTimeDistribution', '[]'::json
  );
END;
$$ LANGUAGE plpgsql;
