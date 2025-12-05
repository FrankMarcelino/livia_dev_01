-- Tabela para feedback de mensagens da IA
-- Execução: Rodar manualmente no Supabase SQL Editor

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_message_feedback_message ON message_feedback(message_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_conversation ON message_feedback(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_tenant ON message_feedback(tenant_id);
CREATE INDEX IF NOT EXISTS idx_message_feedback_created_at ON message_feedback(created_at DESC);

-- RLS (Row Level Security)
ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem visualizar feedback do seu tenant
CREATE POLICY "Users can view feedback from their tenant"
  ON message_feedback FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Policy: Usuários podem inserir feedback
CREATE POLICY "Users can insert feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Policy: Usuários podem atualizar seu próprio feedback
CREATE POLICY "Users can update their own feedback"
  ON message_feedback FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
