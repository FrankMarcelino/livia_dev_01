-- Tabela para auditoria de mudanças nos dados de contatos
-- Execução: Rodar manualmente no Supabase SQL Editor

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

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_contact_data_changes_contact ON contact_data_changes(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_data_changes_tenant ON contact_data_changes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contact_data_changes_changed_at ON contact_data_changes(changed_at DESC);

-- RLS (Row Level Security)
ALTER TABLE contact_data_changes ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem visualizar mudanças do seu tenant
CREATE POLICY "Users can view changes from their tenant"
  ON contact_data_changes FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));

-- Policy: Usuários podem inserir mudanças
CREATE POLICY "Users can insert changes"
  ON contact_data_changes FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid()));
