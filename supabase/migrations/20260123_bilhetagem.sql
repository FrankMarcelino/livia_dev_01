-- ============================================================================
-- MIGRAÇÃO: Sistema de Bilhetagem por Tenant
-- ============================================================================
-- Descrição: Implementa controle de créditos, catálogo de preços genérico,
--            markup, câmbio e notificações para billing de IA.
--
-- Regras de crédito:
--   - 1 crédito = R$ 0,01
--   - Overdraft padrão: 10%
--   - Débito: ceil(sell_brl * 100)
-- ============================================================================

-- ============================================================================
-- 1) EXTENSÃO NECESSÁRIA
-- ============================================================================
-- btree_gist é necessária para evitar sobreposição de vigência em preços
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- ============================================================================
-- 2) ALTERAÇÕES EM TABELAS EXISTENTES
-- ============================================================================

-- 2.1 usages: adicionar campos padronizados para billing
ALTER TABLE public.usages
ADD COLUMN IF NOT EXISTS provider text,
ADD COLUMN IF NOT EXISTS sku text,
ADD COLUMN IF NOT EXISTS measures jsonb,
ADD COLUMN IF NOT EXISTS base_usd numeric,
ADD COLUMN IF NOT EXISTS sell_usd numeric,
ADD COLUMN IF NOT EXISTS fx_used numeric,
ADD COLUMN IF NOT EXISTS debited_credits bigint;

-- Índice para consultas de consumo por provider/sku
CREATE INDEX IF NOT EXISTS idx_usages_provider_sku
  ON public.usages (id_tenant, provider, sku, created_at DESC);

-- ============================================================================
-- 3) TABELAS NOVAS
-- ============================================================================

-- 3.1 Carteira do tenant
CREATE TABLE IF NOT EXISTS public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- saldo em centavos (1 crédito = R$0,01)
  balance_credits bigint NOT NULL DEFAULT 0,

  -- overdraft: 10% por padrão
  overdraft_percent numeric NOT NULL DEFAULT 0.10,

  -- alertas de saldo baixo
  low_balance_threshold_credits bigint NOT NULL DEFAULT 5000, -- R$50,00
  notify_low_balance boolean NOT NULL DEFAULT true,
  notify_hard_stop boolean NOT NULL DEFAULT true,

  -- estado de hard stop (pra dashboard e controle)
  hard_stop_active boolean NOT NULL DEFAULT false,
  last_low_balance_notified_at timestamptz,
  last_hard_stop_notified_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3.2 Extrato contábil
CREATE TABLE IF NOT EXISTS public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,

  direction text NOT NULL CHECK (direction IN ('credit','debit')),
  amount_credits bigint NOT NULL CHECK (amount_credits > 0),
  balance_after bigint NOT NULL,

  source_type text NOT NULL,     -- 'purchase','usage','adjustment','refund',...
  source_ref text,               -- ex: 'usages.id=12345' ou 'purchase.id=...'
  usage_id bigint,               -- opcional: facilita join com usages

  description text,

  -- meta ENXUTO (snapshot essencial do cálculo)
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ledger_tenant_created_at
  ON public.ledger_entries (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ledger_usage_id
  ON public.ledger_entries (usage_id);

-- 3.3 Fila de notificações (para o n8n enviar ao tenant)
CREATE TABLE IF NOT EXISTS public.billing_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  severity text NOT NULL CHECK (severity IN ('info','warning','critical')),
  type text NOT NULL CHECK (type IN ('low_balance','hard_stop','recovered')),

  title text NOT NULL,
  message text NOT NULL,

  channels text[] NOT NULL DEFAULT '{whatsapp,email}'::text[],
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','sent','failed')),
  tries int NOT NULL DEFAULT 0,
  last_error text,

  meta jsonb NOT NULL DEFAULT '{}'::jsonb,

  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_billing_notifications_pending
  ON public.billing_notifications (status, created_at);

-- 3.4 Câmbio USD→BRL
CREATE TABLE IF NOT EXISTS public.fx_usd_brl_history (
  id bigserial PRIMARY KEY,
  rate numeric NOT NULL, -- ex: 5.12
  source text,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fx_latest
  ON public.fx_usd_brl_history (fetched_at DESC);

-- 3.5 Catálogo genérico de preços (SKU + componentes + preços versionados)

-- 3.5.1 SKUs (provider + sku)
CREATE TABLE IF NOT EXISTS public.pricing_skus (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,     -- 'openai', 'elevenlabs', ...
  sku text NOT NULL,          -- 'gpt-4.1-mini', 'tts_standard', ...
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, sku)
);

-- 3.5.2 Componentes de preço (unidades de medida)
CREATE TABLE IF NOT EXISTS public.pricing_components (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku_id uuid NOT NULL REFERENCES public.pricing_skus(id) ON DELETE CASCADE,
  measure_key text NOT NULL,         -- 'input_tokens','output_tokens','chars','seconds','images','request'
  unit_multiplier numeric NOT NULL DEFAULT 1.0,
  -- tokens por 1M -> 0.000001
  -- chars por 1k -> 0.001
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sku_id, measure_key)
);

