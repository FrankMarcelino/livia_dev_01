-- ============================================================================
-- Migração: Adicionar hierarquia de Base de Conhecimento
-- ============================================================================
-- Descrição:
--   Esta migração cria bases de conhecimento padrão para cada tenant existente
--   e migra synapses órfãs (com baseConhecimentoId = '00000000...') para
--   essas bases padrão.
--
-- Execução:
--   Execute este script via Supabase Dashboard > SQL Editor
--
-- Reversão:
--   Não recomendado após dados serem criados, mas se necessário:
--   - Volte base_conhecimento_id das synapses para '00000000-0000-0000-0000-000000000000'
--   - Delete as bases criadas
-- ============================================================================

BEGIN;

-- ============================================================================
-- Passo 1: Criar base de conhecimento padrão para cada tenant
-- ============================================================================
-- Cria uma base chamada "Base Padrão" para cada tenant que ainda não tem nenhuma base

INSERT INTO base_conhecimentos (id, tenant_id, neurocore_id, name, description, is_active)
SELECT
  gen_random_uuid() AS id,
  t.id AS tenant_id,
  t.neurocore_id,
  'Base Padrão' AS name,
  'Base de conhecimento criada automaticamente durante a migração para hierarquia de bases.' AS description,
  true AS is_active
FROM tenants t
WHERE NOT EXISTS (
  -- Apenas cria se o tenant não tem nenhuma base ainda
  SELECT 1
  FROM base_conhecimentos bc
  WHERE bc.tenant_id = t.id
);

-- Log: Quantas bases foram criadas
DO $$
DECLARE
  created_count INTEGER;
BEGIN
  GET DIAGNOSTICS created_count = ROW_COUNT;
  RAISE NOTICE 'Passo 1: % bases padrão criadas', created_count;
END $$;

-- ============================================================================
-- Passo 2: Migrar synapses órfãs para a base padrão
-- ============================================================================
-- Atualiza synapses que apontam para o UUID zerado (hardcoded) para apontar
-- para a base padrão do tenant

UPDATE synapses s
SET base_conhecimento_id = (
  SELECT bc.id
  FROM base_conhecimentos bc
  WHERE bc.tenant_id = s.tenant_id
  ORDER BY bc.created_at ASC  -- Pega a base mais antiga (provavelmente a padrão)
  LIMIT 1
)
WHERE s.base_conhecimento_id = '00000000-0000-0000-0000-000000000000';

-- Log: Quantas synapses foram migradas
DO $$
DECLARE
  migrated_count INTEGER;
BEGIN
  GET DIAGNOSTICS migrated_count = ROW_COUNT;
  RAISE NOTICE 'Passo 2: % synapses migradas para bases padrão', migrated_count;
END $$;

-- ============================================================================
-- Passo 3: Validação
-- ============================================================================
-- Verifica se ainda existem synapses órfãs

DO $$
DECLARE
  orphan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphan_count
  FROM synapses
  WHERE base_conhecimento_id = '00000000-0000-0000-0000-000000000000';

  IF orphan_count > 0 THEN
    RAISE WARNING 'Atenção: Ainda existem % synapses órfãs. Verifique se todos os tenants têm bases de conhecimento.', orphan_count;
  ELSE
    RAISE NOTICE 'Validação OK: Todas as synapses foram migradas com sucesso!';
  END IF;
END $$;

-- ============================================================================
-- Passo 4: Estatísticas finais
-- ============================================================================

SELECT
  'Estatísticas da Migração' AS info,
  (SELECT COUNT(*) FROM base_conhecimentos) AS total_bases,
  (SELECT COUNT(*) FROM synapses) AS total_synapses,
  (SELECT COUNT(*) FROM synapses WHERE base_conhecimento_id != '00000000-0000-0000-0000-000000000000') AS synapses_migradas;

COMMIT;

-- ============================================================================
-- Fim da migração
-- ============================================================================
--
-- Próximos passos após executar esta migração:
-- 1. Verificar no Supabase Dashboard que as bases foram criadas
-- 2. Acessar /knowledge-base no app e verificar que a UI mostra a hierarquia
-- 3. Testar criar novas bases e synapses
-- 4. (Opcional) Renomear "Base Padrão" para algo mais descritivo via UI
--
-- ============================================================================
