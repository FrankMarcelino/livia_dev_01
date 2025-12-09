
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function debugFetch() {
  console.log('URL:', supabaseUrl);
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. List one agent to get an ID
  const { data: agents } = await supabase.from('agents').select('id, name, type').limit(5);
  console.log('Agents found:', agents?.length);
  if (!agents?.length) return;

  const agent = agents[0];
  if (!agent) {
    console.log('No agent found');
    return;
  }
  console.log(`Checking agent: ${agent.name} (${agent.id}) type=${agent.type}`);

  // 2. Try to fetch global intention prompt
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: globalIntention, error: errorIntention } = await (supabase as any)
    .from('agent_prompts_intention')
    .select('*')
    .eq('id_agent', agent.id)
    .is('id_tenant', null);

  console.log('Global Intention Fetch Result:', {
    found: globalIntention?.length,
    data: globalIntention,
    error: errorIntention
  });

  // 3. Try to fetch global observer prompt
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: globalObserver, error: errorObserver } = await (supabase as any)
    .from('agent_prompts_observer')
    .select('*')
    .eq('id_agent', agent.id)
    .is('id_tenant', null);

  console.log('Global Observer Fetch Result:', {
    found: globalObserver?.length,
    data: globalObserver,
    error: errorObserver
  });
}

debugFetch();
