import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { LogOut, Mail, Building2, User as UserIcon } from 'lucide-react';
import { logout } from '@/app/actions/auth';

/**
 * Página de Perfil do Usuário
 *
 * Princípios SOLID:
 * - Single Responsibility: Exibe perfil e configurações do usuário
 * - Server Component: Busca dados no servidor
 *
 * Features:
 * - Informações do usuário e tenant
 * - Controle para pausar/retomar IA
 * - Botão de logout
 */

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  // Redireciona para login se não autenticado
  if (!authData.user) {
    redirect('/login');
  }

  // Busca dados completos do usuário e tenant
  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id, full_name, email, avatar_url, tenants(name, created_at)')
    .eq('id', authData.user.id)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = userData as any;
  const tenant = user?.tenants;

  // Gera iniciais do nome
  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <div className="h-full w-full overflow-y-auto p-6 md:p-8">
      <div className="container max-w-4xl mx-auto space-y-6">
        {/* Header da Página */}
        <div>
        <h1 className="text-3xl font-bold tracking-tight">Perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações e configurações
        </p>
      </div>

      <Separator />

      {/* Card de Informações do Usuário */}
      <Card>
        <CardHeader>
          <CardTitle>Informações do Usuário</CardTitle>
          <CardDescription>
            Seus dados pessoais e informações da conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar e Nome */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {user?.avatar_url && (
                <AvatarImage src={user.avatar_url} alt={user.full_name} />
              )}
              <AvatarFallback className="text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-2xl font-semibold">{user?.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                Membro desde{' '}
                {new Date(authData.user.created_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>

          <Separator />

          {/* Detalhes */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Empresa</p>
                <p className="text-sm text-muted-foreground">
                  {tenant?.name || 'Não informado'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">ID do Usuário</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {authData.user.id}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card de Ações */}
      <Card>
        <CardHeader>
          <CardTitle>Ações da Conta</CardTitle>
          <CardDescription>
            Gerenciar sua sessão e acesso ao sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={logout}>
            <Button
              type="submit"
              variant="destructive"
              className="w-full sm:w-auto gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sair da Conta
            </Button>
          </form>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
