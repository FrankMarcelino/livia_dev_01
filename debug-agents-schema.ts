
import { createClient } from './lib/supabase/client';

async function checkSchema() {
  const supabase = createClient();
  
  console.log('Fetching one agent to check schema...');
  const { data, error } = await supabase
    .from('agents')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Agent keys:', Object.keys(data));
  console.log('is_intent_agent value:', data.is_intent_agent);
}

checkSchema();
