// Script para limpar dados de exemplo do banco
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function cleanDatabase() {
  console.log('🧹 Limpando dados de exemplo do banco...\n');

  try {
    // Limpar na ordem reversa (por causa de foreign keys)

    console.log('🧩 Deletando synapses...');
    const { error: synError } = await supabase.from('synapses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (synError) console.log('⚠️', synError.message);
    else console.log('✅ Synapses deletadas');

    console.log('📚 Deletando bases de conhecimento...');
    const { error: kbError } = await supabase.from('base_conhecimentos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (kbError) console.log('⚠️', kbError.message);
    else console.log('✅ Bases deletadas');

    console.log('📨 Deletando mensagens...');
    const { error: msgError } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (msgError) console.log('⚠️', msgError.message);
    else console.log('✅ Mensagens deletadas');

    console.log('💬 Deletando conversas...');
    const { error: convError } = await supabase.from('conversations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (convError) console.log('⚠️', convError.message);
    else console.log('✅ Conversas deletadas');

    console.log('📇 Deletando contatos...');
    const { error: contactError } = await supabase.from('contacts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (contactError) console.log('⚠️', contactError.message);
    else console.log('✅ Contatos deletados');

    console.log('👥 Deletando usuários...');
    const { error: userError } = await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (userError) console.log('⚠️', userError.message);
    else console.log('✅ Usuários deletados');

    console.log('🤖 Deletando agents...');
    const { error: agentError } = await supabase.from('agents').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (agentError) console.log('⚠️', agentError.message);
    else console.log('✅ Agents deletados');

    console.log('📞 Deletando canais...');
    const { error: channelError } = await supabase.from('channels').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (channelError) console.log('⚠️', channelError.message);
    else console.log('✅ Canais deletados');

    console.log('📱 Deletando channel providers...');
    const { error: providerError } = await supabase.from('channel_providers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (providerError) console.log('⚠️', providerError.message);
    else console.log('✅ Channel providers deletados');

    console.log('🏢 Deletando tenants...');
    const { error: tenantError } = await supabase.from('tenants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (tenantError) console.log('⚠️', tenantError.message);
    else console.log('✅ Tenants deletados');

    console.log('🧠 Deletando neurocores...');
    const { error: neurocoreError } = await supabase.from('neurocores').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (neurocoreError) console.log('⚠️', neurocoreError.message);
    else console.log('✅ Neurocores deletados');

    console.log('\n✅ Limpeza concluída!');

  } catch (error) {
    console.error('\n❌ Erro ao limpar banco:', error.message);
  }
}

cleanDatabase();
