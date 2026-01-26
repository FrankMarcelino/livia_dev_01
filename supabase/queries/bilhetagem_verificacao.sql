-- ============================================================================
-- QUERIES DE VERIFICAÇÃO - Sistema de Bilhetagem
-- ============================================================================
-- Execute essas queries no Supabase SQL Editor para verificar a migração
-- ============================================================================

-- ============================================================================
-- 1) VERIFICAR DADOS SEED
-- ============================================================================

-- 1.1 Markup global padrão (deve ter 1 registro com multiplier = 4.0)
SELECT
  id,
  tenant_id,
  provider,
  sku,
  agent_id,
  multiplier,
  fixed_usd,
  priority,
  is_active,
  created_at
FROM public.markup_rules
ORDER BY priority ASC;

-- 1.2 Câmbio inicial (deve ter 1 registro com rate = 5.80)
SELECT
  id,
  rate,
  source,
  fetched_at
FROM public.fx_usd_brl_history
ORDER BY fetched_at DESC
LIMIT 5;

-- 1.3 Testar função de câmbio
SELECT public.get_latest_fx_usd_brl() AS current_fx_rate;

-- ============================================================================
-- 2) VERIFICAR MIGRAÇÃO DE ai_models → pricing_*
-- ============================================================================

-- 2.1 Modelos originais em ai_models
SELECT
  model,
  input_usd_per_1m,
  output_usd_per_1m,
  is_active
FROM public.ai_models
ORDER BY model;

-- 2.2 SKUs criados (deve espelhar ai_models + elevenlabs)
SELECT
  id,
  provider,
  sku,
  description,
  is_active,
  created_at
FROM public.pricing_skus
ORDER BY provider, sku;

-- 2.3 Componentes de preço (input_tokens, output_tokens, chars)
SELECT
  pc.id,
  ps.provider,
  ps.sku,
  pc.measure_key,
  pc.unit_multiplier,
  pc.created_at
FROM public.pricing_components pc
JOIN public.pricing_skus ps ON ps.id = pc.sku_id
ORDER BY ps.provider, ps.sku, pc.measure_key;

-- 2.4 Preços vigentes (com range de vigência)
SELECT
  pcp.id,
  ps.provider,
  ps.sku,
  pc.measure_key,
  pcp.usd_per_unit,
  pcp.effective_range,
  now() <@ pcp.effective_range AS is_current
FROM public.pricing_component_prices pcp
JOIN public.pricing_components pc ON pc.id = pcp.component_id
JOIN public.pricing_skus ps ON ps.id = pc.sku_id
ORDER BY ps.provider, ps.sku, pc.measure_key;

-- 2.5 Comparação: ai_models vs pricing (para validar migração)
SELECT
  am.model,
  am.input_usd_per_1m AS original_input,
  am.output_usd_per_1m AS original_output,
  ps.sku AS migrated_sku,
  MAX(CASE WHEN pc.measure_key = 'input_tokens' THEN pcp.usd_per_unit END) AS migrated_input,
  MAX(CASE WHEN pc.measure_key = 'output_tokens' THEN pcp.usd_per_unit END) AS migrated_output
FROM public.ai_models am
LEFT JOIN public.pricing_skus ps ON ps.sku = am.model AND ps.provider = 'openai'
LEFT JOIN public.pricing_components pc ON pc.sku_id = ps.id
LEFT JOIN public.pricing_component_prices pcp ON pcp.component_id = pc.id AND now() <@ pcp.effective_range
GROUP BY am.model, am.input_usd_per_1m, am.output_usd_per_1m, ps.sku
ORDER BY am.model;

-- ============================================================================
-- 3) VERIFICAR ESTRUTURA DAS TABELAS
-- ============================================================================

-- 3.1 Wallets (deve estar vazia inicialmente)
SELECT COUNT(*) AS total_wallets FROM public.wallets;

-- 3.2 Ledger entries (deve estar vazia inicialmente)
SELECT COUNT(*) AS total_ledger_entries FROM public.ledger_entries;

-- 3.3 Billing notifications (deve estar vazia inicialmente)
SELECT COUNT(*) AS total_notifications FROM public.billing_notifications;

-- ============================================================================
-- 4) TESTES FUNCIONAIS (SIMULAR OPERAÇÕES)
-- ============================================================================

-- 4.1 Testar cálculo de disponível com overdraft
-- Exemplo: saldo 10000 (R$100), overdraft 10% = disponível 11000 (R$110)
SELECT
  10000 AS balance,
  0.10 AS overdraft_percent,
  public.wallet_available_credits(10000, 0.10) AS available_with_overdraft;

-- 4.2 Testar resolução de markup (deve retornar a regra global)
SELECT * FROM public.resolve_markup_v2(
  NULL,      -- p_tenant_id
  NULL,      -- p_agent_id
  'openai',  -- p_provider
  'gpt-4.1-mini'  -- p_sku (ajuste para um sku que existe)
);

-- 4.3 Testar preço de componente vigente
-- (substitua o UUID pelo id real de um componente)
/*
SELECT public.get_component_price_usd(
  'UUID_DO_COMPONENTE'::uuid,
  now()
) AS current_price;
*/

-- ============================================================================
-- 5) QUERIES PARA DASHBOARD (EXEMPLOS PRONTOS)
-- ============================================================================

