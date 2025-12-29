-- ============================================================================
-- Migration: Remove id_tenant from tags table (v2 - com RLS policies)
-- ============================================================================
-- Data: 2025-12-29
-- Descrição: Remove coluna id_tenant e atualiza RLS policies para usar id_neurocore
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
-- PASSO 2: Remover RLS Policies antigas (que usam id_tenant)
-- ============================================================================

DO $$
BEGIN
  -- Listar policies que vamos remover
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Removendo RLS Policies antigas (baseadas em id_tenant)...';

  -- Remover cada policy (se existir)
  DROP POLICY IF EXISTS "Users can view tags from their tenant" ON tags;
  RAISE NOTICE '   ✓ Removida: Users can view tags from their tenant';

  DROP POLICY IF EXISTS "Users can insert tags in their tenant" ON tags;
  RAISE NOTICE '   ✓ Removida: Users can insert tags in their tenant';

  DROP POLICY IF EXISTS "Users can update tags from their tenant" ON tags;
  RAISE NOTICE '   ✓ Removida: Users can update tags from their tenant';

  DROP POLICY IF EXISTS "Users can delete tags from their tenant" ON tags;
  RAISE NOTICE '   ✓ Removida: Users can delete tags from their tenant';

  DROP POLICY IF EXISTS "Users can manage tags from their tenant" ON tags;
  RAISE NOTICE '   ✓ Removida: Users can manage tags from their tenant';

  RAISE NOTICE '✅ Policies antigas removidas';
END $$;

-- ============================================================================
-- PASSO 3: Criar novas RLS Policies (usando id_neurocore)
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 Criando novas RLS Policies (baseadas em id_neurocore)...';
END $$;

-- Policy para SELECT (visualizar tags do neurocore do usuário)
CREATE POLICY "Users can view tags from their neurocore"
ON tags FOR SELECT
USING (
  id_neurocore IN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = (
      SELECT tenant_id
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Policy para INSERT (criar tags no neurocore do usuário)
CREATE POLICY "Users can insert tags in their neurocore"
ON tags FOR INSERT
WITH CHECK (
  id_neurocore IN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = (
      SELECT tenant_id
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Policy para UPDATE (atualizar tags do neurocore do usuário)
CREATE POLICY "Users can update tags from their neurocore"
ON tags FOR UPDATE
USING (
  id_neurocore IN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = (
      SELECT tenant_id
      FROM users
      WHERE id = auth.uid()
    )
  )
)
WITH CHECK (
  id_neurocore IN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = (
      SELECT tenant_id
      FROM users
      WHERE id = auth.uid()
    )
  )
);

-- Policy para DELETE (deletar tags do neurocore do usuário)
CREATE POLICY "Users can delete tags from their neurocore"
ON tags FOR DELETE
USING (
  id_neurocore IN (
    SELECT neurocore_id
    FROM tenants
    WHERE id = (
      SELECT tenant_id
      FROM users
      WHERE id = auth.uid()
    )
  )
);

DO $$
BEGIN
  RAISE NOTICE '✅ Novas policies criadas com sucesso';
END $$;

-- ============================================================================
-- PASSO 4: Remover Foreign Key Constraint
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Removendo Foreign Key Constraint...';

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_id_tenant_fkey'
  ) THEN
    ALTER TABLE tags DROP CONSTRAINT tags_id_tenant_fkey;
    RAISE NOTICE '   ✓ Foreign key "tags_id_tenant_fkey" removida';
  ELSE
    RAISE NOTICE '   ℹ️  Constraint já foi removida anteriormente';
  END IF;
END $$;

-- ============================================================================
-- PASSO 5: Remover Coluna id_tenant
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🗑️  Removendo coluna id_tenant...';

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'tags'
      AND column_name = 'id_tenant'
  ) THEN
    ALTER TABLE tags DROP COLUMN id_tenant;
    RAISE NOTICE '   ✓ Coluna "id_tenant" removida';
  ELSE
    RAISE NOTICE '   ℹ️  Coluna já foi removida anteriormente';
  END IF;
