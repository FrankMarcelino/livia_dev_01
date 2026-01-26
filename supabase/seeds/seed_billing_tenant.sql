-- ============================================================
-- SEED: Dados de Billing para Tenant
-- Tenant ID: 31701213-794d-43c3-a74a-50d57fcd9d2b
-- Data: 2026-01-25
-- ============================================================

-- Variaveis
DO $$
DECLARE
  v_tenant_id uuid := '31701213-794d-43c3-a74a-50d57fcd9d2b';
  v_wallet_id uuid;
  v_balance bigint := 0;
BEGIN
  -- ============================================================
  -- 1. CRIAR WALLET (se nao existir)
  -- ============================================================
  INSERT INTO public.wallets (
    tenant_id,
    balance_credits,
    overdraft_percent,
    low_balance_threshold_credits,
    notify_low_balance,
    notify_hard_stop,
    hard_stop_active
  ) VALUES (
    v_tenant_id,
    0, -- Comeca com zero, vamos creditar depois
    0.10, -- 10% overdraft
    5000, -- R$ 50,00 threshold
    true,
    true,
    false
  )
  ON CONFLICT (tenant_id) DO UPDATE SET
    updated_at = now()
  RETURNING id INTO v_wallet_id;

  -- Se nao retornou (conflict), busca o id existente
  IF v_wallet_id IS NULL THEN
    SELECT id INTO v_wallet_id FROM public.wallets WHERE tenant_id = v_tenant_id;
  END IF;

  RAISE NOTICE 'Wallet ID: %', v_wallet_id;

  -- ============================================================
  -- 2. CREDITAR R$ 200,00 (20.000 creditos) - Compra inicial
  -- ============================================================
  v_balance := 20000;

  UPDATE public.wallets
  SET balance_credits = v_balance, updated_at = now()
  WHERE id = v_wallet_id;

  INSERT INTO public.ledger_entries (
    tenant_id,
    wallet_id,
    direction,
    amount_credits,
    balance_after,
    source_type,
    source_ref,
    description,
    meta,
    created_at
  ) VALUES (
    v_tenant_id,
    v_wallet_id,
    'credit',
    20000,
    v_balance,
    'purchase',
    'manual-seed-001',
    'Recarga inicial - Boas vindas',
    jsonb_build_object(
      'credited_credits', 20000,
      'balance_after', v_balance,
      'payment_method', 'manual',
      'seed', true
    ),
    now() - interval '7 days'
  );

  RAISE NOTICE 'Credito inicial: 20000 (R$ 200,00)';

  -- ============================================================
  -- 3. SIMULAR DEBITOS DE USO (OpenAI)
  -- ============================================================

  -- Uso 1: gpt-4.1-mini (150 creditos = R$ 1,50)
  v_balance := v_balance - 150;

  INSERT INTO public.usages (
    id_tenant,
    provider,
    sku,
    model,
    input_tokens,
    output_tokens,
    total_tokens,
    measures,
    base_usd,
    sell_usd,
    fx_used,
    debited_credits,
    created_at
  ) VALUES (
    v_tenant_id,
    'openai',
    'gpt-4.1-mini',
    'gpt-4.1-mini',
    1500,
    500,
    2000,
    jsonb_build_object('input_tokens', 1500, 'output_tokens', 500),
    0.0075, -- base USD
    0.030,  -- sell USD (4x markup)
    5.00,   -- fx
    150,    -- 150 creditos = R$ 1,50
    now() - interval '6 days'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 150, v_balance,
    'usage', 'usages.id=seed1', 'Cobranca de uso IA',
    jsonb_build_object(
      'provider', 'openai', 'sku', 'gpt-4.1-mini',
      'measures', jsonb_build_object('input_tokens', 1500, 'output_tokens', 500),
      'base_usd', 0.0075, 'sell_usd', 0.030, 'fx_used', 5.00
    ),
    now() - interval '6 days'
  );

  -- Uso 2: gpt-4.1-mini (85 creditos)
  v_balance := v_balance - 85;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model, input_tokens, output_tokens, total_tokens,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'openai', 'gpt-4.1-mini', 'gpt-4.1-mini',
    800, 300, 1100,
    jsonb_build_object('input_tokens', 800, 'output_tokens', 300),
    0.0042, 0.017, 5.00, 85,
    now() - interval '5 days'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 85, v_balance,
    'usage', 'usages.id=seed2', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'openai', 'sku', 'gpt-4.1-mini'),
    now() - interval '5 days'
  );

  -- Uso 3: gpt-4.1 (320 creditos - modelo mais caro)
  v_balance := v_balance - 320;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model, input_tokens, output_tokens, total_tokens,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'openai', 'gpt-4.1', 'gpt-4.1',
    2000, 800, 2800,
    jsonb_build_object('input_tokens', 2000, 'output_tokens', 800),
    0.016, 0.064, 5.00, 320,
    now() - interval '4 days'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 320, v_balance,
    'usage', 'usages.id=seed3', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'openai', 'sku', 'gpt-4.1'),
    now() - interval '4 days'
  );

  -- ============================================================
  -- 4. SIMULAR DEBITOS DE USO (ElevenLabs TTS)
  -- ============================================================

  -- Uso 4: ElevenLabs TTS (200 creditos)
  v_balance := v_balance - 200;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'elevenlabs', 'tts_standard', 'tts_standard',
    jsonb_build_object('chars', 5000),
    0.01, 0.04, 5.00, 200,
    now() - interval '3 days'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 200, v_balance,
    'usage', 'usages.id=seed4', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'elevenlabs', 'sku', 'tts_standard', 'measures', jsonb_build_object('chars', 5000)),
    now() - interval '3 days'
  );

  -- Uso 5: ElevenLabs TTS (150 creditos)
  v_balance := v_balance - 150;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'elevenlabs', 'tts_standard', 'tts_standard',
    jsonb_build_object('chars', 3750),
    0.0075, 0.03, 5.00, 150,
    now() - interval '2 days'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 150, v_balance,
    'usage', 'usages.id=seed5', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'elevenlabs', 'sku', 'tts_standard'),
    now() - interval '2 days'
  );

  -- ============================================================
  -- 5. MAIS USOS RECENTES (ultimos 2 dias)
  -- ============================================================

  -- Uso 6: OpenAI ontem (120 creditos)
  v_balance := v_balance - 120;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model, input_tokens, output_tokens, total_tokens,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'openai', 'gpt-4.1-mini', 'gpt-4.1-mini',
    1200, 400, 1600,
    jsonb_build_object('input_tokens', 1200, 'output_tokens', 400),
    0.006, 0.024, 5.00, 120,
    now() - interval '1 day'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 120, v_balance,
    'usage', 'usages.id=seed6', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'openai', 'sku', 'gpt-4.1-mini'),
    now() - interval '1 day'
  );

  -- Uso 7: OpenAI hoje (95 creditos)
  v_balance := v_balance - 95;

  INSERT INTO public.usages (
    id_tenant, provider, sku, model, input_tokens, output_tokens, total_tokens,
    measures, base_usd, sell_usd, fx_used, debited_credits, created_at
  ) VALUES (
    v_tenant_id, 'openai', 'gpt-4.1-mini', 'gpt-4.1-mini',
    900, 350, 1250,
    jsonb_build_object('input_tokens', 900, 'output_tokens', 350),
    0.0047, 0.019, 5.00, 95,
    now() - interval '2 hours'
  );

  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta, created_at
  ) VALUES (
    v_tenant_id, v_wallet_id, 'debit', 95, v_balance,
    'usage', 'usages.id=seed7', 'Cobranca de uso IA',
    jsonb_build_object('provider', 'openai', 'sku', 'gpt-4.1-mini'),
    now() - interval '2 hours'
  );

  -- ============================================================
  -- 6. ATUALIZAR SALDO FINAL NA WALLET
  -- ============================================================
  UPDATE public.wallets
  SET balance_credits = v_balance, updated_at = now()
  WHERE id = v_wallet_id;

  RAISE NOTICE 'Saldo final: % creditos (R$ %)', v_balance, v_balance / 100.0;

  -- ============================================================
  -- 7. CRIAR NOTIFICACAO DE EXEMPLO (opcional)
  -- ============================================================
  INSERT INTO public.billing_notifications (
    tenant_id,
    severity,
    type,
    title,
    message,
    channels,
    status,
    meta,
    created_at,
    sent_at
  ) VALUES (
    v_tenant_id,
    'info',
    'recovered',
    'Bem-vindo ao sistema de billing',
    'Seus creditos foram adicionados. Bom uso!',
    ARRAY['email'],
    'sent',
    jsonb_build_object('seed', true),
    now() - interval '7 days',
    now() - interval '7 days'
  );

