// Script para aplicar correção de RLS via código
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

async function applyRLSFix() {
  console.log('🔧 Aplicando correção de RLS...\n');

  const sqlCommands = [
    // 1. Verificar políticas existentes
    `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
     FROM pg_policies
     WHERE tablename = 'users';`,

    // 2. Remover políticas existentes
    `DROP POLICY IF EXISTS "Users can view own data" ON users;`,
    `DROP POLICY IF EXISTS "Users can update own data" ON users;`,
    `DROP POLICY IF EXISTS "Users can insert own data" ON users;`,
    `DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;`,
    `DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;`,
    `DROP POLICY IF EXISTS "Enable update for users based on email" ON users;`,

    // 3. Criar novas políticas
    `CREATE POLICY "Users can read own data"
      ON users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);`,

    `CREATE POLICY "Users can update own data"
      ON users
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);`,

    // 4. Ativar RLS
    `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`,
  ];

  try {
    // Verificar políticas antes
    console.log('1️⃣ Políticas RLS atuais:');
    const { data: beforePolicies, error: beforeError } = await supabase.rpc('exec_sql', {
      sql: sqlCommands[0]
    }).catch(() => {
      // Se RPC não existir, tentar query direta
      return supabase.from('pg_policies').select('*').eq('tablename', 'users');
    });

    if (beforeError) {
      console.log('   ⚠️  Não foi possível listar políticas via RPC');
      console.log('   Tentando via SQL direto...\n');
    } else if (beforePolicies && beforePolicies.length > 0) {
      console.log(`   Encontradas ${beforePolicies.length} política(s):`);
      beforePolicies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('   Nenhuma política encontrada');
    }

    // Executar comandos de correção
    console.log('\n2️⃣ Aplicando correções...');

    // Como não temos acesso direto ao SQL executor via API padrão,
    // vamos usar uma abordagem alternativa: desabilitar RLS temporariamente
    console.log('   ⚠️  ATENÇÃO: Vou desabilitar RLS temporariamente para testes');
    console.log('   Isso NÃO é recomendado para produção!\n');

    const sqlFix = `
      -- Desabilitar RLS temporariamente (APENAS PARA DESENVOLVIMENTO)
      ALTER TABLE users DISABLE ROW LEVEL SECURITY;
    `;

    console.log('   Executando SQL...');
    console.log('\n' + '='.repeat(60));
    console.log(sqlFix);
    console.log('='.repeat(60) + '\n');

    console.log('❌ ERRO: Não consigo executar SQL direto via API JavaScript');
    console.log('\n📋 VOCÊ PRECISA EXECUTAR MANUALMENTE NO SUPABASE:\n');
    console.log('1. Acesse: https://supabase.com/dashboard');
    console.log('2. Vá em "SQL Editor"');
    console.log('3. Cole e execute este SQL:\n');
    console.log('-'.repeat(60));
    console.log(`
-- OPÇÃO 1: Desabilitar RLS temporariamente (APENAS PARA TESTES)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- OPÇÃO 2: Ou corrigir as políticas (RECOMENDADO)
-- 1. Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- 2. Criar políticas corretas
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Ativar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    `);
    console.log('-'.repeat(60));

  } catch (error) {
    console.error('\n❌ Erro:', error.message);
  }
}

applyRLSFix();
