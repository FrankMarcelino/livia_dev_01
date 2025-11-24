-- ============================================================================
-- MIGRAÇÃO 008: Adicionar RLS policies na tabela tags
-- ============================================================================
-- Data: 2025-11-24
-- Descrição: Políticas de segurança para permitir acesso às tags por tenant
-- Feature: CRM Kanban
-- ============================================================================

-- Habilitar RLS na tabela tags
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver tags do seu tenant
DROP POLICY IF EXISTS "Users can view tags from their tenant" ON public.tags;
CREATE POLICY "Users can view tags from their tenant"
ON public.tags
FOR SELECT
TO public
USING (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem inserir tags no seu tenant
DROP POLICY IF EXISTS "Users can insert tags in their tenant" ON public.tags;
CREATE POLICY "Users can insert tags in their tenant"
ON public.tags
FOR INSERT
TO public
WITH CHECK (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem atualizar tags do seu tenant
DROP POLICY IF EXISTS "Users can update tags from their tenant" ON public.tags;
CREATE POLICY "Users can update tags from their tenant"
ON public.tags
FOR UPDATE
TO public
USING (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
)
WITH CHECK (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- Policy: Usuários podem deletar tags do seu tenant
DROP POLICY IF EXISTS "Users can delete tags from their tenant" ON public.tags;
CREATE POLICY "Users can delete tags from their tenant"
ON public.tags
FOR DELETE
TO public
USING (
  id_tenant IN (
    SELECT tenant_id FROM public.users WHERE id = auth.uid()
  )
);

-- ============================================================================
-- VALIDAÇÃO FINAL
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migração 008 executada com sucesso!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Resumo:';
  RAISE NOTICE '- RLS habilitado na tabela tags';
  RAISE NOTICE '- 4 políticas criadas (SELECT, INSERT, UPDATE, DELETE)';
  RAISE NOTICE '- Acesso baseado em tenant_id do usuário logado';
END $$;
