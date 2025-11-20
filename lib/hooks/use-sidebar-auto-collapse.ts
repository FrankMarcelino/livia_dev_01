'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSidebar } from '@/components/ui/sidebar';

/**
 * Hook que gerencia o auto-collapse do sidebar baseado na rota atual
 *
 * Princípios SOLID:
 * - Single Responsibility: Apenas gerencia auto-collapse baseado em rota
 * - Dependency Inversion: Depende da abstração useSidebar
 *
 * Features:
 * - Define estado inicial ao entrar na rota
 * - Não interfere com toggle manual do usuário
 * - Apenas aplica auto-collapse na primeira vez que entra na rota
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
  const previousPathname = useRef(pathname);
  const isFirstMount = useRef(true);

  useEffect(() => {
    // Se não é o primeiro mount E a rota não mudou, ignora
    if (!isFirstMount.current && previousPathname.current === pathname) {
      return;
    }

    // Verifica se a rota atual está na lista de auto-collapse
    const shouldCollapse = autoCollapseRoutes.some((route) =>
      pathname.startsWith(route)
    );

    // Auto-collapse: define estado inicial baseado na rota
    // Funciona tanto no primeiro mount quanto em mudanças de rota
    setOpen(!shouldCollapse);

    // Atualiza flags
    previousPathname.current = pathname;
    isFirstMount.current = false;
  }, [pathname, setOpen, isMobile, autoCollapseRoutes]);
}
