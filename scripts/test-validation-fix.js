/**
 * Script de Teste: Validação Corrigida
 *
 * Testa se os registros que antes falhavam agora passam na validação
 */

const { createClient } = require('@supabase/supabase-js');
const { z } = require('zod');
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

// Schema Zod atualizado (copiado do arquivo de validação)
const guidelineSubInstructionSchema = z.object({
  content: z.string().max(2000, 'Máximo 2000 caracteres'),
  active: z.boolean(),
});

const guidelineStepSchema = z.object({
  title: z.string().max(300, 'Máximo 300 caracteres'),
  type: z.enum(['rank', 'markdown'], {
    message: 'Tipo deve ser "rank" ou "markdown"',
  }),
  active: z.boolean(),
  sub: z.array(guidelineSubInstructionSchema),
});

const agentPromptSchema = z.object({
  name: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
  age: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),
  objective: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  comunication: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  personality: z.string().max(1000, 'Máximo 1000 caracteres').optional().nullable(),
  limitations: z.array(guidelineStepSchema).optional().nullable(),
  instructions: z.array(guidelineStepSchema).optional().nullable(),
  guide_line: z.array(guidelineStepSchema).optional().nullable(),
  rules: z.array(guidelineStepSchema).optional().nullable(),
  others_instructions: z.array(guidelineStepSchema).optional().nullable(),
});

async function testValidation() {
  console.log('\n🧪 TESTE DE VALIDAÇÃO - SCHEMA CORRIGIDO\n');
  console.log('='.repeat(70));

  // Registros que falhavam antes (IDs: 7, 8, 9)
  const problematicIds = [7, 8, 9];

  console.log(`\n📋 Testando ${problematicIds.length} registros que falhavam antes...\n`);

  for (const id of problematicIds) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📄 Testando Registro ID: ${id}`);
    console.log(`${'─'.repeat(70)}\n`);

    const { data: prompt, error } = await supabase
      .from('agent_prompts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error(`❌ Erro ao buscar registro: ${error.message}`);
      continue;
    }

    // Preparar dados para validação
    const dataToValidate = {
      name: prompt.name,
      age: prompt.age,
      gender: prompt.gender,
      objective: prompt.objective,
      comunication: prompt.comunication,
      personality: prompt.personality,
      limitations: prompt.limitations,
      instructions: prompt.instructions,
      guide_line: prompt.guide_line,
      rules: prompt.rules,
      others_instructions: prompt.others_instructions,
    };

    // Validar com schema
    const result = agentPromptSchema.safeParse(dataToValidate);

    if (result.success) {
      console.log(`✅ VALIDAÇÃO PASSOU!`);
      console.log(`   Registro ID ${id} agora é válido segundo o schema atualizado.`);
    } else {
      console.log(`❌ VALIDAÇÃO FALHOU!`);
      console.log(`   Ainda há erros de validação:\n`);

      // Mostrar erros
      const errors = result.error.format();
      console.log(JSON.stringify(errors, null, 2));
    }
  }

  // Testar todos os outros registros também
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`\n📊 TESTE COMPLETO - TODOS OS REGISTROS\n`);

  const { data: allPrompts, error: allError } = await supabase
    .from('agent_prompts')
    .select('*')
    .not('id_tenant', 'is', null);

  if (allError) {
    console.error('❌ Erro ao buscar todos os registros:', allError.message);
    return;
  }

  let passCount = 0;
  let failCount = 0;

  for (const prompt of allPrompts) {
    const dataToValidate = {
      name: prompt.name,
      age: prompt.age,
      gender: prompt.gender,
      objective: prompt.objective,
      comunication: prompt.comunication,
      personality: prompt.personality,
      limitations: prompt.limitations,
      instructions: prompt.instructions,
      guide_line: prompt.guide_line,
      rules: prompt.rules,
      others_instructions: prompt.others_instructions,
    };

    const result = agentPromptSchema.safeParse(dataToValidate);

    if (result.success) {
      passCount++;
    } else {
      failCount++;
      console.log(`❌ Registro ID ${prompt.id} ainda falha na validação`);
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`\n📊 RESULTADO FINAL\n`);
  console.log(`✅ Passaram: ${passCount}/${allPrompts.length} (${((passCount / allPrompts.length) * 100).toFixed(1)}%)`);
  console.log(`❌ Falharam: ${failCount}/${allPrompts.length} (${((failCount / allPrompts.length) * 100).toFixed(1)}%)`);

  if (failCount === 0) {
    console.log(`\n🎉 SUCESSO! Todos os registros agora passam na validação!\n`);
  } else {
    console.log(`\n⚠️  Ainda há ${failCount} registro(s) com problemas.\n`);
  }

  console.log(`${'='.repeat(70)}\n`);
}

testValidation().catch(console.error);
