import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getAllTags, getConversationsWithTags } from '@/lib/queries/crm';
import { CRMKanbanBoard } from '@/components/crm';

/**
 * CRM Page - Página principal do CRM Kanban
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas carrega dados e renderiza board
 * - Dependency Inversion: Usa abstrações (queries, components)
 *
 * Features:
 * - Autenticação obrigatória
 * - Carrega tags e conversas do tenant
 * - Server Component (dados carregados no servidor)
 * - Passa dados para Client Component (CRMKanbanBoard)
 */
export default async function CRMPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  // Validar autenticação
  if (!authData.user) {
    redirect('/login');
  }

  // Buscar tenant_id do usuário
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', authData.user.id)
    .single();

  const tenantId = userData?.tenant_id;

  if (!tenantId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-muted-foreground">
          Erro: Usuário sem tenant associado
        </p>
      </div>
    );
  }

  // Buscar dados do CRM
  // Usamos getAllTags para mostrar tags inativas também (com indicador)
  const tags = await getAllTags(tenantId);
  const conversations = await getConversationsWithTags(tenantId);

  return (
    <CRMKanbanBoard
      initialTags={tags}
      initialConversations={conversations}
      tenantId={tenantId}
    />
  );
}