-- 3.5.3 Preços com vigência versionada
CREATE TABLE IF NOT EXISTS public.pricing_component_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  component_id uuid NOT NULL REFERENCES public.pricing_components(id) ON DELETE CASCADE,
  usd_per_unit numeric NOT NULL,
  effective_range tstzrange NOT NULL, -- [inicio, fim)
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Impede sobreposição de vigência para o mesmo componente
  EXCLUDE USING gist (component_id WITH =, effective_range WITH &&)
);

CREATE INDEX IF NOT EXISTS idx_pricing_component_prices_range
  ON public.pricing_component_prices USING gist (component_id, effective_range);

-- 3.6 Regras de markup
CREATE TABLE IF NOT EXISTS public.markup_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  provider text,
  sku text,
  agent_id uuid REFERENCES public.agents(id) ON DELETE CASCADE,

  multiplier numeric NOT NULL DEFAULT 1.0,
  fixed_usd numeric NOT NULL DEFAULT 0.0,

  priority int NOT NULL DEFAULT 100, -- menor = maior prioridade
  is_active boolean NOT NULL DEFAULT true,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_markup_rules_lookup
  ON public.markup_rules (is_active, tenant_id, provider, sku, agent_id, priority);

-- ============================================================================
-- 4) FUNÇÕES UTILITÁRIAS
-- ============================================================================

-- 4.1 FX "último câmbio" (com fallback)
CREATE OR REPLACE FUNCTION public.get_latest_fx_usd_brl()
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE(
    (SELECT rate FROM public.fx_usd_brl_history ORDER BY fetched_at DESC LIMIT 1),
    5.00  -- fallback
  );
$$;

-- 4.2 Disponível com overdraft
CREATE OR REPLACE FUNCTION public.wallet_available_credits(p_balance bigint, p_overdraft_percent numeric)
RETURNS bigint
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    p_balance
    + CASE
        WHEN p_balance > 0 THEN floor(p_balance * p_overdraft_percent)::bigint
        ELSE 0
      END;
$$;

-- 4.3 Resolver markup (provider+sku+tenant+agent com prioridade)
CREATE OR REPLACE FUNCTION public.resolve_markup_v2(
  p_tenant_id uuid,
  p_agent_id uuid,
  p_provider text,
  p_sku text
)
RETURNS TABLE(multiplier numeric, fixed_usd numeric, rule_id uuid)
LANGUAGE sql
STABLE
AS $$
  SELECT mr.multiplier, mr.fixed_usd, mr.id
  FROM public.markup_rules mr
  WHERE mr.is_active = true
    AND (mr.tenant_id IS NULL OR mr.tenant_id = p_tenant_id)
    AND (mr.provider IS NULL OR mr.provider = p_provider)
    AND (mr.sku IS NULL OR mr.sku = p_sku)
    AND (mr.agent_id IS NULL OR mr.agent_id = p_agent_id)
  ORDER BY
    mr.priority ASC,
    (mr.tenant_id IS NOT NULL) DESC,
    (mr.provider IS NOT NULL) DESC,
    (mr.sku IS NOT NULL) DESC,
    (mr.agent_id IS NOT NULL) DESC
  LIMIT 1;
$$;

-- 4.4 Preço vigente de um componente
CREATE OR REPLACE FUNCTION public.get_component_price_usd(p_component_id uuid, p_at timestamptz)
RETURNS numeric
LANGUAGE sql
STABLE
AS $$
  SELECT pcp.usd_per_unit
  FROM public.pricing_component_prices pcp
  WHERE pcp.component_id = p_component_id
    AND p_at <@ pcp.effective_range
  ORDER BY lower(pcp.effective_range) DESC
  LIMIT 1;
