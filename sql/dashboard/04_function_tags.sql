-- Tags Data Function
-- Created: 2025-12-19
-- Purpose: Fetch tags metrics for categorization analysis

CREATE OR REPLACE FUNCTION get_tags_data(
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
  -- ================================================================
  top_tags AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagId', tag_id::TEXT,
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
        t.id AS tag_id,
        t.tag_name,
        COUNT(DISTINCT ct.conversation_id)::INTEGER AS tag_count,
        (SELECT COUNT(DISTINCT id) FROM base_conversations)::INTEGER AS total_convs
      FROM conversation_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      WHERE EXISTS (
        SELECT 1 FROM base_conversations bc WHERE bc.id = ct.conversation_id
      )
      GROUP BY t.id, t.tag_name
      ORDER BY tag_count DESC
      LIMIT 10
    ) top_tag_data
  ),

  -- ================================================================
  -- TAG PERFORMANCE: Metrics per tag
  -- ================================================================
  tag_performance AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagId', tag_id::TEXT,
          'tagName', tag_name,
          'totalConversations', total_conversations,
          'avgMessages', avg_messages,
          'avgResponseTime', avg_response_time,
          'aiActivePercent', ai_active_percent,
          'closedPercent', closed_percent
        )
        ORDER BY total_conversations DESC
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        t.id AS tag_id,
        t.tag_name,
        COUNT(DISTINCT ec.id)::INTEGER AS total_conversations,
        ROUND(AVG(ec.total_messages), 1) AS avg_messages,
        ROUND(AVG(ec.first_response_time_seconds))::INTEGER AS avg_response_time,
        ROUND(
          (COUNT(*) FILTER (WHERE ec.ia_active = true)::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS ai_active_percent,
        ROUND(
          (COUNT(*) FILTER (WHERE ec.status = 'closed')::DECIMAL / NULLIF(COUNT(*), 0)) * 100,
          1
        ) AS closed_percent
      FROM conversation_tags ct
      INNER JOIN tags t ON t.id = ct.tag_id
      INNER JOIN enriched_conversations ec ON ec.id = ct.conversation_id
      GROUP BY t.id, t.tag_name
      HAVING COUNT(DISTINCT ec.id) > 0
      ORDER BY total_conversations DESC
    ) perf_data
  ),

  -- ================================================================
  -- TAGS DISTRIBUTION: Data for donut chart
  -- ================================================================
  tags_distribution AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagName', tag_name,
          'count', tag_count,
          'percentage', ROUND((tag_count::DECIMAL / NULLIF(total_convs, 0)) * 100, 1)
        )
        ORDER BY tag_count DESC
      ),
      '[]'::json
    ) AS data
    FROM (
      SELECT
        COALESCE(t.tag_name, 'Sem Tag') AS tag_name,
        COUNT(DISTINCT bc.id)::INTEGER AS tag_count,
        (SELECT COUNT(*) FROM base_conversations)::INTEGER AS total_convs
      FROM base_conversations bc
      LEFT JOIN conversation_tags ct ON ct.conversation_id = bc.id
      LEFT JOIN tags t ON t.id = ct.tag_id
      GROUP BY t.tag_name
      ORDER BY tag_count DESC
    ) dist_data
  ),

  -- ================================================================
  -- CONVERSATIONS BY TAG: Time series
  -- ================================================================
  conversations_by_tag AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'date', tag_date::TEXT,
          'tagName', tag_name,
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
    ) tag_time_data
  ),

  -- ================================================================
  -- UNUSED TAGS: Tags without conversations in the period
  -- ================================================================
  unused_tags AS (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'tagId', t.id::TEXT,
          'tagName', t.tag_name,
          'createdAt', t.created_at::TEXT
        )
        ORDER BY t.tag_name
      ),
      '[]'::json
    ) AS data
    FROM all_tags t
    WHERE NOT EXISTS (
      SELECT 1 
      FROM conversation_tags ct
      INNER JOIN base_conversations bc ON bc.id = ct.conversation_id
      WHERE ct.tag_id = t.id
    )
  )

  -- ================================================================
  -- FINAL RESULT: Combine all sections
  -- ================================================================
  SELECT json_build_object(
    'kpis', (SELECT row_to_json(tags_kpis.*) FROM tags_kpis),
    'topTags', (SELECT data FROM top_tags),
    'tagPerformance', (SELECT data FROM tag_performance),
    'tagsDistribution', (SELECT data FROM tags_distribution),
    'conversationsByTag', (SELECT data FROM conversations_by_tag),
    'unusedTags', (SELECT data FROM unused_tags)
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
    'tagPerformance', '[]'::json,
    'tagsDistribution', '[]'::json,
    'conversationsByTag', '[]'::json,
    'unusedTags', '[]'::json
  );
END;
$$ LANGUAGE plpgsql;






