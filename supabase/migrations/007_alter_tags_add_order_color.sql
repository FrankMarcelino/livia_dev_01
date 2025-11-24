-- ============================================================================
-- MIGRAÇÃO 007: Adicionar order_index e color na tabela tags
-- ============================================================================
-- Data: 2025-11-24
-- Descrição: Campos para ordenação e visualização de tags no CRM
-- Feature: CRM Kanban
-- ============================================================================

-- Adicionar campo order_index para ordenação manual das colunas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tags'
    AND column_name = 'order_index'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN order_index integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Adicionar campo color para personalização visual
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'tags'
    AND column_name = 'color'
  ) THEN
    ALTER TABLE public.tags ADD COLUMN color text NOT NULL DEFAULT '#3b82f6';
  END IF;
END $$;

-- Comentários
COMMENT ON COLUMN public.tags.order_index IS 'Ordem de exibição das colunas no Kanban CRM (menor = mais à esquerda)';
COMMENT ON COLUMN public.tags.color IS 'Cor hexadecimal para representação visual da tag no UI';

-- Índice para ordenação eficiente
CREATE INDEX IF NOT EXISTS tags_order_index_idx
  ON public.tags(order_index);

-- Índice composto para queries do CRM (tenant + ativo + ordenação)
CREATE INDEX IF NOT EXISTS tags_tenant_active_order_idx
  ON public.tags(id_tenant, active, order_index);

-- ============================================================================
-- ATUALIZAR TAGS EXISTENTES COM ORDER_INDEX SEQUENCIAL
-- ============================================================================

-- Atualizar order_index baseado em created_at (ordem de criação)
DO $$
DECLARE
  tag_record RECORD;
  counter INTEGER := 0;
BEGIN
  FOR tag_record IN
    SELECT id FROM public.tags ORDER BY created_at ASC
  LOOP
    UPDATE public.tags
    SET order_index = counter
    WHERE id = tag_record.id;

    counter := counter + 1;
  END LOOP;

  RAISE NOTICE '✅ Atualizados % tags com order_index sequencial', counter;
END $$;

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração 007 executada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '- tags: +2 campos (order_index, color)';
  RAISE NOTICE '- 2 índices criados para performance';
  RAISE NOTICE '- Tags existentes atualizadas com order_index sequencial';
  RAISE NOTICE '- Cor padrão: #3b82f6 (azul)';
END $$;
