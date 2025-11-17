// Script de teste de conexão com Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wfrxwfbslhkkzkexyilx.supabase.co';
// Usar Service Role Key para testes (ignora RLS)
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

console.log('🔗 Testando conexão com Supabase (Service Role)...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  try {
    // Teste 1: Verificar conexão básica
    console.log('\n📊 Teste 1: Listando tabelas disponíveis...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .limit(5);

    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError.message);
    } else {
      console.log('✅ Tenants encontrados:', tenants?.length || 0);
      if (tenants && tenants.length > 0) {
        console.log('   Primeiros tenants:', tenants);
      }
    }

    // Teste 2: Verificar tabela de usuários
    console.log('\n👥 Teste 2: Verificando usuários...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, full_name, email, tenant_id')
      .limit(5);

    if (usersError) {
      console.error('❌ Erro ao buscar users:', usersError.message);
    } else {
      console.log('✅ Usuários encontrados:', users?.length || 0);
      if (users && users.length > 0) {
        console.log('   Primeiros usuários:', users);
      }
    }

    // Teste 3: Verificar contatos
    console.log('\n📇 Teste 3: Verificando contatos...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id, name, phone, status')
      .limit(5);

    if (contactsError) {
      console.error('❌ Erro ao buscar contacts:', contactsError.message);
    } else {
      console.log('✅ Contatos encontrados:', contacts?.length || 0);
      if (contacts && contacts.length > 0) {
        console.log('   Primeiros contatos:', contacts);
      }
    }

    // Teste 4: Verificar conversas
    console.log('\n💬 Teste 4: Verificando conversas...');
    const { data: conversations, error: conversationsError } = await supabase
      .from('conversations')
      .select('id, status, ia_active')
      .limit(5);

    if (conversationsError) {
      console.error('❌ Erro ao buscar conversations:', conversationsError.message);
    } else {
      console.log('✅ Conversas encontradas:', conversations?.length || 0);
      if (conversations && conversations.length > 0) {
        console.log('   Primeiras conversas:', conversations);
      }
    }

    console.log('\n✅ Teste de conexão concluído!');

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error);
  }
}

testConnection();
