-- ============================================
-- SCRIPT CONSOLIDADO - LIVIA MVP
-- Executar no Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. TABELA: contact_data_changes (Auditoria)
-- ============================================

CREATE TABLE IF NOT EXISTS contact_data_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contact_data_changes_contact ON contact_data_changes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_data_changes_tenant ON contact_data_changes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_data_changes_changed_at ON contact_data_changes(changed_at DESC);

ALTER TABLE contact_data_changes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view changes from their tenant" ON contact_data_changes;
CREATE POLICY "Users can view changes from their tenant"
  ON contact_data_changes FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert changes" ON contact_data_changes;
CREATE POLICY "Users can insert changes"
  ON contact_data_changes FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- ============================================
-- 2. TABELA: message_feedback
-- ============================================

CREATE TABLE IF NOT EXISTS message_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  message_id UUID NOT NULL REFERENCES messages(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_feedback_message ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_conversation ON message_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_tenant ON message_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_created_at ON message_feedback(created_at DESC);

ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view feedback from their tenant" ON message_feedback;
CREATE POLICY "Users can view feedback from their tenant"
  ON message_feedback FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can insert feedback" ON message_feedback;
CREATE POLICY "Users can insert feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can update their own feedback" ON message_feedback;
CREATE POLICY "Users can update their own feedback"
  ON message_feedback FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================
-- 3. FUNCTION: increment_quick_reply_usage (OPCIONAL)
-- ============================================

CREATE OR REPLACE FUNCTION increment_quick_reply_usage(reply_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quick_reply_templates
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FIM DO SCRIPT
-- ============================================
