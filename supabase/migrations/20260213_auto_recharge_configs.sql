-- Auto-Recharge Configs table
-- Stores per-tenant auto-recharge settings with Stripe payment method

CREATE TABLE IF NOT EXISTS auto_recharge_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  threshold_credits INTEGER NOT NULL,
  recharge_amount_cents INTEGER NOT NULL,
  stripe_payment_method_id TEXT NOT NULL,
  card_last4 TEXT,
  card_brand TEXT,
  last_triggered_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Enable RLS
ALTER TABLE auto_recharge_configs ENABLE ROW LEVEL SECURITY;

-- Policy: tenant can read own config
CREATE POLICY "Tenants can read own auto_recharge_configs"
  ON auto_recharge_configs FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM users WHERE id = auth.uid()
  ));

-- Policy: service_role can manage all (for webhooks/backend)
CREATE POLICY "Service role can manage auto_recharge_configs"
  ON auto_recharge_configs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for efficient lookup
CREATE INDEX IF NOT EXISTS idx_auto_recharge_configs_tenant_id
  ON auto_recharge_configs(tenant_id);

CREATE INDEX IF NOT EXISTS idx_auto_recharge_configs_enabled
  ON auto_recharge_configs(is_enabled, threshold_credits);
