import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTags() {
  console.log('🔍 Verificando TODAS as tags no banco...\n');

  // Buscar TODAS as tags (sem filtro)
  const { data: allTags, error } = await supabase
    .from('tags')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  console.log(`📊 Total de tags encontradas: ${allTags?.length || 0}\n`);

  if (allTags && allTags.length > 0) {
    console.log('Tags existentes:\n');
    allTags.forEach((tag, i) => {
      console.log(`${i + 1}. ${tag.tag_name}`);
      console.log(`   ID: ${tag.id}`);
      console.log(`   id_neurocore: ${tag.id_neurocore || '❌ NULL/VAZIO'}`);
      console.log(`   active: ${tag.active}`);
      console.log(`   created_at: ${tag.created_at}`);
      console.log('');
    });

    // Contar tags sem neurocore
    const tagsWithoutNeurocore = allTags.filter(t => !t.id_neurocore);
    console.log(`\n⚠️  Tags SEM id_neurocore: ${tagsWithoutNeurocore.length}`);

    if (tagsWithoutNeurocore.length > 0) {
      console.log('\n🔧 PROBLEMA IDENTIFICADO:');
      console.log('   As tags existem mas não estão associadas a nenhum neurocore!');
      console.log('   Precisamos associar essas tags ao neurocore correto.\n');
    }

    // Buscar neurocores disponíveis
    const { data: neurocores } = await supabase
      .from('neurocores')
      .select('id, name')
      .eq('is_active', true);

    console.log('\n📋 Neurocores disponíveis:');
    neurocores?.forEach(nc => {
      console.log(`   - ${nc.name} (${nc.id})`);
    });
  } else {
    console.log('❌ Nenhuma tag encontrada no banco!');
  }
}

checkTags();
