-- SQL Corrigido para Dashboard LIVIA
-- Alinhado com DASHBOARD_PLAN.md

WITH
context AS (
    SELECT
        '{{ $json.id_tenant }}'::uuid AS tenant_id,
        'America/Sao_Paulo' AS time_zone,
        (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date - INTERVAL '30 days' AS start_date
),

-- KPIs Totais (para os cards)
kpis AS (
    SELECT
        COUNT(DISTINCT c.id) AS total_conversas,
        COUNT(m.id) AS total_mensagens,
        CASE
            WHEN COUNT(DISTINCT c.id) > 0
            THEN ROUND(COUNT(m.id)::numeric / COUNT(DISTINCT c.id), 1)
            ELSE 0
        END AS media_interacoes
    FROM public.conversations c
    LEFT JOIN public.messages m ON m.conversation_id = c.id
    WHERE c.tenant_id = (SELECT tenant_id FROM context)
      AND c.created_at >= (SELECT start_date FROM context)
),

-- Pico de conversas (dia com mais conversas)
pico_conversas AS (
    SELECT
        DATE(c.created_at AT TIME ZONE (SELECT time_zone FROM context)) AS dia,
        COUNT(c.id) AS quantidade
    FROM public.conversations c
    WHERE c.tenant_id = (SELECT tenant_id FROM context)
      AND c.created_at >= (SELECT start_date FROM context)
    GROUP BY 1
    ORDER BY 2 DESC
    LIMIT 1
),

-- Conversas por dia + Média de mensagens por conversa (para gráfico combo)
daily_conversations_with_avg AS (
    SELECT
        DATE(c.created_at AT TIME ZONE (SELECT time_zone FROM context)) AS dia,
        COUNT(DISTINCT c.id) AS total_conversas,
        COALESCE(
            ROUND(COUNT(m.id)::numeric / NULLIF(COUNT(DISTINCT c.id), 0), 1),
            0
        ) AS media_mensagens_por_conversa
    FROM public.conversations c
    LEFT JOIN public.messages m ON m.conversation_id = c.id
        AND m.created_at >= (SELECT start_date FROM context)
    WHERE c.tenant_id = (SELECT tenant_id FROM context)
      AND c.created_at >= (SELECT start_date FROM context)
    GROUP BY 1
    ORDER BY 1
),

-- Conversas por tag por dia (formato para stacked bar)
-- Transformação pivot-like para formato wide
daily_tags_pivot AS (
    SELECT
        DATE(c.created_at AT TIME ZONE (SELECT time_zone FROM context)) AS dia,
        jsonb_object_agg(
            COALESCE(t.tag_name, 'Sem Tag'),
            count
        ) AS tags_data
    FROM (
        SELECT
            c.id,
            c.created_at,
            COALESCE(t.tag_name, 'Sem Tag') AS tag_name,
            COUNT(*) OVER (PARTITION BY DATE(c.created_at AT TIME ZONE (SELECT time_zone FROM context)), COALESCE(t.tag_name, 'Sem Tag')) AS count
        FROM public.conversations c
        LEFT JOIN public.conversation_tags ct ON c.id = ct.conversation_id
        LEFT JOIN public.tags t ON ct.tag_id = t.id
        WHERE c.tenant_id = (SELECT tenant_id FROM context)
          AND c.created_at >= (SELECT start_date FROM context)
    ) sub
    GROUP BY DATE(created_at AT TIME ZONE (SELECT time_zone FROM context))
    ORDER BY 1
),

-- Heatmap completo (dia da semana + hora)
heatmap_full AS (
    SELECT
        EXTRACT(DOW FROM (created_at AT TIME ZONE (SELECT time_zone FROM context)))::int AS dia_semana, -- 0=Dom, 6=Sáb
        EXTRACT(HOUR FROM (created_at AT TIME ZONE (SELECT time_zone FROM context)))::int AS hora,
        COUNT(id) AS volume
    FROM public.conversations
    WHERE tenant_id = (SELECT tenant_id FROM context)
      AND created_at >= (SELECT start_date FROM context)
    GROUP BY 1, 2
)

-- Retorno final em JSON
SELECT jsonb_build_object(
    -- KPIs para os cards
    'kpis', (
        SELECT jsonb_build_object(
            'total_conversas', total_conversas,
            'total_mensagens', total_mensagens,
            'media_interacoes', media_interacoes,
            'pico_dia', (
                SELECT jsonb_build_object(
                    'dia', dia,
                    'quantidade', quantidade
                ) FROM pico_conversas
            )
        ) FROM kpis
    ),

    -- Dados para gráfico combo (conversas + média)
    'daily_conversations', (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'date', dia,
                'total', total_conversas,
                'avgMessages', media_mensagens_por_conversa
            ) ORDER BY dia
        ), '[]'::jsonb)
        FROM daily_conversations_with_avg
    ),

    -- Dados para stacked bar (conversas por tag)
    'conversations_by_tag', (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object('date', dia) || tags_data
            ORDER BY dia
        ), '[]'::jsonb)
        FROM daily_tags_pivot
    ),

    -- Dados para heatmap
    'heatmap', (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'dayOfWeek', dia_semana,
                'hour', hora,
                'count', volume
            )
        ), '[]'::jsonb)
        FROM heatmap_full
    )
) AS dashboard_data;
