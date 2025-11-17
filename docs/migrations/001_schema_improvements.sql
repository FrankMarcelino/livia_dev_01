-- ============================================================================
-- MIGRAÇÃO 001: Melhorias Críticas no Schema LIVIA
-- ============================================================================
-- Data: 2025-11-16
-- Descrição: Adiciona campos e tabelas necessárias para funcionalidades do MVP
--
-- IMPORTANTE: Execute este script DEPOIS do schema base estar criado
-- ============================================================================

-- ============================================================================
-- 1. MELHORIAS EM SYNAPSES
-- ============================================================================

-- Adicionar campo content (conteúdo principal da synapse)
ALTER TABLE public.synapses
ADD COLUMN IF NOT EXISTS content text NOT NULL DEFAULT '';

-- Adicionar campo is_enabled (controle de ativação)
ALTER TABLE public.synapses
ADD COLUMN IF NOT EXISTS is_enabled boolean NOT NULL DEFAULT true;

-- Comentário explicativo
COMMENT ON COLUMN public.synapses.content IS 'Conteúdo principal da synapse usado pela IA';
COMMENT ON COLUMN public.synapses.is_enabled IS 'Indica se a synapse está ativa para uso em produção';

-- ============================================================================
-- 2. CRIAR TABELA DE EMBEDDINGS (BASE VETORIAL)
-- ============================================================================

-- Habilitar extensão pgvector (se ainda não estiver)
CREATE EXTENSION IF NOT EXISTS vector;

-- Criar tabela de embeddings
CREATE TABLE IF NOT EXISTS public.synapse_embeddings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  synapse_id uuid NOT NULL,
  tenant_id uuid NOT NULL,
  chunk_index integer NOT NULL DEFAULT 0,
  chunk_content text NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 embeddings
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT synapse_embeddings_pkey PRIMARY KEY (id),
  CONSTRAINT synapse_embeddings_synapse_id_fkey FOREIGN KEY (synapse_id) REFERENCES public.synapses(id) ON DELETE CASCADE,
  CONSTRAINT synapse_embeddings_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id)
);

-- Criar índice para busca vetorial (IVFFlat)
CREATE INDEX IF NOT EXISTS synapse_embeddings_vector_idx
ON public.synapse_embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Criar índice para consultas por synapse_id
CREATE INDEX IF NOT EXISTS synapse_embeddings_synapse_id_idx
ON public.synapse_embeddings(synapse_id);

-- Habilitar RLS
ALTER TABLE public.synapse_embeddings ENABLE ROW LEVEL SECURITY;

-- Política RLS: Acesso por tenant
DROP POLICY IF EXISTS "Acesso total por tenant" ON public.synapse_embeddings;
CREATE POLICY "Acesso total por tenant"
ON public.synapse_embeddings
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.tenant_id = synapse_embeddings.tenant_id
  )
);

-- ============================================================================
-- 3. MELHORIAS EM CONVERSATIONS (PAUSA POR USUÁRIO)
-- ============================================================================

-- Adicionar campos para rastrear pausa manual da IA
ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS ia_paused_by_user_id uuid REFERENCES public.users(id);

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS ia_paused_at timestamp with time zone;

ALTER TABLE public.conversations
ADD COLUMN IF NOT EXISTS ia_pause_reason text;

-- Comentários
COMMENT ON COLUMN public.conversations.ia_paused_by_user_id IS 'Usuário que pausou manualmente a IA nesta conversa';
COMMENT ON COLUMN public.conversations.ia_paused_at IS 'Timestamp de quando a IA foi pausada';
COMMENT ON COLUMN public.conversations.ia_pause_reason IS 'Motivo da pausa manual da IA';

-- ============================================================================
-- 4. ADICIONAR 'system' EM message_sender_type_enum
-- ============================================================================

-- Adicionar novo valor ao enum existente
ALTER TYPE public.message_sender_type_enum ADD VALUE IF NOT EXISTS 'system';

-- ============================================================================
-- 5. ADICIONAR channel_id EM CONTACTS E MESSAGES
-- ============================================================================

-- Adicionar channel_id em contacts
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id);

-- Adicionar ID externo do contato no provedor
ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS external_contact_id text;

-- Criar índice para busca por external_contact_id
CREATE INDEX IF NOT EXISTS contacts_external_contact_id_idx
ON public.contacts(external_contact_id);

-- Adicionar channel_id em messages
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS channel_id uuid REFERENCES public.channels(id);

-- Adicionar ID externo da mensagem no provedor
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS external_message_id text;

-- Criar índice para busca por external_message_id
CREATE INDEX IF NOT EXISTS messages_external_message_id_idx
ON public.messages(external_message_id);

-- ============================================================================
-- 6. LIGAR users.id COM auth.users
-- ============================================================================

