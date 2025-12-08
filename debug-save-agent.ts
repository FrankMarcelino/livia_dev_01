
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Testing Admin Save (Upsert)...');

async function debugSave() {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing env vars');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const agentId = '27fe4af1-53fb-490c-b92f-8516cd45e9a3'; // ISP Padrao
  const tenantId = '31701213-794d-43c3-a74a-50d57fcd9d2b'; // Signum Tenant

  console.log(`Attempting to UPSERT Intention Prompt for:`);
  console.log(`Agent: ${agentId}`);
  console.log(`Tenant: ${tenantId}`);

  const payload = {
    id_agent: agentId,
    id_tenant: tenantId,
    prompt: 'TESTE DE DEBUG: Prompt salvo via script de debug ' + new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('agent_prompts_intention')
    .upsert(payload, {
      onConflict: 'id_agent, id_tenant'
    })
    .select()
    .single();

  if (error) {
    console.error('❌ ERROR saving prompt:', JSON.stringify(error, null, 2));
  } else {
    console.log('✅ SUCCESS saving prompt:', data);
  }
}

debugSave();