$$;

-- 4.5 Enfileirar notificação
CREATE OR REPLACE FUNCTION public.enqueue_billing_notification(
  p_tenant_id uuid,
  p_type text,
  p_severity text,
  p_title text,
  p_message text,
  p_meta jsonb DEFAULT '{}'::jsonb
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.billing_notifications(
    tenant_id, type, severity, title, message, meta
  ) VALUES (
    p_tenant_id, p_type, p_severity, p_title, p_message, p_meta
  );
END;
$$;

-- ============================================================================
-- 5) RPCs PRINCIPAIS
-- ============================================================================

-- 5.1 RPC: Creditar carteira (compra/ajuste)
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_tenant_id uuid,
  p_amount_credits bigint,
  p_source_type text DEFAULT 'purchase',
  p_source_ref text DEFAULT NULL,
  p_description text DEFAULT 'Compra de créditos',
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance bigint;
  v_new_balance bigint;
BEGIN
  IF p_amount_credits <= 0 THEN
    RAISE EXCEPTION 'INVALID_CREDIT_AMOUNT';
  END IF;

  -- Garante que wallet existe
  INSERT INTO public.wallets (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Trava wallet para update
  SELECT id, balance_credits
    INTO v_wallet_id, v_balance
  FROM public.wallets
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  v_new_balance := v_balance + p_amount_credits;

  -- Atualiza saldo
  UPDATE public.wallets
    SET balance_credits = v_new_balance,
        updated_at = now()
  WHERE id = v_wallet_id;

  -- Registra no extrato
  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, description, meta
  ) VALUES (
    p_tenant_id, v_wallet_id, 'credit', p_amount_credits, v_new_balance,
    p_source_type, p_source_ref, p_description,
    jsonb_build_object(
      'credited_credits', p_amount_credits,
      'balance_after', v_new_balance
    ) || COALESCE(p_meta,'{}'::jsonb)
  );

  -- Se estava em hard_stop e voltou a ter disponível > 0, notifica recovered
  IF (SELECT hard_stop_active FROM public.wallets WHERE tenant_id = p_tenant_id) = true THEN
    IF public.wallet_available_credits(v_new_balance, (SELECT overdraft_percent FROM public.wallets WHERE tenant_id = p_tenant_id)) > 0 THEN
      UPDATE public.wallets
        SET hard_stop_active = false
      WHERE tenant_id = p_tenant_id;

      PERFORM public.enqueue_billing_notification(
        p_tenant_id,
        'recovered',
        'info',
        'IA liberada após recarga',
        'Créditos recarregados. Sua operação pode voltar a usar IA normalmente.',
        jsonb_build_object('balance_credits', v_new_balance)
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'credited_credits', p_amount_credits,
    'balance_credits', v_new_balance,
    'balance_brl', (v_new_balance / 100.0)
  );
END;
$$;