-- ATENÇÃO: Esta alteração requer que a tabela users esteja vazia ou
-- que todos os IDs já correspondam a IDs válidos em auth.users

-- Adicionar constraint de foreign key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_id_fkey'
    AND table_name = 'users'
  ) THEN
    ALTER TABLE public.users
    ADD CONSTRAINT users_id_fkey
    FOREIGN KEY (id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- 7. CRIAR TABELA DE HISTÓRICO DE ESTADOS DE CONVERSA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.conversation_state_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  from_status public.conversation_status_enum,
  to_status public.conversation_status_enum NOT NULL,
  changed_by_user_id uuid REFERENCES public.users(id),
  reason_id uuid REFERENCES public.conversation_reasons_pauses_and_closures(id),
  notes text,
  ia_active_before boolean,
  ia_active_after boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_state_history_pkey PRIMARY KEY (id),
  CONSTRAINT conversation_state_history_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE,
  CONSTRAINT conversation_state_history_changed_by_user_id_fkey FOREIGN KEY (changed_by_user_id) REFERENCES public.users(id),
  CONSTRAINT conversation_state_history_reason_id_fkey FOREIGN KEY (reason_id) REFERENCES public.conversation_reasons_pauses_and_closures(id)
);

-- Criar índice para consultas por conversation_id
CREATE INDEX IF NOT EXISTS conversation_state_history_conversation_id_idx
ON public.conversation_state_history(conversation_id);

-- Criar índice para consultas ordenadas por created_at
CREATE INDEX IF NOT EXISTS conversation_state_history_created_at_idx
ON public.conversation_state_history(created_at DESC);

-- Habilitar RLS
ALTER TABLE public.conversation_state_history ENABLE ROW LEVEL SECURITY;

-- Política RLS: Acesso baseado na conversa
DROP POLICY IF EXISTS "Acesso baseado na conversa" ON public.conversation_state_history;
CREATE POLICY "Acesso baseado na conversa"
ON public.conversation_state_history
FOR ALL
TO public
USING (
  EXISTS (
    SELECT 1 FROM public.conversations
    INNER JOIN public.users ON users.tenant_id = conversations.tenant_id
    WHERE conversations.id = conversation_state_history.conversation_id
    AND users.id = auth.uid()
  )
);

-- ============================================================================
-- 8. MELHORIAS EM quick_reply_templates
-- ============================================================================

-- Adicionar categorização
ALTER TABLE public.quick_reply_templates
ADD COLUMN IF NOT EXISTS category text;

-- Adicionar tags
ALTER TABLE public.quick_reply_templates
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}'::text[];

-- Adicionar controle de ativação
ALTER TABLE public.quick_reply_templates
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Criar índice GIN para busca em tags
CREATE INDEX IF NOT EXISTS quick_reply_templates_tags_idx
ON public.quick_reply_templates USING gin(tags);

-- ============================================================================
-- 9. TRIGGERS PARA AUDITORIA AUTOMÁTICA
-- ============================================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas que precisam
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
-- 10. VALIDAÇÕES E CONSTRAINTS ADICIONAIS
-- ============================================================================

-- Garantir que synapses publicadas tenham conteúdo
ALTER TABLE public.synapses
ADD CONSTRAINT check_published_has_content
CHECK (
  status != 'publishing' OR
  (content IS NOT NULL AND length(content) > 0)
);

-- Garantir que mensagens de IA tenham agent_id
ALTER TABLE public.messages
ADD CONSTRAINT check_ai_message_has_agent
CHECK (
  sender_type != 'ai' OR sender_agent_id IS NOT NULL
);

-- Garantir que mensagens de attendant tenham user_id
ALTER TABLE public.messages
ADD CONSTRAINT check_attendant_message_has_user
CHECK (
  sender_type != 'attendant' OR sender_user_id IS NOT NULL
);

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração 001 executada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo das alterações:';
  RAISE NOTICE '- synapses: +2 campos (content, is_enabled)';
  RAISE NOTICE '- synapse_embeddings: NOVA TABELA (base vetorial)';
  RAISE NOTICE '- conversations: +3 campos (ia_paused_*)';
  RAISE NOTICE '- message_sender_type_enum: +1 valor (system)';
  RAISE NOTICE '- contacts: +2 campos (channel_id, external_contact_id)';
  RAISE NOTICE '- messages: +2 campos (channel_id, external_message_id)';
  RAISE NOTICE '- users: +1 FK (auth.users)';
  RAISE NOTICE '- conversation_state_history: NOVA TABELA';
  RAISE NOTICE '- quick_reply_templates: +3 campos (category, tags, is_active)';
  RAISE NOTICE '- Triggers automáticos para updated_at';
  RAISE NOTICE '- Constraints de validação adicionais';
END $$;
