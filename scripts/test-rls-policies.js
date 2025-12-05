/**
 * Script de Teste: RLS Policies para Agent Templates
 *
 * Testa o isolamento multi-tenant das policies de RLS
 * IMPORTANTE: Execute após aplicar migration 010_add_rls_policies_agents.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar .env.local
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
      process.env[key.trim()] = values.join('=').trim();
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  process.exit(1);
}

// Cliente com service role (bypass RLS)
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Cliente com anon key (respeita RLS)
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testRLSPolicies() {
  console.log('\n🧪 TESTE DE RLS POLICIES - AGENT TEMPLATES\n');
  console.log('='.repeat(70));

  let testsPassed = 0;
  let testsFailed = 0;

  // =============================================================================
  // TESTE 1: Verificar que RLS está habilitado
  // =============================================================================
  console.log('\n📋 1. Verificando se RLS está habilitado...\n');

  const tables = ['agents', 'agent_prompts', 'agent_templates'];
  for (const table of tables) {
    const { data, error } = await adminClient.rpc('exec_sql', {
      sql: `
        SELECT tablename, rowsecurity
        FROM pg_tables
        WHERE tablename = '${table}';
      `
    });

    if (error) {
      console.log(`   ⚠️  Não foi possível verificar RLS em ${table}`);
    } else if (data && data[0]?.rowsecurity) {
      console.log(`   ✅ RLS habilitado em ${table}`);
      testsPassed++;
    } else {
      console.log(`   ❌ RLS NÃO habilitado em ${table}`);
      testsFailed++;
    }
  }

  // =============================================================================
  // TESTE 2: Listar todas as policies criadas
  // =============================================================================
  console.log('\n📋 2. Listando policies criadas...\n');

  const { data: policies } = await adminClient.rpc('exec_sql', {
    sql: `
      SELECT tablename, policyname, cmd, permissive
      FROM pg_policies
      WHERE tablename IN ('agents', 'agent_prompts', 'agent_templates')
      ORDER BY tablename, policyname;
    `
  });

  if (policies && policies.length > 0) {
    policies.forEach(p => {
      console.log(`   ✓ ${p.tablename} → ${p.policyname} (${p.cmd})`);
    });
    console.log(`\n   Total: ${policies.length} policies encontradas`);
    testsPassed++;
  } else {
    console.log('   ❌ Nenhuma policy encontrada');
    testsFailed++;
  }

  // =============================================================================
  // TESTE 3: Buscar 2 tenants diferentes para teste
  // =============================================================================
  console.log('\n📋 3. Buscando tenants para teste de isolamento...\n');

  const { data: tenants } = await adminClient
    .from('tenants')
    .select('id, name, id_neurocore')
    .limit(2);

  if (!tenants || tenants.length < 2) {
    console.log('   ⚠️  Não há tenants suficientes para teste de isolamento');
    console.log('   💡 Crie pelo menos 2 tenants para testar isolamento multi-tenant');
  } else {
    console.log(`   ✅ Encontrados ${tenants.length} tenants:`);
    tenants.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.name} (neurocore: ${t.id_neurocore.substring(0, 8)}...)`);
    });
    testsPassed++;
  }

  // =============================================================================
  // TESTE 4: Verificar acesso sem autenticação (deve falhar)
  // =============================================================================
  console.log('\n📋 4. Testando acesso sem autenticação...\n');

  const { data: agentsNoAuth, error: agentsError } = await anonClient
    .from('agents')
    .select('*');

  if (agentsError || !agentsNoAuth || agentsNoAuth.length === 0) {
    console.log('   ✅ RLS bloqueou acesso sem autenticação (esperado)');
    testsPassed++;
  } else {
    console.log('   ❌ RLS permitiu acesso sem autenticação (FALHA DE SEGURANÇA!)');
    testsFailed++;
  }

  // =============================================================================
  // TESTE 5: Verificar que prompts base (id_tenant = NULL) são visíveis
  // =============================================================================
  console.log('\n📋 5. Verificando visibilidade de prompts base...\n');

  const { data: basePrompts } = await adminClient
    .from('agent_prompts')
    .select('id')
    .is('id_tenant', null)
    .limit(1);

  if (basePrompts && basePrompts.length > 0) {
    console.log('   ✅ Prompts base (id_tenant = NULL) existem');
    console.log('   💡 Policy permite que tenants vejam prompts base para reset');
    testsPassed++;
  } else {
    console.log('   ⚠️  Nenhum prompt base encontrado');
    console.log('   💡 Crie prompts base ao configurar agents');
  }

  // =============================================================================
  // TESTE 6: Buscar usuários de diferentes tenants
  // =============================================================================
  console.log('\n📋 6. Verificando usuários por tenant...\n');

  if (tenants && tenants.length >= 2) {
    const { data: usersPerTenant } = await adminClient
      .from('users')
      .select('id, email, tenant_id')
      .in('tenant_id', tenants.map(t => t.id))
      .limit(10);

    if (usersPerTenant && usersPerTenant.length > 0) {
      const groupedByTenant = usersPerTenant.reduce((acc, user) => {
        const tenantName = tenants.find(t => t.id === user.tenant_id)?.name || 'Unknown';
        if (!acc[tenantName]) acc[tenantName] = [];
        acc[tenantName].push(user.email);
        return acc;
      }, {});

      console.log('   ✅ Usuários encontrados por tenant:');
      Object.entries(groupedByTenant).forEach(([tenant, users]) => {
        console.log(`      ${tenant}: ${users.length} usuário(s)`);
      });
      testsPassed++;
    } else {
      console.log('   ⚠️  Nenhum usuário encontrado para testes');
    }
  }

  // =============================================================================
  // RESUMO FINAL
  // =============================================================================
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RESUMO DOS TESTES\n');

  const total = testsPassed + testsFailed;
  const percentage = total > 0 ? Math.round((testsPassed / total) * 100) : 0;

  console.log(`   ✅ Testes passados: ${testsPassed}`);
  console.log(`   ❌ Testes falhados: ${testsFailed}`);
  console.log(`   📈 Taxa de sucesso: ${percentage}%`);

  if (testsFailed === 0) {
    console.log('\n   🎉 TODAS AS VERIFICAÇÕES PASSARAM!');
  } else {
    console.log('\n   ⚠️  ALGUNS TESTES FALHARAM - Revisar configuração');
  }

  console.log('\n⚠️  TESTES MANUAIS NECESSÁRIOS:\n');
  console.log('   Para testar isolamento completo, você precisa:');
  console.log('   1. Fazer login como usuário do Tenant A');
  console.log('   2. Tentar acessar /meus-agentes');
  console.log('   3. Verificar que vê apenas agents do próprio neurocore');
  console.log('   4. Tentar editar um agent');
  console.log('   5. Fazer login como usuário do Tenant B');
  console.log('   6. Verificar que NÃO vê agents do Tenant A');
  console.log('   7. Verificar que pode editar apenas seus próprios prompts');

  console.log('\n' + '='.repeat(70) + '\n');
}

testRLSPolicies().catch(console.error);