-- 5.2 RPC: Cobrança única para qualquer provider (motor final)
CREATE OR REPLACE FUNCTION public.bill_usage_v2(
  p_tenant_id uuid,
  p_contact_id uuid,
  p_agent_id uuid,
  p_conversation_id uuid,

  p_provider text,
  p_sku text,
  p_measures jsonb,

  p_workflow_id text DEFAULT NULL,
  p_execution_id int DEFAULT NULL,
  p_billed_at timestamptz DEFAULT now(),
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_wallet_id uuid;
  v_balance bigint;
  v_overdraft numeric;
  v_available bigint;

  v_fx numeric;

  v_m_mult numeric;
  v_m_fixed numeric;
  v_m_rule uuid;

  v_sku_id uuid;

  v_base_usd numeric := 0;
  v_sell_usd numeric := 0;
  v_sell_brl numeric := 0;

  v_debit_credits bigint;
  v_new_balance bigint;

  v_usage_id bigint;

  -- componentes loop
  r record;
  v_unit_value numeric;
  v_price_usd numeric;
  v_measure_text text;

  -- alertas
  v_threshold bigint;
  v_notify_low boolean;
  v_notify_stop boolean;
  v_available_after bigint;
BEGIN
  -- Validações
  IF p_provider IS NULL OR trim(p_provider) = '' THEN
    RAISE EXCEPTION 'INVALID_PROVIDER';
  END IF;
  IF p_sku IS NULL OR trim(p_sku) = '' THEN
    RAISE EXCEPTION 'INVALID_SKU';
  END IF;
  IF p_measures IS NULL THEN
    p_measures := '{}'::jsonb;
  END IF;

  -- Garante wallet
  INSERT INTO public.wallets (tenant_id)
  VALUES (p_tenant_id)
  ON CONFLICT (tenant_id) DO NOTHING;

  -- Trava wallet
  SELECT id, balance_credits, overdraft_percent, low_balance_threshold_credits, notify_low_balance, notify_hard_stop
    INTO v_wallet_id, v_balance, v_overdraft, v_threshold, v_notify_low, v_notify_stop
  FROM public.wallets
  WHERE tenant_id = p_tenant_id
  FOR UPDATE;

  v_available := public.wallet_available_credits(v_balance, v_overdraft);

  -- Valida SKU ativa
  SELECT id INTO v_sku_id
  FROM public.pricing_skus
  WHERE provider = p_provider AND sku = p_sku AND is_active = true;

  IF v_sku_id IS NULL THEN
    RAISE EXCEPTION 'SKU_NOT_FOUND_OR_INACTIVE: %/%', p_provider, p_sku;
  END IF;

  -- Calcula base_usd somando componentes
  FOR r IN
    SELECT pc.id AS component_id, pc.measure_key, pc.unit_multiplier
    FROM public.pricing_components pc
    WHERE pc.sku_id = v_sku_id
  LOOP
    -- Pega value das medidas
    -- Regra: se measure_key = 'request' e não veio, assume 1
    IF r.measure_key = 'request' AND NOT (p_measures ? r.measure_key) THEN
      v_unit_value := 1;
    ELSE
      v_measure_text := p_measures ->> r.measure_key;
      IF v_measure_text IS NULL OR trim(v_measure_text) = '' THEN
        v_unit_value := 0;
      ELSE
        -- Cast seguro: tenta numeric; se falhar, zera
        BEGIN
          v_unit_value := v_measure_text::numeric;
        EXCEPTION WHEN OTHERS THEN
          v_unit_value := 0;
        END;
      END IF;
    END IF;

    IF v_unit_value <> 0 THEN
      v_price_usd := public.get_component_price_usd(r.component_id, p_billed_at);
      IF v_price_usd IS NULL THEN
        RAISE EXCEPTION 'NO_ACTIVE_PRICE_FOR_COMPONENT: %', r.component_id;
      END IF;

      v_base_usd := v_base_usd + (v_unit_value * v_price_usd * r.unit_multiplier);
    END IF;
  END LOOP;

  IF v_base_usd < 0 THEN
    RAISE EXCEPTION 'INVALID_BASE_USD';
  END IF;

  -- Markup
  SELECT rm.multiplier, rm.fixed_usd, rm.rule_id
    INTO v_m_mult, v_m_fixed, v_m_rule
  FROM public.resolve_markup_v2(p_tenant_id, p_agent_id, p_provider, p_sku) rm;

  v_m_mult := COALESCE(v_m_mult, 1.0);
  v_m_fixed := COALESCE(v_m_fixed, 0.0);

  v_sell_usd := (v_base_usd * v_m_mult) + v_m_fixed;

  IF v_sell_usd < 0 THEN
    RAISE EXCEPTION 'INVALID_SELL_USD';
  END IF;

  -- FX e conversão
  v_fx := public.get_latest_fx_usd_brl();
  v_sell_brl := v_sell_usd * v_fx;

  -- Créditos (centavos): 1 crédito = R$0,01 => *100
  v_debit_credits := ceil(v_sell_brl * 100.0)::bigint;

  IF v_debit_credits < 0 THEN
    RAISE EXCEPTION 'INVALID_DEBIT_CREDITS';
  END IF;

  -- Hard stop: considera available com overdraft
  IF v_available < v_debit_credits THEN
    -- Marca hard_stop ativo
    UPDATE public.wallets SET hard_stop_active = true, last_hard_stop_notified_at = now(), updated_at = now()
    WHERE tenant_id = p_tenant_id
      AND hard_stop_active = false
      AND (last_hard_stop_notified_at IS NULL OR last_hard_stop_notified_at <= now() - interval '60 minutes');

    IF FOUND AND v_notify_stop THEN
      PERFORM public.enqueue_billing_notification(
        p_tenant_id,
        'hard_stop',
        'critical',
        'IA pausada por falta de créditos',
        'Seus créditos chegaram ao limite. Recarregue para continuar utilizando IA.',
        jsonb_build_object(
          'balance_credits', v_balance,
          'available_credits', v_available,
          'needed_credits', v_debit_credits,
          'provider', p_provider,
          'sku', p_sku
        )
      );
    END IF;

    RAISE EXCEPTION 'INSUFFICIENT_CREDITS: balance=% available=% needed=%', v_balance, v_available, v_debit_credits;
  END IF;

  -- Debita
  v_new_balance := v_balance - v_debit_credits;

  -- Grava usage (padronizado)
  INSERT INTO public.usages (
    model, input_tokens, output_tokens, total_tokens,
    workflow_id, execution_id,
    id_tenant, id_contact, id_agent, id_conversation,
    provider, sku, measures,
    base_usd, sell_usd, fx_used, debited_credits
  ) VALUES (
    -- model: mantemos por compatibilidade; para LLM pode ser o sku; para outros também
    p_sku,
    COALESCE((p_measures->>'input_tokens')::int, 0),
    COALESCE((p_measures->>'output_tokens')::int, 0),
    COALESCE((p_measures->>'input_tokens')::int, 0) + COALESCE((p_measures->>'output_tokens')::int, 0),
    p_workflow_id, p_execution_id,
    p_tenant_id, p_contact_id, p_agent_id, p_conversation_id,
    p_provider, p_sku, p_measures,
    v_base_usd, v_sell_usd, v_fx, v_debit_credits
  )
  RETURNING id INTO v_usage_id;

  -- Atualiza saldo
  UPDATE public.wallets
    SET balance_credits = v_new_balance,
        updated_at = now()
  WHERE id = v_wallet_id;

  -- Extrato (meta enxuto)
  INSERT INTO public.ledger_entries (
    tenant_id, wallet_id, direction, amount_credits, balance_after,
    source_type, source_ref, usage_id, description, meta
  ) VALUES (
    p_tenant_id, v_wallet_id, 'debit', v_debit_credits, v_new_balance,
    'usage', 'usages.id=' || v_usage_id::text, v_usage_id,
    'Cobrança de uso IA',
    jsonb_build_object(
      'provider', p_provider,
      'sku', p_sku,
      'measures', p_measures,
      'base_usd', v_base_usd,
      'sell_usd', v_sell_usd,
      'fx_used', v_fx,
      'sell_brl', v_sell_brl,
      'markup_multiplier', v_m_mult,
      'markup_fixed_usd', v_m_fixed,
      'markup_rule_id', v_m_rule
    ) || COALESCE(p_meta,'{}'::jsonb)
  );

  -- ALERTA low balance (anti-spam 6h)
  v_available_after := public.wallet_available_credits(v_new_balance, v_overdraft);

  IF v_notify_low AND v_available_after <= v_threshold THEN
    UPDATE public.wallets
      SET last_low_balance_notified_at = now()
    WHERE tenant_id = p_tenant_id
      AND (last_low_balance_notified_at IS NULL OR last_low_balance_notified_at <= now() - interval '6 hours');

    IF FOUND THEN
      PERFORM public.enqueue_billing_notification(
        p_tenant_id,
        'low_balance',
        'warning',
        'Créditos perto do fim',
        'Seu saldo está baixo. Recarregue créditos para evitar pausa da IA.',
        jsonb_build_object(
          'balance_credits', v_new_balance,
          'available_credits', v_available_after,
          'threshold_credits', v_threshold
        )
      );
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'usage_id', v_usage_id,
    'debited_credits', v_debit_credits,
    'balance_credits', v_new_balance,
    'balance_brl', (v_new_balance / 100.0),
    'sell_usd', v_sell_usd,
    'sell_brl', v_sell_brl
  );