END $$;

-- ============================================================
-- VERIFICACAO: Consultar dados inseridos
-- ============================================================

-- Wallet
SELECT
  w.id,
  w.tenant_id,
  w.balance_credits,
  w.balance_credits / 100.0 as balance_brl,
  w.balance_credits + floor(w.balance_credits * w.overdraft_percent) as available_credits,
  w.overdraft_percent,
  w.low_balance_threshold_credits,
  w.hard_stop_active
FROM public.wallets w
WHERE w.tenant_id = '31701213-794d-43c3-a74a-50d57fcd9d2b';

-- Extrato (ultimos 10)
SELECT
  le.created_at,
  le.direction,
  le.amount_credits,
  le.amount_credits / 100.0 as amount_brl,
  le.balance_after,
  le.balance_after / 100.0 as balance_brl,
  le.source_type,
  le.description
FROM public.ledger_entries le
WHERE le.tenant_id = '31701213-794d-43c3-a74a-50d57fcd9d2b'
ORDER BY le.created_at DESC
LIMIT 10;

-- Resumo de consumo por provider
SELECT
  u.provider,
  u.sku,
  count(*) as calls,
  sum(u.debited_credits) as total_credits,
  sum(u.debited_credits) / 100.0 as total_brl
FROM public.usages u
WHERE u.id_tenant = '31701213-794d-43c3-a74a-50d57fcd9d2b'
  AND u.provider IS NOT NULL
GROUP BY u.provider, u.sku
ORDER BY total_credits DESC;