-- 5.1 Saldo + disponível de um tenant
-- (substitua :tenant_id pelo UUID real)
/*
SELECT
  w.tenant_id,
  w.balance_credits,
  (w.balance_credits / 100.0) AS balance_brl,
  public.wallet_available_credits(w.balance_credits, w.overdraft_percent) AS available_credits,
  (public.wallet_available_credits(w.balance_credits, w.overdraft_percent) / 100.0) AS available_brl,
  w.overdraft_percent,
  w.hard_stop_active,
  w.low_balance_threshold_credits,
  (w.low_balance_threshold_credits / 100.0) AS threshold_brl
FROM public.wallets w
WHERE w.tenant_id = :tenant_id;
*/

-- 5.2 Extrato (últimos 50 movimentos)
/*
SELECT
  le.created_at,
  le.direction,
  le.amount_credits,
  (le.amount_credits / 100.0) AS amount_brl,
  le.balance_after,
  (le.balance_after / 100.0) AS balance_brl,
  le.source_type,
  le.description,
  le.meta
FROM public.ledger_entries le
WHERE le.tenant_id = :tenant_id
ORDER BY le.created_at DESC
LIMIT 50;
*/

-- 5.3 Consumo por provider/sku (últimos 7 dias)
/*
SELECT
  provider,
  sku,
  COUNT(*) AS calls,
  SUM(debited_credits) AS debited_credits,
  (SUM(debited_credits) / 100.0) AS debited_brl
FROM public.usages
WHERE id_tenant = :tenant_id
  AND created_at >= now() - interval '7 days'
  AND debited_credits IS NOT NULL
GROUP BY provider, sku
ORDER BY debited_credits DESC;
*/

-- 5.4 Notificações pendentes (para n8n processar)
SELECT
  bn.id,
  bn.tenant_id,
  t.name AS tenant_name,
  bn.type,
  bn.severity,
  bn.title,
  bn.message,
  bn.channels,
  bn.status,
  bn.tries,
  bn.created_at
FROM public.billing_notifications bn
JOIN public.tenants t ON t.id = bn.tenant_id
WHERE bn.status = 'pending'
ORDER BY bn.created_at ASC
LIMIT 20;

-- ============================================================================
-- 6) TESTE COMPLETO: CREDITAR E COBRAR (EXECUTAR EM SEQUÊNCIA)
-- ============================================================================
-- ATENÇÃO: Substitua os UUIDs pelos valores reais do seu ambiente

/*
-- 6.1 Creditar R$100 para um tenant (10000 créditos)
SELECT public.credit_wallet(
  'UUID_TENANT'::uuid,    -- p_tenant_id
  10000,                  -- p_amount_credits (R$100)
  'purchase',             -- p_source_type
  'teste-manual',         -- p_source_ref
  'Crédito de teste',     -- p_description
  '{}'::jsonb             -- p_meta
);

-- 6.2 Verificar wallet criada
SELECT * FROM public.wallets WHERE tenant_id = 'UUID_TENANT'::uuid;

-- 6.3 Verificar extrato
SELECT * FROM public.ledger_entries WHERE tenant_id = 'UUID_TENANT'::uuid ORDER BY created_at DESC;

-- 6.4 Cobrar uso de LLM
SELECT public.bill_usage_v2(
  'UUID_TENANT'::uuid,       -- p_tenant_id
  'UUID_CONTACT'::uuid,      -- p_contact_id
  'UUID_AGENT'::uuid,        -- p_agent_id
  'UUID_CONVERSATION'::uuid, -- p_conversation_id
  'openai',                  -- p_provider
  'gpt-4.1-mini',            -- p_sku
  '{"input_tokens": 1000, "output_tokens": 500}'::jsonb,  -- p_measures
  'wf_teste',                -- p_workflow_id
  1,                         -- p_execution_id
  now(),                     -- p_billed_at
  '{}'::jsonb                -- p_meta
);

-- 6.5 Verificar saldo atualizado
SELECT
  balance_credits,
  (balance_credits / 100.0) AS balance_brl
FROM public.wallets
WHERE tenant_id = 'UUID_TENANT'::uuid;

-- 6.6 Verificar usage registrado
SELECT * FROM public.usages WHERE id_tenant = 'UUID_TENANT'::uuid ORDER BY created_at DESC LIMIT 1;

-- 6.7 Verificar extrato com débito
SELECT * FROM public.ledger_entries WHERE tenant_id = 'UUID_TENANT'::uuid ORDER BY created_at DESC;
*/

-- ============================================================================
-- 7) DIAGNÓSTICO: VERIFICAR SE TUDO ESTÁ OK
-- ============================================================================

SELECT
  'markup_rules' AS tabela,
  COUNT(*) AS registros,
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ VAZIO' END AS status
FROM public.markup_rules
UNION ALL
SELECT
  'fx_usd_brl_history',
  COUNT(*),
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ VAZIO' END
FROM public.fx_usd_brl_history
UNION ALL
SELECT
  'pricing_skus',
  COUNT(*),
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ VAZIO' END
FROM public.pricing_skus
UNION ALL
SELECT
  'pricing_components',
  COUNT(*),
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ VAZIO' END
FROM public.pricing_components
UNION ALL
SELECT
  'pricing_component_prices',
  COUNT(*),
  CASE WHEN COUNT(*) >= 1 THEN '✅ OK' ELSE '❌ VAZIO' END
FROM public.pricing_component_prices
UNION ALL
SELECT
  'wallets',
  COUNT(*),
  '⏳ Criadas sob demanda'
FROM public.wallets
UNION ALL
SELECT
  'ledger_entries',
  COUNT(*),
  '⏳ Criadas sob demanda'
FROM public.ledger_entries
UNION ALL
SELECT
  'billing_notifications',
  COUNT(*),
  '⏳ Criadas sob demanda'
FROM public.billing_notifications;
