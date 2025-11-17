// Script para criar usuário de teste
// Usage: node scripts/create-test-user.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Ler .env.local manualmente
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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltam variáveis de ambiente');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function createTestUser() {
  console.log('🔐 Criando usuário de teste...\n');

  const testEmail = 'admin@empresademo.com';
  const testPassword = 'admin123';

  try {
    // 1. Criar usuário no auth.users
    console.log('1. Criando usuário no Supabase Auth...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true, // Auto-confirmar email
    });

    if (authError) {
      // Se usuário já existe, tentar buscar
      if (authError.message.includes('already registered')) {
        console.log('   ℹ️  Usuário já existe no auth, buscando...');
        const { data: { users } } = await supabase.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === testEmail);

        if (!existingUser) {
          throw new Error('Usuário existe mas não foi encontrado');
        }

        console.log(`   ✅ Usuário encontrado: ${existingUser.id}`);

        // Verificar se existe na tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', existingUser.id)
          .single();

        if (userData) {
          console.log('   ✅ Usuário já existe na tabela users');
          console.log('\n✅ Credenciais de teste:');
          console.log(`   Email: ${testEmail}`);
          console.log(`   Senha: ${testPassword}`);
          return;
        }

        // Se não existe na tabela, criar
        authData.user = existingUser;
      } else {
        throw authError;
      }
    } else {
      console.log(`   ✅ Usuário criado: ${authData.user.id}`);
    }

    // 2. Buscar tenant da seed
    console.log('\n2. Buscando tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .limit(1)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Nenhum tenant encontrado. Execute seed-database.js primeiro.');
    }

    console.log(`   ✅ Tenant encontrado: ${tenant.id}`);

    // 3. Criar registro na tabela users
    console.log('\n3. Criando registro na tabela users...');
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        full_name: 'Admin Demo',
        email: testEmail,
        whatsapp_number: '+5511999999999',
        role: 'super_admin',
      });

    if (userError) {
      throw userError;
    }

    console.log('   ✅ Registro criado na tabela users');

    console.log('\n✅ Usuário de teste criado com sucesso!');
    console.log('\n📋 Credenciais:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: ${testPassword}`);
    console.log(`   Tenant: ${tenant.id}`);
    console.log('\n🌐 Acesse: http://localhost:3000/login');

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
    process.exit(1);
  }
}

createTestUser();
