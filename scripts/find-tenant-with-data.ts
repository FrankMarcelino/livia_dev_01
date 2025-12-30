import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTenantWithData() {
  console.log('🔍 Procurando tenant com dados de conversas e tags...\n');

  // Buscar todos os tenants
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, neurocore_id')
    .eq('is_active', true);

  if (!tenants || tenants.length === 0) {
    console.log('❌ Nenhum tenant encontrado!');
    return;
  }

  console.log(`📋 Total de tenants ativos: ${tenants.length}\n`);

  for (const tenant of tenants) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📦 Tenant: ${tenant.name}`);
    console.log(`   ID: ${tenant.id}`);
    console.log(`   Neurocore: ${tenant.neurocore_id}`);

    // Contar conversas (últimos 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: convsCount } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenant.id)
      .gte('created_at', thirtyDaysAgo.toISOString());

    console.log(`   Conversas (30 dias): ${convsCount || 0}`);

    // Contar tags do neurocore
    const { count: tagsCount } = await supabase
      .from('tags')
      .select('id', { count: 'exact', head: true })
      .eq('id_neurocore', tenant.neurocore_id)
      .eq('active', true);

    console.log(`   Tags do neurocore: ${tagsCount || 0}`);

    // Se tiver conversas, contar conversation_tags
    if (convsCount && convsCount > 0) {
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('tenant_id', tenant.id)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const conversationIds = conversations?.map(c => c.id) || [];

      if (conversationIds.length > 0) {
        const { count: convTagsCount } = await supabase
          .from('conversation_tags')
          .select('id', { count: 'exact', head: true })
          .in('conversation_id', conversationIds);

        console.log(`   Conversation_tags: ${convTagsCount || 0}`);
      }
    }

    // Verificar se tem dados completos
    if (convsCount && convsCount > 0 && tagsCount && tagsCount > 0) {
      console.log('\n   ✅ ESTE TENANT TEM DADOS! Pode ser usado para testar.');
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

findTenantWithData();
