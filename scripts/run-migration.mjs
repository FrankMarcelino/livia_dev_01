import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrationSQL = readFileSync('./migrations/005_alter_quick_reply_templates.sql', 'utf-8');

console.log('Running migration: 005_alter_quick_reply_templates.sql');
console.log('SQL:', migrationSQL);

// Split by semicolons and execute each statement
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--'));

for (const statement of statements) {
  if (!statement) continue;

  console.log(`\nExecuting: ${statement.substring(0, 100)}...`);

  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: statement
  });

  if (error) {
    console.error('Error:', error);
    // Try direct execution
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({ query: statement })
    });

    if (!response.ok) {
      console.error('Failed to execute statement');
    } else {
      console.log('✓ Statement executed successfully');
    }
  } else {
    console.log('✓ Statement executed successfully');
  }
}

console.log('\n✅ Migration completed!');
