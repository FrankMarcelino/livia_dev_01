// Script para verificar usuário no banco
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
const supabaseAnonKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Verificando usuário...\n');

const testEmail = 'admin@empresademo.com';

// 1. Com Service Role (bypass RLS)
console.log('1️⃣ Verificando com Service Role Key (bypass RLS):');
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

supabaseService
  .from('users')
  .select('*')
  .eq('email', testEmail)
  .single()
  .then(({ data, error }) => {
    if (error) {
      console.log('   ❌ Erro:', error.message);
    } else if (data) {
      console.log('   ✅ Usuário encontrado:');
      console.log('   ID:', data.id);
      console.log('   Nome:', data.full_name);
      console.log('   Email:', data.email);
      console.log('   Tenant ID:', data.tenant_id);
      console.log('   Role:', data.role);
    } else {
      console.log('   ❌ Usuário não encontrado');
    }

    // 2. Com Anon Key (com RLS)
    console.log('\n2️⃣ Verificando com Anon Key (com RLS ativo):');
    const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

    return supabaseAnon
      .from('users')
      .select('*')
      .eq('email', testEmail)
      .single();
  })
  .then(({ data, error }) => {
    if (error) {
      console.log('   ❌ Erro:', error.message);
      console.log('   ⚠️  PROBLEMA: RLS está bloqueando acesso!');
      console.log('\n💡 Solução: Precisamos ajustar as políticas RLS da tabela users');
    } else if (data) {
      console.log('   ✅ Usuário encontrado (RLS OK)');
    } else {
      console.log('   ❌ Usuário não encontrado');
    }

    // 3. Tentar fazer login
    console.log('\n3️⃣ Testando login no Supabase Auth:');
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);

    return supabaseAuth.auth.signInWithPassword({
      email: testEmail,
      password: 'admin123',
    });
  })
  .then(({ data, error }) => {
    if (error) {
      console.log('   ❌ Erro no login:', error.message);
    } else if (data.user) {
      console.log('   ✅ Login no auth funcionou!');
      console.log('   User ID:', data.user.id);

      // Agora tentar buscar na tabela users estando autenticado
      console.log('\n4️⃣ Buscando na tabela users APÓS login:');
      const supabaseAuthed = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`
          }
        }
      });

      return supabaseAuthed
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();
    }
  })
  .then((result) => {
    if (result) {
      const { data, error } = result;
      if (error) {
        console.log('   ❌ Erro:', error.message);
        console.log('   ⚠️  RLS ainda bloqueando mesmo após login!');
        console.log('\n🔧 Diagnóstico:');
        console.log('   - Auth: ✅ Funcionando');
        console.log('   - Tabela users: ❌ RLS bloqueando');
        console.log('\n💡 Solução: Criar política RLS para usuários autenticados');
      } else if (data) {
        console.log('   ✅ Usuário encontrado após login!');
        console.log('   ✅ RLS está funcionando corretamente');
      }
    }
  })
  .catch((err) => {
    console.error('\n❌ Erro inesperado:', err.message);
  });
