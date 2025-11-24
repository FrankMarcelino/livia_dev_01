'use client';

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
} from '@/components/ui/sidebar';
import { navItems } from './nav-items';
import { cn } from '@/lib/utils';

/**
 * Componente principal do Sidebar do LIVIA
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas renderiza o sidebar
 * - Open/Closed: Extensível via navItems, fechado para modificação
 * - Dependency Inversion: Depende da abstração Sidebar (shadcn)
 *
 * Features:
 * - Auto-collapse no livechat (gerenciado pelo hook no layout)
 * - Modo icon quando collapsed
 * - Link ativo destacado
 * - Acessibilidade completa
 */
export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" variant="sidebar">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex h-14 items-center px-4">
          <Link
            href="/livechat"
            className="flex items-center gap-2 font-bold text-sidebar-foreground"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              L
            </div>
            <span className="group-data-[collapsible=icon]:hidden">LIVIA</span>
          </Link>
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
    </Sidebar>
  );
}