END;
$$;

-- ============================================================================
-- 6) MIGRAÇÃO: ai_models → catálogo pricing (LLM)
-- ============================================================================
-- Cria SKUs e components para cada linha de ai_models
-- provider = 'openai', unit_multiplier para tokens por 1M: 0.000001
-- preço vigente: [now(), infinity)

DO $$
DECLARE
  r record;
  v_sku_id uuid;
  v_in_component_id uuid;
  v_out_component_id uuid;
BEGIN
  FOR r IN SELECT * FROM public.ai_models WHERE is_active = true
  LOOP
    -- SKU
    INSERT INTO public.pricing_skus(provider, sku, description, is_active)
    VALUES ('openai', r.model, 'Migrado de ai_models', true)
    ON CONFLICT (provider, sku) DO UPDATE SET is_active = true
    RETURNING id INTO v_sku_id;

    -- INPUT component
    INSERT INTO public.pricing_components(sku_id, measure_key, unit_multiplier)
    VALUES (v_sku_id, 'input_tokens', 0.000001)
    ON CONFLICT (sku_id, measure_key) DO UPDATE SET unit_multiplier = EXCLUDED.unit_multiplier
    RETURNING id INTO v_in_component_id;

    -- OUTPUT component
    INSERT INTO public.pricing_components(sku_id, measure_key, unit_multiplier)
    VALUES (v_sku_id, 'output_tokens', 0.000001)
    ON CONFLICT (sku_id, measure_key) DO UPDATE SET unit_multiplier = EXCLUDED.unit_multiplier
    RETURNING id INTO v_out_component_id;

    -- Preços vigentes INPUT
    BEGIN
      INSERT INTO public.pricing_component_prices(component_id, usd_per_unit, effective_range)
      VALUES (v_in_component_id, r.input_usd_per_1m, tstzrange(now(), 'infinity', '[)'));
    EXCEPTION WHEN OTHERS THEN
      -- Se já existe vigência atual, mantém o existente
      NULL;
    END;

    -- Preços vigentes OUTPUT
    BEGIN
      INSERT INTO public.pricing_component_prices(component_id, usd_per_unit, effective_range)
      VALUES (v_out_component_id, r.output_usd_per_1m, tstzrange(now(), 'infinity', '[)'));
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- 7) EXEMPLO: ElevenLabs TTS (chars)
-- ============================================================================
-- SKU para TTS padrão com cobrança por caracteres

