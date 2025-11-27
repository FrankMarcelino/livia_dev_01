'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SidebarMenuButton } from '@/components/ui/sidebar';
import { User } from 'lucide-react';

/**
 * Componente de perfil do usuário no footer do Sidebar
 *
 * Princípios SOLID:
 * - Single Responsibility: Exibe avatar + nome, navega para /perfil
 * - Interface Segregation: Props mínimas (userName, tenantName, avatarUrl)
 * - Dependency Inversion: Usa abstrações do shadcn (Avatar, SidebarMenuButton)
 *
 * Features:
 * - Avatar com fallback de iniciais
 * - Tooltip quando sidebar colapsado
 * - Navegação para /perfil ao clicar
 * - Exibe nome do tenant quando expandido
 */

interface SidebarUserProfileProps {
  userName: string;
  tenantName?: string;
  avatarUrl?: string;
}

export function SidebarUserProfile({
  userName,
  tenantName,
  avatarUrl,
}: SidebarUserProfileProps) {
  const router = useRouter();

  // Gera iniciais do nome
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <SidebarMenuButton
      size="lg"
      tooltip={`${userName} - Ver perfil`}
      onClick={() => router.push('/perfil')}
      className="cursor-pointer"
    >
      <Avatar className="h-8 w-8 rounded-lg">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={userName} />}
        <AvatarFallback className="rounded-lg">
          {initials || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-semibold">{userName}</span>
        {tenantName && (
          <span className="truncate text-xs text-muted-foreground">
            {tenantName}
          </span>
        )}
      </div>
    </SidebarMenuButton>
  );
}
