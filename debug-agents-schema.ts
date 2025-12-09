import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function checkSchema() {
  const supabase = createClient(supabaseUrl, supabaseKey);

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
  console.log('Sample data:', JSON.stringify(data, null, 2));
}

checkSchema();
