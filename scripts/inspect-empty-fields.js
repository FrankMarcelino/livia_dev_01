/**
 * Script de Inspeção: Campos Vazios
 *
 * Investiga registros com strings vazias em campos obrigatórios
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

async function inspectEmptyFields() {
  console.log('\n🔍 INSPEÇÃO - CAMPOS VAZIOS\n');
  console.log('='.repeat(70));

  // Registros que falharam (IDs: 7, 9, 10, 11)
  const failedIds = [7, 9, 10, 11];

  for (const id of failedIds) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📄 Registro ID: ${id}`);
    console.log(`${'─'.repeat(70)}\n`);

    const { data: prompt, error } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`❌ Erro: ${error.message}`);
      continue;
    }

    const jsonbFields = ['limitations', 'instructions', 'guide_line', 'rules', 'others_instructions'];

    for (const fieldName of jsonbFields) {
      const value = prompt[fieldName];

      if (value && Array.isArray(value)) {
        value.forEach((step, stepIndex) => {
          // Verificar título vazio
          if (step.title === '' || step.title === null || step.title === undefined) {
            console.log(`⚠️  ${fieldName}[${stepIndex}].title está VAZIO`);
            console.log(`   Valor: ${JSON.stringify(step.title)}`);
            console.log(`   Tipo: ${typeof step.title}`);
          }

          // Verificar sub-instruções vazias
          if (Array.isArray(step.sub)) {
            step.sub.forEach((sub, subIndex) => {
              if (sub.content === '' || sub.content === null || sub.content === undefined) {
                console.log(`⚠️  ${fieldName}[${stepIndex}].sub[${subIndex}].content está VAZIO`);
                console.log(`   Valor: ${JSON.stringify(sub.content)}`);
                console.log(`   Tipo: ${typeof sub.content}`);
              }
            });
          }
        });
      }
    }
  }

  console.log(`\n${'='.repeat(70)}\n`);
  console.log(`💡 PROBLEMA IDENTIFICADO:\n`);
  console.log(`Alguns registros têm strings vazias ("") em campos obrigatórios.`);
  console.log(`O schema Zod exige .min(1), mas os dados contêm "".`);
  console.log(`\n`);
  console.log(`📝 SOLUÇÕES:\n`);
  console.log(`1. Remover validação .min(1) (permitir strings vazias)`);
  console.log(`2. Migração: Limpar steps/subs vazios do banco`);
  console.log(`3. Validação condicional (vazio OK se inactive)`);
  console.log(`\n${'='.repeat(70)}\n`);
}

inspectEmptyFields().catch(console.error);
