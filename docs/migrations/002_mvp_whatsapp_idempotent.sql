-- ============================================================================
-- MIGRAÇÃO 002 (MVP WhatsApp): Melhorias Essenciais - IDEMPOTENTE
-- ============================================================================
-- Data: 2025-11-17
-- Descrição: Versão SIMPLIFICADA e IDEMPOTENTE focada apenas em WhatsApp
--
-- IMPORTANTE:
-- - Pode ser executada múltiplas vezes sem erro
-- - Execute este script DEPOIS do schema base estar criado
-- - Base vetorial gerenciada pelo n8n (sem pgvector no frontend)
-- ============================================================================

-- ============================================================================
-- 1. MELHORIAS EM SYNAPSES (ESSENCIAL)
-- ============================================================================

-- Adicionar campo content (CRÍTICO para Base de Conhecimento)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'synapses'
    AND column_name = 'content'
  ) THEN
    ALTER TABLE public.synapses ADD COLUMN content text NOT NULL DEFAULT '';
  END IF;
END $$;

-- Adicionar campo is_enabled (CRÍTICO para controle de publicação)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'synapses'
    AND column_name = 'is_enabled'
  ) THEN
    ALTER TABLE public.synapses ADD COLUMN is_enabled boolean NOT NULL DEFAULT true;
  END IF;
END $$;

COMMENT ON COLUMN public.synapses.content IS 'Conteúdo principal da synapse usado pela IA';
COMMENT ON COLUMN public.synapses.is_enabled IS 'Indica se a synapse está ativa para uso em produção';

-- ============================================================================
-- 2. SINCRONIZAÇÃO COM N8N (ESSENCIAL)
-- ============================================================================

-- IDs externos para sincronizar com n8n/WhatsApp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'contacts'
    AND column_name = 'external_contact_id'
  ) THEN
    ALTER TABLE public.contacts ADD COLUMN external_contact_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'messages'
    AND column_name = 'external_message_id'
  ) THEN
    ALTER TABLE public.messages ADD COLUMN external_message_id text;
  END IF;
END $$;

-- Criar índices para busca rápida
CREATE INDEX IF NOT EXISTS contacts_external_contact_id_idx
ON public.contacts(external_contact_id);

CREATE INDEX IF NOT EXISTS messages_external_message_id_idx
ON public.messages(external_message_id);

COMMENT ON COLUMN public.contacts.external_contact_id IS 'ID do contato no WhatsApp (ex: 5511999999999@c.us)';
COMMENT ON COLUMN public.messages.external_message_id IS 'ID da mensagem no WhatsApp para evitar duplicação';

-- ============================================================================
-- 3. LIGAR users.id COM auth.users (ESSENCIAL para login)
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
    AND table_name = 'users'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

COMMENT ON CONSTRAINT users_id_fkey ON public.users IS 'Link com sistema de autenticação do Supabase';

-- ============================================================================
-- 4. TRIGGERS PARA AUDITORIA AUTOMÁTICA (BOA PRÁTICA)
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND column_name = 'updated_at'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON public.%I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
    ', tbl, tbl, tbl, tbl);
  END LOOP;
END $$;

-- ============================================================================
-- 5. VALIDAÇÕES BÁSICAS (PREVINE BUGS)
-- ============================================================================

-- Garantir que synapses publicadas tenham conteúdo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_published_has_content'
    AND conrelid = 'public.synapses'::regclass
  ) THEN
    ALTER TABLE public.synapses
    ADD CONSTRAINT check_published_has_content
    CHECK (
      status != 'publishing' OR
      (content IS NOT NULL AND length(content) > 0)
    );
  END IF;
END $$;

-- Garantir que mensagens de IA tenham agent_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_ai_message_has_agent'
    AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT check_ai_message_has_agent
    CHECK (
      sender_type != 'ai' OR sender_agent_id IS NOT NULL
    );
  END IF;
END $$;

-- Garantir que mensagens de attendant tenham user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'check_attendant_message_has_user'
    AND conrelid = 'public.messages'::regclass
  ) THEN
    ALTER TABLE public.messages
    ADD CONSTRAINT check_attendant_message_has_user
    CHECK (
      sender_type != 'attendant' OR sender_user_id IS NOT NULL
    );
  END IF;
END $$;

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração 002 MVP WhatsApp executada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo das alterações:';
  RAISE NOTICE '- synapses: +2 campos (content, is_enabled)';
  RAISE NOTICE '- contacts: +1 campo (external_contact_id)';
  RAISE NOTICE '- messages: +1 campo (external_message_id)';
  RAISE NOTICE '- users: +1 FK (auth.users)';
  RAISE NOTICE '- Triggers automáticos para updated_at';
  RAISE NOTICE '- Constraints de validação (3 regras)';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 MVP FOCADO: Apenas WhatsApp';
  RAISE NOTICE '⚠️  Base vetorial gerenciada pelo n8n';
  RAISE NOTICE '✨ Migração IDEMPOTENTE - pode ser executada múltiplas vezes!';
END $$;
