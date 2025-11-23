// Simple script to apply migration
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const migrationSQL = readFileSync('./migrations/005_alter_quick_reply_templates.sql', 'utf-8');

console.log('🔄 Applying migration: 005_alter_quick_reply_templates.sql\n');

try {
  // Use Supabase's SQL execution endpoint
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: migrationSQL })
  });

  if (!response.ok) {
    console.error(`❌ Response status: ${response.status}`);
    const text = await response.text();
    console.error('Response:', text);
    throw new Error('Migration failed');
  }

  console.log('✅ Migration applied successfully!');
  console.log('\nColumns added:');
  console.log('  - active: BOOLEAN (default true)');
  console.log('  - created_by: UUID (nullable)');
  console.log('\nIndexes created:');
  console.log('  - idx_quick_reply_templates_active');
  console.log('  - idx_quick_reply_templates_tenant_active');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n📝 Please apply the migration manually:');
  console.log('1. Go to: https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new');
  console.log('2. Copy and execute this SQL:\n');
  console.log('----------------------------------------');
  console.log(migrationSQL);
  console.log('----------------------------------------');
  process.exit(1);
}
