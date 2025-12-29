-- ============================================================================
-- Migration: Tags from Tenant to Neurocore
-- ============================================================================
-- Data: 2025-12-29
-- Descrição: Migra associação de tags de id_tenant para id_neurocore
--
-- IMPORTANTE: Execute esta migration APÓS deploy do código atualizado
--
-- Antes:  tags.id_tenant → tenant.id
-- Depois: tags.id_neurocore → neurocore.id (via tenant.neurocore_id)
-- ============================================================================

BEGIN;

-- Verificar quantas tags serão afetadas
DO $$
DECLARE
  tags_to_migrate INT;
BEGIN
  SELECT COUNT(*)
  INTO tags_to_migrate
  FROM tags
  WHERE id_neurocore IS NULL
    AND id_tenant IS NOT NULL;

  RAISE NOTICE '📊 Tags a serem migradas: %', tags_to_migrate;
END $$;

-- ============================================================================
-- PASSO 1: Atualizar id_neurocore nas tags existentes
-- ============================================================================

UPDATE tags
SET id_neurocore = (
  SELECT neurocore_id
  FROM tenants
  WHERE tenants.id = tags.id_tenant
  LIMIT 1
)
WHERE id_neurocore IS NULL
  AND id_tenant IS NOT NULL;

-- Verificar resultado
DO $$
DECLARE
  tags_migrated INT;
  tags_remaining INT;
BEGIN
  SELECT COUNT(*)
  INTO tags_migrated
  FROM tags
  WHERE id_neurocore IS NOT NULL;

  SELECT COUNT(*)
  INTO tags_remaining
  FROM tags
  WHERE id_neurocore IS NULL;

  RAISE NOTICE '✅ Tags migradas (com neurocore): %', tags_migrated;
  RAISE NOTICE '⚠️  Tags ainda sem neurocore: %', tags_remaining;

  IF tags_remaining > 0 THEN
    RAISE WARNING 'Existem tags sem neurocore_id. Verifique se há tenants sem neurocore associado.';
  END IF;
END $$;

-- ============================================================================
-- PASSO 2 (OPCIONAL): Limpar id_tenant após migração
-- ============================================================================
-- DESCOMENTE as linhas abaixo se quiser remover id_tenant completamente
-- Recomendado apenas após testar e confirmar que tudo está funcionando

-- UPDATE tags
-- SET id_tenant = NULL
-- WHERE id_neurocore IS NOT NULL;

-- RAISE NOTICE '🧹 Campo id_tenant limpo (definido como NULL)';

-- ============================================================================
-- PASSO 3: Validação final
-- ============================================================================

DO $$
DECLARE
  total_tags INT;
  tags_with_neurocore INT;
  tags_without_neurocore INT;
BEGIN
  SELECT COUNT(*) INTO total_tags FROM tags;
  SELECT COUNT(*) INTO tags_with_neurocore FROM tags WHERE id_neurocore IS NOT NULL;
  SELECT COUNT(*) INTO tags_without_neurocore FROM tags WHERE id_neurocore IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO DA MIGRAÇÃO:';
  RAISE NOTICE '  Total de tags: %', total_tags;
  RAISE NOTICE '  Tags com neurocore: %', tags_with_neurocore;
  RAISE NOTICE '  Tags sem neurocore: %', tags_without_neurocore;
  RAISE NOTICE '';

  IF tags_without_neurocore > 0 THEN
    RAISE WARNING '⚠️  Algumas tags ainda não têm neurocore_id. Investigue antes de prosseguir.';
  ELSE
    RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
--
-- 1. Esta migration é IDEMPOTENTE - pode ser executada múltiplas vezes
-- 2. Não deleta dados, apenas atualiza id_neurocore
-- 3. O campo id_tenant é mantido por segurança (pode ser removido depois)
-- 4. Após executar, teste no browser se as tags aparecem corretamente
-- 5. Caso algo dê errado, o id_tenant ainda está lá para rollback
--
-- ROLLBACK (se necessário):
-- UPDATE tags SET id_neurocore = NULL WHERE id_tenant IS NOT NULL;
-- ============================================================================
