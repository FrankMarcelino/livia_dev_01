// Script para criar as tags de categoria do Livechat
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Definição das categorias do Livechat
const CATEGORIES = [
  {
    tag_name: 'Presencial',
    color: '#3B82F6', // Azul
    order_index: 1,
    prompt_to_ai: 'Esta conversa é sobre atendimento presencial. Priorize informações sobre horários de atendimento, localização e procedimentos presenciais.',
    is_category: true
  },
  {
    tag_name: 'Teoria + Estágio',
    color: '#A855F7', // Roxa
    order_index: 2,
    prompt_to_ai: 'Esta conversa combina aspectos teóricos e práticos de estágio. Forneça informações equilibradas entre teoria e aplicação prática.',
    is_category: true
  },
  {
    tag_name: 'Teoria',
    color: '#EAB308', // Amarela
    order_index: 3,
    prompt_to_ai: 'Esta conversa é focada em aspectos teóricos. Priorize explicações conceituais e fundamentação teórica.',
    is_category: true
  }
];

async function seedCategories() {
  console.log('🏷️  Criando categorias do Livechat...\n');

  try {
    // 1. Buscar o primeiro tenant ativo
    console.log('🔍 Buscando tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (tenantError) {
      console.error('❌ Erro ao buscar tenant:', tenantError);
      throw tenantError;
    }

    console.log(`✅ Tenant encontrado: ${tenant.name} (${tenant.id})\n`);

    // 2. Verificar se as categorias já existem
    console.log('🔍 Verificando categorias existentes...');
    const { data: existingCategories, error: checkError } = await supabase
      .from('tags')
      .select('tag_name, id')
      .eq('id_tenant', tenant.id)
      .eq('is_category', true);

    if (checkError) {
      console.error('❌ Erro ao verificar categorias:', checkError);
      throw checkError;
    }

    if (existingCategories && existingCategories.length > 0) {
      console.log('⚠️  Categorias já existem:');
      existingCategories.forEach(cat => {
        console.log(`   - ${cat.tag_name} (${cat.id})`);
      });
      console.log('\n⚠️  Pulando criação de categorias duplicadas.');
      console.log('💡 Se deseja recriar, delete as categorias existentes primeiro.\n');
      return;
    }

    // 3. Inserir as categorias
    console.log('📝 Criando categorias...\n');

    for (const category of CATEGORIES) {
      const categoryData = {
        ...category,
        id_tenant: tenant.id,
        active: true
      };

      const { data, error } = await supabase
        .from('tags')
        .insert(categoryData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Erro ao criar categoria "${category.tag_name}":`, error);
        throw error;
      }

      console.log(`✅ Categoria criada: ${data.tag_name}`);
      console.log(`   - Cor: ${data.color}`);
      console.log(`   - Ordem: ${data.order_index}`);
      console.log(`   - ID: ${data.id}\n`);
    }

    console.log('🎉 Todas as categorias foram criadas com sucesso!\n');

    // 4. Mostrar resumo
    console.log('📊 Resumo das categorias:');
    console.log('┌─────────────────────┬──────────┬────────┐');
    console.log('│ Nome                │ Cor      │ Ordem  │');
    console.log('├─────────────────────┼──────────┼────────┤');
    CATEGORIES.forEach(cat => {
      const colorEmoji = cat.color === '#3B82F6' ? '🔵' : cat.color === '#A855F7' ? '🟣' : '🟡';
      console.log(`│ ${colorEmoji} ${cat.tag_name.padEnd(18)} │ ${cat.color} │   ${cat.order_index}    │`);
    });
    console.log('└─────────────────────┴──────────┴────────┘\n');

  } catch (error) {
    console.error('\n❌ Erro ao criar categorias:', error);
    process.exit(1);
  }
}

// Executar o script
seedCategories();
