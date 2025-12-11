/**
 * Script de Inspeção: Dados Reais de agent_prompts
 *
 * Busca dados reais do banco e compara com o schema Zod
 * para identificar incompatibilidades que causam erros de validação
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

async function inspectData() {
  console.log('\n🔍 INSPEÇÃO DE DADOS - AGENT_PROMPTS\n');
  console.log('='.repeat(70));

  // 1. Buscar todos os registros de tenant (onde usuário pode editar)
  console.log('\n📋 1. Buscando registros de tenant...\n');
  const { data: tenantPrompts, error: tenantError } = await supabase
    .from('agent_prompts')
    .select('*')
    .not('id_tenant', 'is', null)
    .limit(10);

  if (tenantError) {
    console.error('❌ Erro:', tenantError.message);
    return;
  }

  if (!tenantPrompts || tenantPrompts.length === 0) {
    console.log('⚠️  Nenhum registro de tenant encontrado');
    return;
  }

  console.log(`✅ Encontrados ${tenantPrompts.length} registros\n`);

  // 2. Analisar cada registro
  for (let i = 0; i < tenantPrompts.length; i++) {
    const prompt = tenantPrompts[i];
    console.log(`\n${'─'.repeat(70)}`);
    console.log(`📄 REGISTRO ${i + 1}/${tenantPrompts.length}`);
    console.log(`${'─'.repeat(70)}\n`);

    console.log(`🆔 ID: ${prompt.id}`);
    console.log(`🤖 Agent ID: ${prompt.id_agent}`);
    console.log(`🏢 Tenant ID: ${prompt.id_tenant}`);
    console.log(`📅 Criado em: ${prompt.created_at}`);

    // Analisar campos de personalidade
    console.log(`\n📋 CAMPOS DE PERSONALIDADE:`);
    console.log(`   name: ${JSON.stringify(prompt.name)} (${typeof prompt.name})`);
    if (prompt.name && prompt.name.length > 200) {
      console.log(`   ⚠️  PROBLEMA: Nome muito longo (${prompt.name.length} chars, máx 200)`);
    }

    console.log(`   age: ${JSON.stringify(prompt.age)} (${typeof prompt.age})`);
    if (prompt.age && prompt.age.length > 50) {
      console.log(`   ⚠️  PROBLEMA: Idade muito longa (${prompt.age.length} chars, máx 50)`);
    }

    console.log(`   gender: ${JSON.stringify(prompt.gender)} (${typeof prompt.gender})`);
    if (prompt.gender && !['male', 'female', null].includes(prompt.gender)) {
      console.log(`   ⚠️  PROBLEMA: Gênero inválido (esperado: 'male' ou 'female')`);
    }

    console.log(`   objective: ${prompt.objective ? `"${prompt.objective.substring(0, 50)}..."` : null} (${typeof prompt.objective})`);
    if (prompt.objective && prompt.objective.length > 1000) {
      console.log(`   ⚠️  PROBLEMA: Objetivo muito longo (${prompt.objective.length} chars, máx 1000)`);
    }

    console.log(`   comunication: ${prompt.comunication ? `"${(prompt.comunication || '').substring(0, 50)}..."` : null} (${typeof prompt.comunication})`);
    if (prompt.comunication && prompt.comunication.length > 1000) {
      console.log(`   ⚠️  PROBLEMA: Comunicação muito longa (${prompt.comunication.length} chars, máx 1000)`);
    }

    console.log(`   personality: ${prompt.personality ? `"${(prompt.personality || '').substring(0, 50)}..."` : null} (${typeof prompt.personality})`);
    if (prompt.personality && prompt.personality.length > 1000) {
      console.log(`   ⚠️  PROBLEMA: Personalidade muito longa (${prompt.personality.length} chars, máx 1000)`);
    }

    // Analisar campos JSONB
    console.log(`\n📋 CAMPOS JSONB (Estrutura GuidelineStep[]):`);

    const jsonbFields = ['limitations', 'instructions', 'guide_line', 'rules', 'others_instructions'];

    for (const field of jsonbFields) {
      const value = prompt[field];
      console.log(`\n   ${field}:`);
      console.log(`      Tipo: ${typeof value}`);
      console.log(`      É null: ${value === null}`);
      console.log(`      É array: ${Array.isArray(value)}`);

      if (value && Array.isArray(value)) {
        console.log(`      Length: ${value.length}`);

        // Validar estrutura de cada step
        value.forEach((step, stepIndex) => {
          console.log(`\n      Step ${stepIndex + 1}:`);
          console.log(`         title: ${JSON.stringify(step.title)} (${typeof step.title})`);
          console.log(`         type: ${JSON.stringify(step.type)} (${typeof step.type})`);
          console.log(`         active: ${JSON.stringify(step.active)} (${typeof step.active})`);
          console.log(`         sub: ${Array.isArray(step.sub) ? `array[${step.sub.length}]` : typeof step.sub}`);

          // Validar problemas
          if (!step.title || step.title.length === 0) {
            console.log(`         ⚠️  PROBLEMA: Título vazio (obrigatório)`);
          }
          if (step.title && step.title.length > 200) {
            console.log(`         ⚠️  PROBLEMA: Título muito longo (${step.title.length} chars, máx 200)`);
          }
          if (step.type && !['rank', 'markdown'].includes(step.type)) {
            console.log(`         ⚠️  PROBLEMA: Tipo inválido "${step.type}" (esperado: 'rank' ou 'markdown')`);
          }
          if (typeof step.active !== 'boolean') {
            console.log(`         ⚠️  PROBLEMA: active não é boolean (valor: ${JSON.stringify(step.active)})`);
          }
          if (!Array.isArray(step.sub)) {
            console.log(`         ⚠️  PROBLEMA: sub não é array (valor: ${JSON.stringify(step.sub)})`);
          }

          // Validar sub-instruções
          if (Array.isArray(step.sub)) {
            step.sub.forEach((subInstruction, subIndex) => {
              console.log(`         Sub ${subIndex + 1}:`);
              console.log(`            content: ${JSON.stringify(subInstruction.content)} (${typeof subInstruction.content})`);
              console.log(`            active: ${JSON.stringify(subInstruction.active)} (${typeof subInstruction.active})`);

              if (!subInstruction.content || subInstruction.content.length === 0) {
                console.log(`            ⚠️  PROBLEMA: Conteúdo vazio (obrigatório)`);
              }
              if (subInstruction.content && subInstruction.content.length > 500) {
                console.log(`            ⚠️  PROBLEMA: Conteúdo muito longo (${subInstruction.content.length} chars, máx 500)`);
              }
              if (typeof subInstruction.active !== 'boolean') {
                console.log(`            ⚠️  PROBLEMA: active não é boolean`);
              }
            });
          }
        });
      } else if (value && !Array.isArray(value)) {
        console.log(`      ⚠️  PROBLEMA: Deveria ser array mas é ${typeof value}`);
        console.log(`      Valor: ${JSON.stringify(value)}`);
      }
    }
  }

  // 3. Resumo de Problemas
  console.log(`\n\n${'='.repeat(70)}`);
  console.log(`\n📊 RESUMO - PROBLEMAS COMUNS A INVESTIGAR\n`);
  console.log(`1. Campos de texto muito longos (ultrapassam limites do schema Zod)`);
  console.log(`2. Campos JSONB com estrutura antiga/incompatível`);
  console.log(`3. Campos obrigatórios vazios`);
  console.log(`4. Tipos inválidos (ex: gender diferente de 'male'/'female')`);
  console.log(`5. Arrays JSONB com steps sem título ou sem type válido`);
  console.log(`6. Sub-instruções sem conteúdo`);
  console.log(`\n${'='.repeat(70)}\n`);
}

inspectData().catch(console.error);
