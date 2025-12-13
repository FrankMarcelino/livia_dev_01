import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout';
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
 * - Toggle integrado no header do sidebar (sempre acessível)
 * - Footer do sidebar com perfil clicável
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

  // Busca dados do usuário e tenant
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name, email, avatar_url, tenants(name)')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = userData as any;
  const tenantName = user?.tenants?.name;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        userName={user?.full_name || 'Usuário'}
        tenantName={tenantName}
        avatarUrl={user?.avatar_url}
      />
      <SidebarInset className="flex flex-col w-full h-screen overflow-x-hidden pl-4 md:pl-6">
        <SidebarAutoCollapseWrapper>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </SidebarAutoCollapseWrapper>
      </SidebarInset>
    </SidebarProvider>
  );
}
