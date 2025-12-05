/**
 * Script de Verificação: Schema Agent Templates
 * 
 * Verifica se o schema do banco está pronto para implementação
 * da feature "Meus Agentes IA"
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
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('\n🔍 VERIFICAÇÃO DO SCHEMA - AGENT TEMPLATES\n');
  console.log('='.repeat(60));

  let hasErrors = false;

  // 1. Verificar coluna template_id em agents
  console.log('\n📋 1. Verificando coluna template_id em agents...');
  const { data: templateIdColumn, error: templateIdError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'agents' AND column_name = 'template_id';
      `
    });

  if (templateIdError) {
    // Tentar query alternativa
    const { data: agents } = await supabase
      .from('agents')
      .select('*')
      .limit(1);
    
    if (agents && agents[0] && 'template_id' in agents[0]) {
      console.log('   ✅ Coluna template_id existe');
      console.log('   📝 Tipo: uuid (inferido)');
    } else {
      console.log('   ❌ Coluna template_id NÃO existe');
      console.log('   ⚠️  AÇÃO NECESSÁRIA: Adicionar coluna via migration');
      hasErrors = true;
    }
  } else if (templateIdColumn && templateIdColumn.length > 0) {
    console.log('   ✅ Coluna template_id existe');
    console.log(`   📝 Tipo: ${templateIdColumn[0].data_type}`);
    console.log(`   📝 Nullable: ${templateIdColumn[0].is_nullable}`);
  } else {
    console.log('   ❌ Coluna template_id NÃO existe');
    console.log('   ⚠️  AÇÃO NECESSÁRIA: Adicionar coluna via migration');
    hasErrors = true;
  }

  // 2. Verificar constraint UNIQUE em agent_prompts
  console.log('\n📋 2. Verificando constraint UNIQUE(id_agent, id_tenant)...');
  const { data: constraints } = await supabase
    .from('agent_prompts')
    .select('id, id_agent, id_tenant')
    .limit(1);

  if (constraints) {
    console.log('   ℹ️  Tabela agent_prompts existe');
    console.log('   ⚠️  Não foi possível verificar constraint via query');
    console.log('   💡 Constraint deve garantir: UNIQUE(id_agent, id_tenant)');
  }

  // 3. Verificar tabelas necessárias
  console.log('\n📋 3. Verificando existência de tabelas...');
  
  const tables = ['agents', 'agent_prompts', 'agent_templates', 'tenants'];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select('id')
      .limit(1);
    
    if (error) {
      console.log(`   ❌ Tabela ${table} NÃO existe`);
      hasErrors = true;
    } else {
      console.log(`   ✅ Tabela ${table} existe`);
    }
  }

  // 4. Verificar se agent_prompts tem registros base (id_tenant = NULL)
  console.log('\n📋 4. Verificando registros base em agent_prompts...');
  const { data: basePrompts, error: baseError } = await supabase
    .from('agent_prompts')
    .select('id, id_agent, id_tenant')
    .is('id_tenant', null)
    .limit(5);

  if (baseError) {
    console.log(`   ❌ Erro ao buscar: ${baseError.message}`);
  } else if (basePrompts && basePrompts.length > 0) {
    console.log(`   ✅ Encontrados ${basePrompts.length} prompts base (id_tenant = NULL)`);
  } else {
    console.log('   ⚠️  Nenhum prompt base encontrado');
    console.log('   💡 Isso é normal se ainda não há agents criados');
  }

  // 5. Verificar se agent_prompts tem registros de tenant
  console.log('\n📋 5. Verificando registros de tenant em agent_prompts...');
  const { data: tenantPrompts, error: tenantError } = await supabase
    .from('agent_prompts')
    .select('id, id_agent, id_tenant')
    .not('id_tenant', 'is', null)
    .limit(5);

  if (tenantError) {
    console.log(`   ❌ Erro ao buscar: ${tenantError.message}`);
  } else if (tenantPrompts && tenantPrompts.length > 0) {
    console.log(`   ✅ Encontrados ${tenantPrompts.length} prompts de tenant`);
  } else {
    console.log('   ⚠️  Nenhum prompt de tenant encontrado');
    console.log('   💡 Feature nova - isso é esperado');
  }

  // 6. Verificar estrutura de agent_prompts (campos JSONB)
  console.log('\n📋 6. Verificando campos JSONB em agent_prompts...');
  const { data: samplePrompt } = await supabase
    .from('agent_prompts')
    .select('*')
    .limit(1)
    .single();

  if (samplePrompt) {
    const expectedFields = [
      'limitations',
      'instructions', 
      'guide_line',
      'rules',
      'persona_name',
      'age',
      'gender',
      'objective',
      'communication',
      'personality'
    ];
    
    for (const field of expectedFields) {
      if (field in samplePrompt) {
        console.log(`   ✅ Campo ${field} existe`);
      } else {
        console.log(`   ⚠️  Campo ${field} não encontrado no sample`);
      }
    }
  } else {
    console.log('   ℹ️  Nenhum registro para validar estrutura');
  }

  // 7. Verificar se há agent_templates
  console.log('\n📋 7. Verificando templates existentes...');
  const { data: templates, error: templatesError } = await supabase
    .from('agent_templates')
    .select('id, name, is_active')
    .limit(5);

  if (templatesError) {
    console.log(`   ❌ Erro ao buscar: ${templatesError.message}`);
    hasErrors = true;
  } else if (templates && templates.length > 0) {
    console.log(`   ✅ Encontrados ${templates.length} templates`);
    templates.forEach(t => {
      console.log(`      - ${t.name} (${t.is_active ? 'ativo' : 'inativo'})`);
    });
  } else {
    console.log('   ⚠️  Nenhum template encontrado');
    console.log('   ⚠️  AÇÃO NECESSÁRIA: Criar templates na Plataforma Admin');
    hasErrors = true;
  }

  // Resumo Final
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 RESUMO DA VERIFICAÇÃO\n');
  
  if (!hasErrors) {
    console.log('✅ Schema parece estar OK!');
    console.log('\n⚠️  PRÓXIMOS PASSOS:');
    console.log('   1. Verificar RLS policies manualmente no Supabase Dashboard');
    console.log('   2. Confirmar constraint UNIQUE(id_agent, id_tenant)');
    console.log('   3. Criar templates se necessário');
    console.log('   4. Iniciar implementação da UI');
  } else {
    console.log('⚠️  Problemas encontrados - revisar itens marcados com ❌');
    console.log('\n📝 MIGRATIONS NECESSÁRIAS:');
    console.log('   - Adicionar template_id em agents (se não existir)');
    console.log('   - Criar agent_templates (se não existir)');
    console.log('   - Verificar constraint UNIQUE em agent_prompts');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

verifySchema().catch(console.error);
