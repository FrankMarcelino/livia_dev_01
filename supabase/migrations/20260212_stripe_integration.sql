-- ============================================================================
-- Stripe Integration Migration
-- Adds Stripe billing support to existing billing system
-- ============================================================================

-- 1. New columns on tenants (1:1 with Stripe Customer)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS stripe_customer_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS subscription_status text DEFAULT 'inactive'
    CHECK (subscription_status IN ('active', 'trialing', 'past_due', 'canceled', 'inactive')),
  ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end boolean DEFAULT false;

-- 2. subscription_plans table (catalog)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  price_brl integer NOT NULL, -- centavos
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  features jsonb DEFAULT '[]'::jsonb,
  credits_included integer DEFAULT 0,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. stripe_checkout_sessions table (tracking + idempotency)
CREATE TABLE IF NOT EXISTS stripe_checkout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id),
  stripe_session_id text NOT NULL UNIQUE,
  mode text NOT NULL CHECK (mode IN ('payment', 'subscription')),
  amount_cents integer,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_tenant
  ON stripe_checkout_sessions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_stripe_checkout_sessions_stripe_id
  ON stripe_checkout_sessions(stripe_session_id);

-- 4. Unique partial index on ledger_entries.source_ref for webhook idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_entries_source_ref_unique
  ON ledger_entries(source_ref)
  WHERE source_ref IS NOT NULL;

-- 5. Update billing_notifications type constraint to include 'payment_failed'
-- Drop old constraint and add new one
DO $$
BEGIN
  -- Try to drop the old constraint (may have different names)
  BEGIN
    ALTER TABLE billing_notifications DROP CONSTRAINT IF EXISTS billing_notifications_type_check;
  EXCEPTION WHEN undefined_object THEN
    NULL;
  END;

  -- Add new constraint with payment_failed
  ALTER TABLE billing_notifications
    ADD CONSTRAINT billing_notifications_type_check
    CHECK (type IN ('low_balance', 'hard_stop', 'recovered', 'payment_failed'));
END $$;

-- 6. RLS policies for new tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_checkout_sessions ENABLE ROW LEVEL SECURITY;

-- subscription_plans: readable by all authenticated users
CREATE POLICY "subscription_plans_select_authenticated"
  ON subscription_plans FOR SELECT
  TO authenticated
  USING (true);

-- stripe_checkout_sessions: users can only see their tenant's sessions
CREATE POLICY "stripe_checkout_sessions_select_own_tenant"
  ON stripe_checkout_sessions FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- stripe_checkout_sessions: service role can insert/update (via webhook)
CREATE POLICY "stripe_checkout_sessions_insert_service"
  ON stripe_checkout_sessions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "stripe_checkout_sessions_update_service"
  ON stripe_checkout_sessions FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed initial subscription plan (R$300/month maintenance)
INSERT INTO subscription_plans (stripe_price_id, name, description, price_brl, interval, features, credits_included, is_active, sort_order)
VALUES (
  'price_1T013rDEUygXcdQuBKzSh65c',
  'Manutenção Mensal',
  'Plano de manutenção mensal - Sistema online e suporte',
  30000,
  'month',
  '["Sistema online 24/7", "Suporte técnico", "Atualizações do sistema"]'::jsonb,
  0,
  true,
  1
)
ON CONFLICT (stripe_price_id) DO NOTHING;
