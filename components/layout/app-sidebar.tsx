'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { navItems } from './nav-items';
import { cn } from '@/lib/utils';
import { SidebarFooter } from '@/components/ui/sidebar';
import { SidebarUserProfile } from './sidebar-user-profile';

/**
 * Componente principal do Sidebar do LIVIA
 *
 * Princípios SOLID:
 * - Single Responsibility: Renderiza sidebar completo (toggle + navegação + perfil)
 * - Open/Closed: Extensível via navItems, fechado para modificação
 * - Dependency Inversion: Depende da abstração Sidebar (shadcn)
 *
 * Features:
 * - Toggle integrado no header (sempre acessível, expandido ou colapsado)
 * - Auto-collapse no livechat (gerenciado pelo hook no layout)
 * - Modo icon quando collapsed
 * - Link ativo destacado
 * - Footer com perfil do usuário clicável
 * - Layout responsivo (toggle + logo alinhados quando expandido, empilhados quando colapsado)
 * - Acessibilidade completa
 */

interface AppSidebarProps {
  userName?: string;
  tenantName?: string;
  avatarUrl?: string;
}

export function AppSidebar({
  userName = 'Usuário',
  tenantName,
  avatarUrl,
}: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        {/* Layout quando EXPANDIDO: Toggle + Logo na mesma linha */}
        <div className="flex h-14 items-center justify-between px-2 gap-2 group-data-[collapsible=icon]:hidden">
          <SidebarTrigger />
          <Link
            href="/livechat"
            className="flex-1 flex items-center justify-center font-bold text-sidebar-foreground"
          >
            <Image
              src="/logo.png"
              alt="LIVIA"
              width={100}
              height={28}
              className="object-contain"
              priority
            />
          </Link>
          <div className="w-8" /> {/* Spacer para balancear visualmente */}
        </div>

        {/* Layout quando COLAPSADO: Logo no topo, Toggle embaixo */}
        <div className="hidden group-data-[collapsible=icon]:flex flex-col items-center py-3 gap-3">
          <Link
            href="/livechat"
            className="flex items-center font-bold text-sidebar-foreground"
          >
            <Image
              src="/icon.png"
              alt="LIVIA"
              width={24}
              height={24}
              className="object-contain"
              priority
            />
          </Link>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);

                return (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon
                          className={cn(
                            'h-4 w-4',
                            isActive && 'text-primary'
                          )}
                        />
                        <span className="flex items-center gap-2">
                          {item.title}
                          {item.badge === 'BETA' && (
                            <span className="text-[10px] font-normal text-muted-foreground">
                              BETA
                            </span>
                          )}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarUserProfile
          userName={userName}
          tenantName={tenantName}
          avatarUrl={avatarUrl}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
