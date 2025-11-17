// Script para verificar dados completos do seed
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function verifySeed() {
  console.log('🔍 Verificando dados completos do seed...\n');

  try {
    // Mensagens
    console.log('📨 Mensagens:');
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('id, conversation_id, sender_type, content')
      .order('timestamp', { ascending: true });

    if (msgError) {
      console.error('❌ Erro:', msgError.message);
    } else {
      console.log(`  Total: ${messages.length} mensagens`);
      messages.forEach((msg, i) => {
        console.log(`  ${i + 1}. [${msg.sender_type}] ${msg.content.substring(0, 50)}...`);
      });
    }

    // Conversas com detalhes
    console.log('\n💬 Conversas (com contatos):');
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select(`
        id,
        status,
        ia_active,
        contacts (name, phone)
      `);

    if (convError) {
      console.error('❌ Erro:', convError.message);
    } else {
      conversations.forEach((conv, i) => {
        console.log(`  ${i + 1}. ${conv.contacts.name} (${conv.contacts.phone})`);
        console.log(`     Status: ${conv.status} | IA: ${conv.ia_active ? 'Ativa' : 'Pausada'}`);
      });
    }

    // Base de Conhecimento
    console.log('\n📚 Bases de Conhecimento:');
    const { data: bases, error: baseError } = await supabase
      .from('base_conhecimentos')
      .select('id, name, description');

    if (baseError) {
      console.error('❌ Erro:', baseError.message);
    } else {
      bases.forEach((base, i) => {
        console.log(`  ${i + 1}. ${base.name} - ${base.description}`);
      });
    }

    // Synapses
    console.log('\n🧩 Synapses:');
    const { data: synapses, error: synError } = await supabase
      .from('synapses')
      .select('id, title, status, is_enabled');

    if (synError) {
      console.error('❌ Erro:', synError.message);
    } else {
      synapses.forEach((syn, i) => {
        const statusIcon = syn.is_enabled ? '✅' : '❌';
        console.log(`  ${i + 1}. ${statusIcon} ${syn.title} (${syn.status})`);
      });
    }

    // Neurocores
    console.log('\n🧠 Neurocores:');
    const { data: neurocores, error: neuroError } = await supabase
      .from('neurocores')
      .select('id, name, description, is_active');

    if (neuroError) {
      console.error('❌ Erro:', neuroError.message);
    } else {
      neurocores.forEach((nc, i) => {
        console.log(`  ${i + 1}. ${nc.name} (${nc.is_active ? 'Ativo' : 'Inativo'})`);
        console.log(`      ${nc.description}`);
      });
    }

    // Channels
    console.log('\n📞 Canais:');
    const { data: channels, error: chanError } = await supabase
      .from('channels')
      .select('id, name, identification_number, is_active');

    if (chanError) {
      console.error('❌ Erro:', chanError.message);
    } else {
      channels.forEach((ch, i) => {
        console.log(`  ${i + 1}. ${ch.name} - ${ch.identification_number} (${ch.is_active ? 'Ativo' : 'Inativo'})`);
      });
    }

    // Agents
    console.log('\n🤖 Agents:');
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id, name, type, function');

    if (agentError) {
      console.error('❌ Erro:', agentError.message);
    } else {
      agents.forEach((agent, i) => {
        console.log(`  ${i + 1}. ${agent.name} (${agent.type} - ${agent.function})`);
      });
    }

    console.log('\n✅ Verificação completa!');

  } catch (error) {
    console.error('\n❌ Erro inesperado:', error.message);
  }
}

verifySeed();
