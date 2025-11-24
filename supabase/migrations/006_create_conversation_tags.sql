-- ============================================================================
-- MIGRAÇÃO 006: Tabela conversation_tags para CRM
-- ============================================================================
-- Data: 2025-11-24
-- Descrição: Relacionamento many-to-many entre conversas e tags
-- Feature: CRM Kanban
-- ============================================================================

-- Criar tabela conversation_tags
CREATE TABLE IF NOT EXISTS public.conversation_tags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  tag_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),

  CONSTRAINT conversation_tags_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_tags_conversation_id_fkey
    FOREIGN KEY (conversation_id)
    REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_tags_tag_id_fkey
    FOREIGN KEY (tag_id)
    REFERENCES public.tags(id) ON DELETE CASCADE,
  CONSTRAINT conversation_tags_unique
    UNIQUE (conversation_id, tag_id)
);

-- Comentários
COMMENT ON TABLE public.conversation_tags IS 'Relacionamento many-to-many entre conversas e tags para CRM';
COMMENT ON COLUMN public.conversation_tags.conversation_id IS 'ID da conversa';
COMMENT ON COLUMN public.conversation_tags.tag_id IS 'ID da tag';

-- Índices para performance
CREATE INDEX IF NOT EXISTS conversation_tags_conversation_id_idx
  ON public.conversation_tags(conversation_id);

CREATE INDEX IF NOT EXISTS conversation_tags_tag_id_idx
  ON public.conversation_tags(tag_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;

-- Política RLS: Acesso baseado no tenant da conversa
DROP POLICY IF EXISTS "Acesso baseado na conversa" ON public.conversation_tags;
CREATE POLICY "Acesso baseado na conversa"
ON public.conversation_tags
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    INNER JOIN public.users ON users.tenant_id = conversations.tenant_id
    WHERE conversations.id = conversation_tags.conversation_id
    AND users.id = auth.uid()
  )
);

-- Trigger para updated_at (se necessário no futuro)
-- Por enquanto não tem updated_at, mas deixando preparado

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração 006 executada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '- conversation_tags: NOVA TABELA (many-to-many)';
  RAISE NOTICE '- 2 índices criados para performance';
  RAISE NOTICE '- RLS habilitado com política baseada em tenant';
  RAISE NOTICE '- Constraint UNIQUE (conversation_id, tag_id)';
END $$;
