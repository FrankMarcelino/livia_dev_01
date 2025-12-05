-- Migration: Add template_id to agents table (VERSÃO CORRIGIDA)
-- Feature: Agent Templates - Meus Agentes IA
-- Date: 2025-12-04
-- 
-- IMPORTANTE: Execute 009a_cleanup_agent_prompts_duplicates.sql ANTES deste script
-- se houver duplicatas na tabela agent_prompts

BEGIN;

-- 1. Adicionar coluna template_id na tabela agents
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL;

-- 2. Adicionar comentário explicativo
COMMENT ON COLUMN agents.template_id IS 'ID do template que originou este agent (rastreabilidade)';

-- 3. Criar índice para performance em queries que filtram por template
CREATE INDEX IF NOT EXISTS idx_agents_template_id ON agents(template_id);

-- 4. Verificar se ainda há duplicatas antes de criar constraint
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT id_agent, id_tenant, COUNT(*) as count
    FROM agent_prompts
    GROUP BY id_agent, id_tenant
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE EXCEPTION 'Ainda existem % combinações duplicadas em agent_prompts. Execute 009a_cleanup_agent_prompts_duplicates.sql primeiro!', duplicate_count;
  END IF;
  
  RAISE NOTICE '✓ Nenhuma duplicata encontrada';
END $$;

-- 5. Criar constraint UNIQUE em agent_prompts (id_agent, id_tenant)
ALTER TABLE agent_prompts
ADD CONSTRAINT agent_prompts_agent_tenant_unique UNIQUE (id_agent, id_tenant);

-- 6. Adicionar comentário na constraint
COMMENT ON CONSTRAINT agent_prompts_agent_tenant_unique ON agent_prompts 
IS 'Garante que cada agent tenha apenas 1 configuração por tenant (NULL = configuração base)';

COMMIT;

-- Verificação pós-migration
DO $$
DECLARE
  template_id_exists BOOLEAN;
  constraint_exists BOOLEAN;
BEGIN
  -- Verificar se coluna foi criada
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' AND column_name = 'template_id'
  ) INTO template_id_exists;
  
  -- Verificar se constraint foi criada
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'agent_prompts_agent_tenant_unique'
  ) INTO constraint_exists;
  
  RAISE NOTICE '=== MIGRATION VERIFICATION ===';
  RAISE NOTICE 'template_id column: %', CASE WHEN template_id_exists THEN '✓ OK' ELSE '✗ FAILED' END;
  RAISE NOTICE 'UNIQUE constraint: %', CASE WHEN constraint_exists THEN '✓ OK' ELSE '✗ FAILED' END;
  
  IF NOT template_id_exists OR NOT constraint_exists THEN
    RAISE EXCEPTION 'Migration failed verification';
  END IF;
  
  RAISE NOTICE '=== MIGRATION COMPLETA ===';
END $$;
