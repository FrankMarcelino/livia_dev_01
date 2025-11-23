// Simple script to apply migration using Supabase REST API
const https = require('https');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Read migration file
const migrationSQL = fs.readFileSync('./migrations/005_alter_quick_reply_templates.sql', 'utf-8');

console.log('🔄 Applying migration: 005_alter_quick_reply_templates.sql\n');

// Execute SQL via Supabase SQL API (using PostgREST query)
const url = new URL(`${SUPABASE_URL}/rest/v1/rpc/exec`);

const postData = JSON.stringify({
  sql: migrationSQL
});

const options = {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_KEY,
    'Authorization': `Bearer ${SERVICE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(url, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration applied successfully!');
      console.log('\nColumns added:');
      console.log('  - active: BOOLEAN (default true)');
      console.log('  - created_by: UUID (nullable)');
      console.log('\nIndexes created:');
      console.log('  - idx_quick_reply_templates_active');
      console.log('  - idx_quick_reply_templates_tenant_active');
    } else {
      console.error(`❌ Migration failed with status ${res.statusCode}`);
      console.error('Response:', data);
      console.log('\n📝 Please apply the migration manually in Supabase SQL Editor:');
      console.log('\n' + migrationSQL);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error applying migration:', error.message);
  console.log('\n📝 Please apply the migration manually in Supabase SQL Editor:');
  console.log('1. Go to https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new');
  console.log('2. Copy and paste the following SQL:\n');
  console.log(migrationSQL);
});

req.write(postData);
req.end();
