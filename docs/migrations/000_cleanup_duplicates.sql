-- ============================================================================
-- SCRIPT DE LIMPEZA: Remove constraints duplicadas
-- ============================================================================
-- Use este script APENAS se você recebeu erros de "constraint already exists"
-- ============================================================================

-- Remove constraint duplicada que causou o erro
ALTER TABLE IF EXISTS public.conversation_state_history
DROP CONSTRAINT IF EXISTS conversation_state_history_changed_by_user_id_fkey;

-- Remove outras constraints que podem ter sido criadas parcialmente
ALTER TABLE IF EXISTS public.synapse_embeddings
DROP CONSTRAINT IF EXISTS synapse_embeddings_synapse_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.synapse_embeddings
DROP CONSTRAINT IF EXISTS synapse_embeddings_tenant_id_fkey CASCADE;

ALTER TABLE IF EXISTS public.conversations
DROP CONSTRAINT IF EXISTS conversations_ia_paused_by_user_id_fkey;

-- Remove tabela synapse_embeddings se existir (n8n gerencia base vetorial)
DROP TABLE IF EXISTS public.synapse_embeddings CASCADE;

-- Remove políticas RLS duplicadas
DROP POLICY IF EXISTS "Acesso total por tenant" ON public.synapse_embeddings;

DO $$
BEGIN
  RAISE NOTICE '✅ Limpeza concluída! Agora você pode rodar a migração idempotente.';
END $$;
