// Script para verificar se as tabelas existem
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas...\n');

  const tablesToCheck = [
    'contacts',
    'conversations',
    'messages',
    'users',
    'quick_reply_templates',
  ];

  for (const table of tablesToCheck) {
    console.log(`📋 Tabela: ${table}`);

    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`   ❌ Erro: ${error.message}`);
      console.log(`   Code: ${error.code}\n`);
    } else {
      console.log(`   ✅ Existe (${count || 0} registros)\n`);
    }
  }

  // Tentar query específica que está falhando
  console.log('\n🔍 Testando query do Livechat...\n');

  const { data: contacts, error: contactError } = await supabase
    .from('contacts')
    .select('*, conversations(*, messages(*))')
    .limit(1);

  if (contactError) {
    console.log('❌ Query falhou:');
    console.log('   Erro:', contactError.message);
    console.log('   Code:', contactError.code);
    console.log('   Details:', contactError.details);
    console.log('   Hint:', contactError.hint);
  } else {
    console.log('✅ Query funcionou!');
    console.log('   Retornou:', contacts?.length || 0, 'contato(s)');
  }
}

checkTables();