INSERT INTO public.pricing_skus(provider, sku, description)
VALUES ('elevenlabs', 'tts_standard', 'TTS padrão (cobrança por chars)')
ON CONFLICT (provider, sku) DO NOTHING;

-- Component chars
WITH s AS (
  SELECT id FROM public.pricing_skus WHERE provider = 'elevenlabs' AND sku = 'tts_standard'
)
INSERT INTO public.pricing_components(sku_id, measure_key, unit_multiplier)
SELECT s.id, 'chars', 1.0 FROM s
ON CONFLICT (sku_id, measure_key) DO NOTHING;

-- Preço vigente (EXEMPLO: 0.00002 USD por char - ajuste conforme necessário)
WITH c AS (
  SELECT pc.id
  FROM public.pricing_components pc
  JOIN public.pricing_skus ps ON ps.id = pc.sku_id
  WHERE ps.provider = 'elevenlabs' AND ps.sku = 'tts_standard' AND pc.measure_key = 'chars'
)
INSERT INTO public.pricing_component_prices(component_id, usd_per_unit, effective_range)
SELECT c.id, 0.00002, tstzrange(now(), 'infinity', '[)')
FROM c
WHERE NOT EXISTS (
  SELECT 1 FROM public.pricing_component_prices pcp
  WHERE pcp.component_id = c.id AND now() <@ pcp.effective_range
);

-- ============================================================================
-- 8) MARKUP: Regra padrão global
-- ============================================================================
-- Regra global default: vender 4x tudo (ajuste conforme necessário)

INSERT INTO public.markup_rules(tenant_id, provider, sku, agent_id, multiplier, fixed_usd, priority, is_active)
VALUES (NULL, NULL, NULL, NULL, 4.0, 0.0, 100, true)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9) CÂMBIO INICIAL
-- ============================================================================
-- Insere um câmbio inicial para evitar fallback logo de cara

INSERT INTO public.fx_usd_brl_history(rate, source)
SELECT 5.80, 'migration_seed'
WHERE NOT EXISTS (SELECT 1 FROM public.fx_usd_brl_history LIMIT 1);

-- ============================================================================
-- 10) RLS POLICIES (Opcional - para acesso via frontend)
-- ============================================================================
-- Descomente se quiser aplicar RLS

/*
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: usuários só veem dados do próprio tenant
CREATE POLICY wallets_tenant_isolation ON public.wallets
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY ledger_tenant_isolation ON public.ledger_entries
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY notifications_tenant_isolation ON public.billing_notifications
  FOR ALL USING (tenant_id = (SELECT tenant_id FROM public.users WHERE id = auth.uid()));
*/

-- ============================================================================
-- FIM DA MIGRAÇÃO
-- ============================================================================
