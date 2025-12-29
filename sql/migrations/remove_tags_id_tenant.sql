-- ============================================================================
-- Migration: Remove id_tenant from tags table
-- ============================================================================
-- Data: 2025-12-29
-- Descrição: Remove coluna id_tenant da tabela tags (agora usa id_neurocore)
--
-- IMPORTANTE: Execute esta migration APÓS migrate_tags_to_neurocore.sql
--
-- Pré-requisitos:
-- - Todas as tags devem ter id_neurocore preenchido
-- - Código atualizado para usar id_neurocore ao invés de id_tenant
-- ============================================================================

BEGIN;

-- ============================================================================
-- PASSO 1: Verificar se migration anterior foi executada
-- ============================================================================

DO $$
DECLARE
  tags_without_neurocore INT;
  total_tags INT;
BEGIN
  -- Contar tags sem neurocore
  SELECT COUNT(*)
  INTO tags_without_neurocore
  FROM tags
  WHERE id_neurocore IS NULL;

  -- Contar total de tags
  SELECT COUNT(*)
  INTO total_tags
  FROM tags;

  RAISE NOTICE '📊 Total de tags: %', total_tags;
  RAISE NOTICE '⚠️  Tags sem neurocore: %', tags_without_neurocore;

  -- Se houver tags sem neurocore, abortar
  IF tags_without_neurocore > 0 THEN
    RAISE EXCEPTION 'ABORTAR: Existem % tags sem id_neurocore. Execute migrate_tags_to_neurocore.sql primeiro!', tags_without_neurocore;
  END IF;

  RAISE NOTICE '✅ Todas as tags têm id_neurocore. Prosseguindo...';
END $$;

-- ============================================================================
-- PASSO 2: Remover Foreign Key Constraint
-- ============================================================================

-- Verificar se constraint existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_id_tenant_fkey'
  ) THEN
    ALTER TABLE tags DROP CONSTRAINT tags_id_tenant_fkey;
    RAISE NOTICE '🗑️  Foreign key constraint "tags_id_tenant_fkey" removida';
  ELSE
    RAISE NOTICE 'ℹ️  Constraint "tags_id_tenant_fkey" não existe (já foi removida)';
  END IF;
END $$;

-- ============================================================================
-- PASSO 3: Remover Coluna id_tenant
-- ============================================================================

-- Verificar se coluna existe
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tags'
      AND column_name = 'id_tenant'
  ) THEN
    ALTER TABLE tags DROP COLUMN id_tenant;
    RAISE NOTICE '🗑️  Coluna "id_tenant" removida da tabela tags';
  ELSE
    RAISE NOTICE 'ℹ️  Coluna "id_tenant" não existe (já foi removida)';
  END IF;
END $$;

-- ============================================================================
-- PASSO 4: Verificar estrutura final
-- ============================================================================

DO $$
DECLARE
  has_id_tenant BOOLEAN;
  has_id_neurocore BOOLEAN;
BEGIN
  -- Verificar colunas
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tags' AND column_name = 'id_tenant'
  ) INTO has_id_tenant;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tags' AND column_name = 'id_neurocore'
  ) INTO has_id_neurocore;

  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICAÇÃO FINAL:';
  RAISE NOTICE '  - Coluna id_tenant existe? %', CASE WHEN has_id_tenant THEN 'SIM ❌' ELSE 'NÃO ✅' END;
  RAISE NOTICE '  - Coluna id_neurocore existe? %', CASE WHEN has_id_neurocore THEN 'SIM ✅' ELSE 'NÃO ❌' END;
  RAISE NOTICE '';

  IF has_id_tenant THEN
    RAISE EXCEPTION 'ERRO: Coluna id_tenant ainda existe!';
  END IF;

  IF NOT has_id_neurocore THEN
    RAISE EXCEPTION 'ERRO: Coluna id_neurocore não existe!';
  END IF;

  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '   Tags agora usam APENAS id_neurocore';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMO PASSO: Regenerar types do Supabase:';
  RAISE NOTICE '   npx supabase gen types typescript --project-id wfrxwfbslhkkzkexyilx > types/database.ts';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (se necessário)
-- ============================================================================
-- SE ALGO DER ERRADO, execute:
--
-- BEGIN;
-- ALTER TABLE tags ADD COLUMN id_tenant UUID;
--
-- -- Restaurar valores a partir do id_neurocore
-- UPDATE tags
-- SET id_tenant = (
--   SELECT id
--   FROM tenants
--   WHERE neurocore_id = tags.id_neurocore
--   LIMIT 1
-- );
--
-- -- Recriar foreign key
-- ALTER TABLE tags
-- ADD CONSTRAINT tags_id_tenant_fkey
-- FOREIGN KEY (id_tenant) REFERENCES tenants(id);
--
-- COMMIT;
-- ============================================================================
