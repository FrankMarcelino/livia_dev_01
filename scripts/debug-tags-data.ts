import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  db: { schema: 'public' },
  auth: { persistSession: false }
});

async function debugTagsData() {
  console.log('🔍 DEBUG: Relatório de Tags\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Buscar um tenant de exemplo
    console.log('1️⃣  Buscando tenant...');
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, neurocore_id')
      .limit(1)
      .single();

    if (tenantsError) {
      console.error('❌ Erro ao buscar tenant:', tenantsError);
      return;
    }

    console.log('✅ Tenant encontrado:');
    console.log(`   ID: ${tenants.id}`);
    console.log(`   Nome: ${tenants.name}`);
    console.log(`   Neurocore ID: ${tenants.neurocore_id}\n`);

    const tenantId = tenants.id;
    const neurocoreId = tenants.neurocore_id;

    // 2. Verificar tags do neurocore
    console.log('2️⃣  Verificando tags do neurocore...');
    const { data: tags, error: tagsError } = await supabase
      .from('tags')
      .select('id, tag_name, id_neurocore, active')
      .eq('id_neurocore', neurocoreId);

    if (tagsError) {
      console.error('❌ Erro ao buscar tags:', tagsError);
      return;
    }

    console.log(`✅ Tags encontradas: ${tags?.length || 0}`);
    if (tags && tags.length > 0) {
      tags.slice(0, 5).forEach((tag, i) => {
        console.log(`   ${i + 1}. ${tag.tag_name} (${tag.active ? 'Ativa' : 'Inativa'}) - ID: ${tag.id}`);
      });
      if (tags.length > 5) {
        console.log(`   ... e mais ${tags.length - 5} tags`);
      }
    } else {
      console.log('   ⚠️  NENHUMA TAG ENCONTRADA para este neurocore!');
    }
    console.log('');

    // 3. Verificar conversas do tenant
    console.log('3️⃣  Verificando conversas (últimos 30 dias)...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: conversations, error: convsError } = await supabase
      .from('conversations')
      .select('id, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (convsError) {
      console.error('❌ Erro ao buscar conversas:', convsError);
      return;
    }

    console.log(`✅ Conversas encontradas: ${conversations?.length || 0}\n`);

    // 4. Verificar conversation_tags
    if (conversations && conversations.length > 0) {
      console.log('4️⃣  Verificando conversation_tags...');
      const conversationIds = conversations.map(c => c.id);

      const { data: convTags, error: convTagsError } = await supabase
        .from('conversation_tags')
        .select('id, conversation_id, tag_id')
        .in('conversation_id', conversationIds);

      if (convTagsError) {
        console.error('❌ Erro ao buscar conversation_tags:', convTagsError);
        return;
      }

      console.log(`✅ Conversation_tags encontradas: ${convTags?.length || 0}`);
      if (convTags && convTags.length > 0) {
        console.log(`   Exemplo: ${convTags.slice(0, 3).map(ct => ct.tag_id).join(', ')}`);
      } else {
        console.log('   ⚠️  NENHUMA CONVERSATION_TAG ENCONTRADA!');
      }
      console.log('');
    }

    // 5. Testar a função get_tags_data
    console.log('5️⃣  Testando função get_tags_data...');
    const { data: result, error: funcError } = await supabase.rpc('get_tags_data', {
      p_tenant_id: tenantId,
      p_days_ago: 30,
      p_channel_id: null,
      p_start_date: null,
      p_end_date: null
    });

    if (funcError) {
      console.error('❌ Erro ao executar get_tags_data:', funcError);
      console.error('   Mensagem:', funcError.message);
      console.error('   Detalhes:', funcError.details);
      return;
    }

    console.log('✅ Função executada com sucesso!');
    console.log('\n📊 RESULTADO DA FUNÇÃO:\n');
    console.log(JSON.stringify(result, null, 2));

    // 6. Análise do resultado
    console.log('\n\n6️⃣  Análise do resultado:');
    if (result) {
      const kpis = result.kpis || {};
      console.log(`   Total de tags ativas: ${kpis.totalActiveTags || 0}`);
      console.log(`   Conversas com tags: ${kpis.conversationsWithTags || 0}`);
      console.log(`   Conversas sem tags: ${kpis.conversationsWithoutTags || 0}`);
      console.log(`   Taxa de categorização: ${kpis.categorizationRate || 0}%`);

      const topTags = result.topTags || [];
      console.log(`   Top tags: ${topTags.length} encontradas`);

      if (kpis.totalActiveTags === 0) {
        console.log('\n⚠️  PROBLEMA: Nenhuma tag ativa encontrada!');
        console.log('   Verifique se as tags têm id_neurocore preenchido.');
      }

      if (kpis.conversationsWithTags === 0 && conversations && conversations.length > 0) {
        console.log('\n⚠️  PROBLEMA: Há conversas mas nenhuma tem tags!');
        console.log('   Verifique a tabela conversation_tags.');
      }
    }

  } catch (error: any) {
    console.error('\n❌ ERRO GERAL:', error.message);
    console.error(error);
  }

  console.log('\n═══════════════════════════════════════════════════════════\n');
}

debugTagsData();
