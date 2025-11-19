'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Hook que gerencia o auto-collapse do sidebar baseado na rota atual
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia auto-collapse baseado em rota
 * - Dependency Inversion: Depende da abstração useSidebar
 *
 * @param autoCollapseRoutes - Array de rotas que devem auto-collapse o sidebar
 * @example
 * ```tsx
 * useSidebarAutoCollapse(['/livechat']);
 * ```
 */
export function useSidebarAutoCollapse(autoCollapseRoutes: string[] = []) {
  const pathname = usePathname();
  const { setOpen, isMobile } = useSidebar();

  useEffect(() => {
    // Não aplicar auto-collapse em mobile (usa sheet)
    if (isMobile) return;

    // Verifica se a rota atual está na lista de auto-collapse
    const shouldCollapse = autoCollapseRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Auto-collapse: colapsa se estiver na rota, expande se sair dela
    setOpen(!shouldCollapse);
  }, [pathname, setOpen, isMobile, autoCollapseRoutes]);
}
