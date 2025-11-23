-- Migration: Alter quick_reply_templates table
-- Description: Adiciona campos active e created_by à tabela existente quick_reply_templates
-- Date: 2025-11-22

-- Adicionar coluna active (default true para manter compatibilidade)
ALTER TABLE quick_reply_templates
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

-- Adicionar coluna created_by (nullable inicialmente para dados existentes)
ALTER TABLE quick_reply_templates
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Comentários nas novas colunas
COMMENT ON COLUMN quick_reply_templates.active IS 'Se a mensagem está ativa/disponível para uso';
COMMENT ON COLUMN quick_reply_templates.created_by IS 'Usuário que criou a mensagem rápida';

-- Adicionar índice para performance em queries filtradas por active
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_active
ON quick_reply_templates(active);

-- Adicionar índice composto para tenant + active
CREATE INDEX IF NOT EXISTS idx_quick_reply_templates_tenant_active
ON quick_reply_templates(tenant_id, active);

-- Atualizar a policy de INSERT para incluir created_by
DROP POLICY IF EXISTS quick_reply_templates_insert_policy ON quick_reply_templates;

CREATE POLICY quick_reply_templates_insert_policy ON quick_reply_templates
  FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
