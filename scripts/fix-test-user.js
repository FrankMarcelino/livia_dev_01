// Script para corrigir usuário de teste
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function fixTestUser() {
  console.log('🔧 Corrigindo usuário de teste...\n');

  const testEmail = 'admin@empresademo.com';

  // 1. Buscar usuário no auth
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === testEmail);

  if (!authUser) {
    console.error('❌ Usuário não encontrado no auth');
    return;
  }

  console.log(`✅ Usuário encontrado no auth: ${authUser.id}`);

  // 2. Verificar se existe na tabela users
  const { data: existingUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (existingUser) {
    console.log('✅ Usuário já existe na tabela users');
    console.log('\n📋 Credenciais:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Senha: admin123`);
    return;
  }

  // 3. Buscar tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .limit(1)
    .single();

  if (!tenant) {
    console.error('❌ Nenhum tenant encontrado');
    return;
  }

  // 4. Criar na tabela users
  const { error } = await supabase
    .from('users')
    .insert({
      id: authUser.id,
      tenant_id: tenant.id,
      full_name: 'Admin Demo',
      email: testEmail,
      whatsapp_number: '+5511999999999',
      role: 'super_admin',
    });

  if (error) {
    console.error('❌ Erro ao criar usuário:', error.message);
    return;
  }

  console.log('✅ Usuário criado na tabela users');
  console.log('\n📋 Credenciais:');
  console.log(`   Email: ${testEmail}`);
  console.log(`   Senha: admin123`);
  console.log('\n🌐 Acesse: http://localhost:3000/login');
}

fixTestUser();
