
import { createClient } from './lib/supabase/client';

async function listAgentTypes() {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('agents')
    .select('name, type')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Agents data:');
  console.table(data);
}

listAgentTypes();
