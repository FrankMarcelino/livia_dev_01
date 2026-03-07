import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ManageUsersContent } from '@/components/admin/manage-users-content';

export default async function GerenciarUsuariosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: userData } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .single();

  if (!userData?.tenant_id) {
    redirect('/aguardando-acesso');
  }

  const tenantId = userData.tenant_id;

  const { data: featureModules } = await supabase
    .from('feature_modules')
    .select('id, key, name, description, icon')
    .order('name');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: tenantUsers } = await (supabase as any)
    .from('users')
    .select('id, full_name, email, avatar_url, modules, role, is_active')
    .eq('tenant_id', tenantId)
    .order('full_name');

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <ManageUsersContent
        featureModules={featureModules || []}
        tenantUsers={tenantUsers || []}
      />
    </div>
  );
}
