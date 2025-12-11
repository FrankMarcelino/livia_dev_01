/**
 * Script de Validação: Limites de Caracteres
 *
 * Valida se os dados do banco respeitam os limites do schema Zod
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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Limites do schema Zod
const LIMITS = {
  name: 200,
  age: 50,
  objective: 1000,
  comunication: 1000,
  personality: 1000,
  stepTitle: 200,
  subContent: 500,
};

async function validateLengths() {
  console.log('\n🔍 VALIDAÇÃO DE LIMITES - AGENT_PROMPTS\n');
  console.log('='.repeat(70));

  const { data: tenantPrompts, error } = await supabase
    .from('agent_prompts')
    .select('*')
    .not('id_tenant', 'is', null);

  if (error) {
    console.error('❌ Erro:', error.message);
    return;
  }

  if (!tenantPrompts || tenantPrompts.length === 0) {
    console.log('⚠️  Nenhum registro encontrado');
    return;
  }

  console.log(`\n📊 Analisando ${tenantPrompts.length} registros...\n`);

  let totalViolations = 0;
  const violations = [];

  for (const prompt of tenantPrompts) {
    const recordViolations = [];

    // Validar campos de personalidade
    if (prompt.name && prompt.name.length > LIMITS.name) {
      recordViolations.push({
        field: 'name',
        length: prompt.name.length,
        limit: LIMITS.name,
        excess: prompt.name.length - LIMITS.name,
      });
    }

    if (prompt.age && prompt.age.length > LIMITS.age) {
      recordViolations.push({
        field: 'age',
        length: prompt.age.length,
        limit: LIMITS.age,
        excess: prompt.age.length - LIMITS.age,
      });
    }

    if (prompt.objective && prompt.objective.length > LIMITS.objective) {
      recordViolations.push({
        field: 'objective',
        length: prompt.objective.length,
        limit: LIMITS.objective,
        excess: prompt.objective.length - LIMITS.objective,
      });
    }

    if (prompt.comunication && prompt.comunication.length > LIMITS.comunication) {
      recordViolations.push({
        field: 'comunication',
        length: prompt.comunication.length,
        limit: LIMITS.comunication,
        excess: prompt.comunication.length - LIMITS.comunication,
      });
    }

    if (prompt.personality && prompt.personality.length > LIMITS.personality) {
      recordViolations.push({
        field: 'personality',
        length: prompt.personality.length,
        limit: LIMITS.personality,
        excess: prompt.personality.length - LIMITS.personality,
      });
    }

    // Validar campos JSONB
    const jsonbFields = ['limitations', 'instructions', 'guide_line', 'rules', 'others_instructions'];

    for (const fieldName of jsonbFields) {
      const value = prompt[fieldName];

      if (value && Array.isArray(value)) {
        value.forEach((step, stepIndex) => {
          if (step.title && step.title.length > LIMITS.stepTitle) {
            recordViolations.push({
              field: `${fieldName}[${stepIndex}].title`,
              length: step.title.length,
              limit: LIMITS.stepTitle,
              excess: step.title.length - LIMITS.stepTitle,
            });
          }

          if (Array.isArray(step.sub)) {
            step.sub.forEach((sub, subIndex) => {
              if (sub.content && sub.content.length > LIMITS.subContent) {
                recordViolations.push({
                  field: `${fieldName}[${stepIndex}].sub[${subIndex}].content`,
                  length: sub.content.length,
                  limit: LIMITS.subContent,
                  excess: sub.content.length - LIMITS.subContent,
                });
              }
            });
          }
        });
      }
    }

    if (recordViolations.length > 0) {
      totalViolations += recordViolations.length;
      violations.push({
        id: prompt.id,
        agent_id: prompt.id_agent,
        tenant_id: prompt.id_tenant,
        violations: recordViolations,
      });
    }
  }

  // Relatório
  console.log(`${'='.repeat(70)}\n`);
  console.log(`📊 RELATÓRIO DE VALIDAÇÃO\n`);

  if (totalViolations === 0) {
    console.log(`✅ Nenhuma violação de limite encontrada!`);
    console.log(`\n🎉 Todos os ${tenantPrompts.length} registros respeitam os limites do schema Zod.\n`);
  } else {
    console.log(`❌ Encontradas ${totalViolations} violações em ${violations.length} registros:\n`);

    violations.forEach((record, index) => {
      console.log(`\n${index + 1}. Registro ID: ${record.id}`);
      console.log(`   Agent ID: ${record.agent_id}`);
      console.log(`   Tenant ID: ${record.tenant_id}`);
      console.log(`   Violações (${record.violations.length}):`);

      record.violations.forEach((v) => {
        console.log(`      ❌ ${v.field}:`);
        console.log(`         Atual: ${v.length} caracteres`);
        console.log(`         Limite: ${v.limit} caracteres`);
        console.log(`         Excesso: +${v.excess} caracteres`);
      });
    });

    console.log(`\n${'='.repeat(70)}\n`);
    console.log(`💡 RECOMENDAÇÕES:\n`);
    console.log(`1. Aumentar limites no schema Zod para acomodar dados existentes`);
    console.log(`2. OU Truncar dados existentes (pode perder informação)`);
    console.log(`3. OU Remover limites (não recomendado para produção)`);
    console.log(``);
  }

  console.log(`${'='.repeat(70)}\n`);
}

validateLengths().catch(console.error);
