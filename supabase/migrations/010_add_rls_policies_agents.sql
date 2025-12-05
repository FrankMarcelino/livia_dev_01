-- Migration: Add RLS Policies for Agent Templates Feature
-- Feature: Meus Agentes IA - Row Level Security
-- Date: 2025-12-04
--
-- Cria policies de RLS para garantir isolamento multi-tenant
-- nas tabelas: agents, agent_prompts, agent_templates

-- =============================================================================
-- 1. ATIVAR RLS NAS TABELAS (se ainda não estiver ativo)
-- =============================================================================

ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 2. POLICIES PARA TABELA: agents
-- =============================================================================

-- Policy: Tenants podem visualizar agents que possuem prompts associados ao seu tenant
-- Usa uma abordagem através do relacionamento agent_prompts
DROP POLICY IF EXISTS "Tenants can view their own agents" ON agents;

CREATE POLICY "Tenants can view their own agents"
  ON agents
  FOR SELECT
  USING (
    -- Permite ver agents que têm prompts para o tenant do usuário
    EXISTS (
      SELECT 1
      FROM agent_prompts ap
      WHERE ap.id_agent = agents.id
      AND ap.id_tenant = (
        SELECT tenant_id FROM users WHERE id = auth.uid()
      )
    )
  );

COMMENT ON POLICY "Tenants can view their own agents" ON agents
IS 'Tenants podem visualizar apenas agents que possuem prompts personalizados para eles';

-- =============================================================================
-- 3. POLICIES PARA TABELA: agent_prompts
-- =============================================================================

-- Policy: Tenants podem visualizar apenas seus próprios prompts
DROP POLICY IF EXISTS "Tenants can view their own prompts" ON agent_prompts;

CREATE POLICY "Tenants can view their own prompts"
  ON agent_prompts
  FOR SELECT
  USING (
    -- Permite ver prompts do próprio tenant
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
    OR
    -- Permite ver prompts base (id_tenant = NULL) para referência
    id_tenant IS NULL
  );

COMMENT ON POLICY "Tenants can view their own prompts" ON agent_prompts
IS 'Tenants podem visualizar seus prompts personalizados e os prompts base (para reset)';

-- Policy: Tenants podem atualizar apenas seus próprios prompts
DROP POLICY IF EXISTS "Tenants can update their own prompts" ON agent_prompts;

CREATE POLICY "Tenants can update their own prompts"
  ON agent_prompts
  FOR UPDATE
  USING (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Tenants can update their own prompts" ON agent_prompts
IS 'Tenants podem atualizar apenas seus próprios prompts (não podem alterar prompts base)';

-- Policy: Tenants podem inserir novos prompts (caso necessário no futuro)
DROP POLICY IF EXISTS "Tenants can insert their own prompts" ON agent_prompts;

CREATE POLICY "Tenants can insert their own prompts"
  ON agent_prompts
  FOR INSERT
  WITH CHECK (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

COMMENT ON POLICY "Tenants can insert their own prompts" ON agent_prompts
IS 'Tenants podem criar novos prompts personalizados (caso não existam)';

-- =============================================================================
-- 4. POLICIES PARA TABELA: agent_templates
-- =============================================================================

-- Policy: Todos os usuários autenticados podem visualizar templates ativos
DROP POLICY IF EXISTS "Users can view active templates" ON agent_templates;

CREATE POLICY "Users can view active templates"
  ON agent_templates
  FOR SELECT
  USING (is_active = true);

COMMENT ON POLICY "Users can view active templates" ON agent_templates
IS 'Usuários autenticados podem visualizar templates ativos (read-only, para rastreabilidade)';

-- =============================================================================
-- 5. POLICY ADICIONAL: Super Admins podem gerenciar tudo
-- =============================================================================

-- Para agents: Super Admins têm acesso total
DROP POLICY IF EXISTS "Super Admins have full access to agents" ON agents;

CREATE POLICY "Super Admins have full access to agents"
  ON agents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Para agent_prompts: Super Admins têm acesso total
DROP POLICY IF EXISTS "Super Admins have full access to agent_prompts" ON agent_prompts;

CREATE POLICY "Super Admins have full access to agent_prompts"
  ON agent_prompts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- Para agent_templates: Super Admins têm acesso total
DROP POLICY IF EXISTS "Super Admins have full access to agent_templates" ON agent_templates;

CREATE POLICY "Super Admins have full access to agent_templates"
  ON agent_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'super_admin'
    )
  );

-- =============================================================================
-- VERIFICAÇÃO PÓS-MIGRATION
-- =============================================================================

DO $$
DECLARE
  agents_policies_count INTEGER;
  agent_prompts_policies_count INTEGER;
  agent_templates_policies_count INTEGER;
  policy_rec RECORD;
BEGIN
  -- Contar policies em agents
  SELECT COUNT(*) INTO agents_policies_count
  FROM pg_policies
  WHERE tablename = 'agents';

  -- Contar policies em agent_prompts
  SELECT COUNT(*) INTO agent_prompts_policies_count
  FROM pg_policies
  WHERE tablename = 'agent_prompts';

  -- Contar policies em agent_templates
  SELECT COUNT(*) INTO agent_templates_policies_count
  FROM pg_policies
  WHERE tablename = 'agent_templates';

  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE 'Policies em agents: %', agents_policies_count;
  RAISE NOTICE 'Policies em agent_prompts: %', agent_prompts_policies_count;
  RAISE NOTICE 'Policies em agent_templates: %', agent_templates_policies_count;

  -- Listar policies criadas
  RAISE NOTICE '';
  RAISE NOTICE '=== POLICIES CRIADAS ===';
  RAISE NOTICE '';

  FOR policy_rec IN
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE tablename IN ('agents', 'agent_prompts', 'agent_templates')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE '✓ % - % (%)',
      policy_rec.tablename,
      policy_rec.policyname,
      policy_rec.cmd;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '=== MIGRATION COMPLETA ===';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  ATENÇÃO: Teste as policies com usuários diferentes antes de ir para produção!';
  RAISE NOTICE '   1. Teste tenant A não consegue ver dados do tenant B';
  RAISE NOTICE '   2. Teste tenant pode apenas atualizar seus próprios prompts';
  RAISE NOTICE '   3. Teste super_admin tem acesso completo';
END $$;
