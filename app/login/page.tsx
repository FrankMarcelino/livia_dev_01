import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/login-form';

export default async function LoginPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Se já estiver logado, redireciona para livechat
  if (user) {
    redirect('/livechat');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            LIVIA
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Plataforma de Atendimento com IA
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-zinc-500 dark:text-zinc-500">
          MVP - WhatsApp Customer Service Platform
        </p>
      </div>
    </div>
  );
}
