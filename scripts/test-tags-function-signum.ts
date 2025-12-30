import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey);

const SIGNUM_TENANT_ID = '31701213-794d-43c3-a74a-50d57fcd9d2b';

async function testTagsFunction() {
  console.log('🧪 Testando função get_tags_data com SIGNUM CURSOS\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    console.log('📞 Chamando get_tags_data...');
    console.log(`   Tenant ID: ${SIGNUM_TENANT_ID}`);
    console.log(`   Período: últimos 30 dias\n`);

    const { data, error } = await supabase.rpc('get_tags_data', {
      p_tenant_id: SIGNUM_TENANT_ID,
      p_days_ago: 30,
      p_channel_id: null,
      p_start_date: null,
      p_end_date: null
    });

    if (error) {
      console.error('❌ ERRO ao executar função:');
      console.error('   Mensagem:', error.message);
      console.error('   Detalhes:', error.details);
      console.error('   Hint:', error.hint);
      return;
    }

    console.log('✅ Função executada com sucesso!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    console.log('📊 RESULTADO COMPLETO:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n═══════════════════════════════════════════════════════════\n');

    // Análise detalhada
    if (data) {
      console.log('📈 ANÁLISE DOS DADOS:\n');

      // KPIs
      const kpis = data.kpis || {};
      console.log('KPIs:');
      console.log(`  ✓ Total de tags ativas: ${kpis.totalActiveTags}`);
      console.log(`  ✓ Conversas com tags: ${kpis.conversationsWithTags}`);
      console.log(`  ✓ Conversas sem tags: ${kpis.conversationsWithoutTags}`);
      console.log(`  ✓ Taxa de categorização: ${kpis.categorizationRate}%\n`);

      // Top Tags
      const topTags = data.topTags || [];
      console.log(`Top Tags (${topTags.length}):`);;
      topTags.forEach((tag: any, i: number) => {
        console.log(`  ${i + 1}. ${tag.tagName}: ${tag.count} conversas (${tag.percentage}%)`);
      });
      console.log('');

      // Performance
      const performance = data.tagPerformance || [];
      console.log(`Tag Performance (${performance.length}):`);;
      performance.forEach((perf: any, i: number) => {
        console.log(`  ${i + 1}. ${perf.tagName}:`);
        console.log(`     - Total conversas: ${perf.totalConversations}`);
        console.log(`     - Média mensagens: ${perf.avgMessages}`);
        console.log(`     - IA ativa: ${perf.aiActivePercent}%`);
        console.log(`     - Fechadas: ${perf.closedPercent}%`);
      });
      console.log('');

      // Verificar se há dados
      if (kpis.totalActiveTags > 0 && topTags.length > 0) {
        console.log('🎉 SUCESSO! A função está retornando dados corretamente!');
        console.log('   O relatório de tags deve funcionar para este tenant.\n');
      } else {
        console.log('⚠️  Função executou mas não retornou dados esperados.');
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERRO:', error.message);
    console.error(error);
  }
}

testTagsFunction();
