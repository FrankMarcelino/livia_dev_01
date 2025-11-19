import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout';
import { Header } from '@/components/auth/header';
import { SidebarAutoCollapseWrapper } from '@/components/layout/sidebar-auto-collapse-wrapper';

/**
 * Layout do Dashboard (rotas autenticadas)
 *
 * Princípios SOLID:
 * - Single Responsibility: Gerencia layout de rotas autenticadas
 * - Open/Closed: Extensível via SidebarProvider props
 *
 * Features:
 * - Autenticação obrigatória
 * - Sidebar com auto-collapse no livechat
 * - Header com informações do usuário
 * - SidebarInset para conteúdo principal
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  // Redireciona para login se não autenticado
  if (!authData.user) {
    redirect('/login');
  }

  // Busca dados do usuário
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name, email, avatar_url')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = userData as any;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <Header
          userName={user?.full_name || 'Usuário'}
          userEmail={user?.email}
          avatarUrl={user?.avatar_url}
        />
        <SidebarAutoCollapseWrapper>
          {children}
        </SidebarAutoCollapseWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