END $$;

-- ============================================================================
-- PASSO 6: Verificar estrutura final
-- ============================================================================

DO $$
DECLARE
  has_id_tenant BOOLEAN;
  has_id_neurocore BOOLEAN;
  policy_count INT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 VERIFICAÇÃO FINAL:';
  RAISE NOTICE '';

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

  -- Contar policies
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'tags'
    AND policyname LIKE '%neurocore%';

  RAISE NOTICE '  📋 Estrutura da Tabela:';
  RAISE NOTICE '    - Coluna id_tenant existe? %', CASE WHEN has_id_tenant THEN 'SIM ❌' ELSE 'NÃO ✅' END;
  RAISE NOTICE '    - Coluna id_neurocore existe? %', CASE WHEN has_id_neurocore THEN 'SIM ✅' ELSE 'NÃO ❌' END;
  RAISE NOTICE '';
  RAISE NOTICE '  🔐 RLS Policies:';
  RAISE NOTICE '    - Policies com neurocore: %', policy_count;
  RAISE NOTICE '';

  -- Validar
  IF has_id_tenant THEN
    RAISE EXCEPTION 'ERRO: Coluna id_tenant ainda existe!';
  END IF;

  IF NOT has_id_neurocore THEN
    RAISE EXCEPTION 'ERRO: Coluna id_neurocore não existe!';
  END IF;

  IF policy_count < 4 THEN
    RAISE WARNING 'ATENÇÃO: Apenas % policies criadas (esperado: 4)', policy_count;
  END IF;

  RAISE NOTICE '✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '';
  RAISE NOTICE '  📝 Resumo:';
  RAISE NOTICE '    - Tags agora usam APENAS id_neurocore';
  RAISE NOTICE '    - RLS Policies atualizadas para filtrar por neurocore';
  RAISE NOTICE '    - Segurança multi-tenant mantida';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  PRÓXIMO PASSO: Regenerar types do Supabase:';
  RAISE NOTICE '    npx supabase gen types typescript --project-id wfrxwfbslhkkzkexyilx > types/database.ts';
  RAISE NOTICE '';
END $$;

COMMIT;

-- ============================================================================
-- ROLLBACK (se necessário)
-- ============================================================================
-- SE ALGO DER ERRADO, execute:
--
-- BEGIN;
--
-- -- 1. Recriar coluna
-- ALTER TABLE tags ADD COLUMN id_tenant UUID;
--
-- -- 2. Restaurar valores a partir do id_neurocore
-- UPDATE tags
-- SET id_tenant = (
--   SELECT id
--   FROM tenants
--   WHERE neurocore_id = tags.id_neurocore
--   LIMIT 1
-- );
--
-- -- 3. Recriar foreign key
-- ALTER TABLE tags
-- ADD CONSTRAINT tags_id_tenant_fkey
-- FOREIGN KEY (id_tenant) REFERENCES tenants(id);
--
-- -- 4. Remover policies novas
-- DROP POLICY IF EXISTS "Users can view tags from their neurocore" ON tags;
-- DROP POLICY IF EXISTS "Users can insert tags in their neurocore" ON tags;
-- DROP POLICY IF EXISTS "Users can update tags from their neurocore" ON tags;
-- DROP POLICY IF EXISTS "Users can delete tags from their neurocore" ON tags;
--
-- -- 5. Recriar policies antigas
-- CREATE POLICY "Users can view tags from their tenant" ON tags
-- FOR SELECT USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));
--
-- CREATE POLICY "Users can insert tags in their tenant" ON tags
-- FOR INSERT WITH CHECK (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));
--
-- CREATE POLICY "Users can update tags from their tenant" ON tags
-- FOR UPDATE USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));
--
-- CREATE POLICY "Users can delete tags from their tenant" ON tags
-- FOR DELETE USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));
--
-- COMMIT;
-- ============================================================================
