// Script para popular o banco com dados de exemplo
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function seedDatabase() {
  console.log('🌱 Populando banco de dados com dados de exemplo...\n');

  try {
    // 1. Criar Neurocore
    console.log('🧠 Criando Neurocore...');
    const { data: neurocore, error: neurocoreError } = await supabase
      .from('neurocores')
      .insert({
        name: 'Neurocore Demo',
        description: 'Neurocore de demonstração',
        id_subwork_n8n_neurocore: 'demo-neurocore-workflow',
        is_active: true
      })
      .select()
      .single();

    if (neurocoreError) throw neurocoreError;
    console.log('✅ Neurocore criado:', neurocore.id);

    // 2. Criar Tenant
    console.log('\n🏢 Criando Tenant...');
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: 'Empresa Demo',
        neurocore_id: neurocore.id,
        cnpj: '12345678000190',
        phone: '+5511999999999',
        plan: 'basic',
        responsible_finance_name: 'João Financeiro',
        responsible_finance_email: 'financeiro@empresademo.com',
        responsible_finance_whatsapp: '+5511988888888',
        responsible_tech_name: 'Pedro Técnico',
        responsible_tech_email: 'tech@empresademo.com',
        responsible_tech_whatsapp: '+5511977777777',
        is_active: true,
        master_integration_active: false
      })
      .select()
      .single();

    if (tenantError) throw tenantError;
    console.log('✅ Tenant criado:', tenant.id, '-', tenant.name);

    // 3. Criar Channel Provider
    console.log('\n📱 Criando Channel Provider (WhatsApp)...');
    const { data: channelProvider, error: providerError } = await supabase
      .from('channel_providers')
      .insert({
        name: 'WhatsApp Business',
        description: 'Provedor WhatsApp Business API'
      })
      .select()
      .single();

    if (providerError) throw providerError;
    console.log('✅ Channel Provider criado:', channelProvider.id);

    // 4. Criar Canal (WhatsApp)
    console.log('\n📞 Criando Canal WhatsApp...');
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .insert({
        tenant_id: tenant.id,
        channel_provider_id: channelProvider.id,
        name: 'WhatsApp Principal',
        identification_number: '+5511999999999',
        is_active: true,
        is_sending_messages: true,
        is_receiving_messages: true
      })
      .select()
      .single();

    if (channelError) throw channelError;
    console.log('✅ Canal criado:', channel.id);

    // 5. Criar Agent
    console.log('\n🤖 Criando Agent...');
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        name: 'Assistente Virtual',
        type: 'reactive',
        function: 'support',
        associated_neurocores: [neurocore.id],
        instructions: {},
        conversation_roteiro: {},
        limitations: {},
        other_instructions: {}
      })
      .select()
      .single();

    if (agentError) throw agentError;
    console.log('✅ Agent criado:', agent.id);

    // 6. Usuários serão criados via autenticação (auth.users)
    console.log('\n👥 Pulando criação de usuários (será feito via autenticação)...');
    const userId1 = null; // Será criado quando implementar autenticação

    // 7. Criar Contatos
    console.log('\n📇 Criando Contatos...');
    const contacts = [
      { name: 'João Silva', phone: '+5511911111111', status: 'open' },
      { name: 'Maria Santos', phone: '+5511922222222', status: 'with_ai' },
      { name: 'Pedro Oliveira', phone: '+5511933333333', status: 'open' }
    ];

    const createdContacts = [];
    for (const contactData of contacts) {
      const { data: contact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          ...contactData,
          tenant_id: tenant.id,
          last_interaction_at: new Date().toISOString()
        })
        .select()
        .single();

      if (contactError) throw contactError;
      createdContacts.push(contact);
      console.log('  ✅', contact.name, '-', contact.phone);
    }

    // 8. Criar Conversas
    console.log('\n💬 Criando Conversas...');
    const conversations = [];
    for (let i = 0; i < createdContacts.length; i++) {
      const contact = createdContacts[i];
      const { data: conversation, error: convError } = await supabase
        .from('conversations')
        .insert({
          tenant_id: tenant.id,
          contact_id: contact.id,
          channel_id: channel.id,
          status: i === 0 ? 'open' : (i === 1 ? 'open' : 'paused'),
          ia_active: i !== 1, // Segunda conversa com IA pausada
          last_message_at: new Date(Date.now() - i * 3600000).toISOString()
        })
        .select()
        .single();

      if (convError) throw convError;
      conversations.push(conversation);
      console.log('  ✅ Conversa para', contact.name, '- Status:', conversation.status);
    }

    // 9. Criar Mensagens
    console.log('\n📨 Criando Mensagens...');
    let messageCount = 0;

    for (let i = 0; i < conversations.length; i++) {
      const conversation = conversations[i];
      const contact = createdContacts[i];

      // Mensagem do cliente
      await supabase.from('messages').insert({
        conversation_id: conversation.id,
        sender_type: 'customer',
        content: `Olá, preciso de ajuda com meu pedido!`,
        timestamp: new Date(Date.now() - (3 - i) * 3600000 - 60000).toISOString()
      });
      messageCount++;

      // Resposta da IA (se IA ativa)
      if (conversation.ia_active) {
        await supabase.from('messages').insert({
          conversation_id: conversation.id,
          sender_type: 'ai',
          sender_agent_id: agent.id,
          content: `Olá ${contact.name}! Como posso ajudar você hoje?`,
          timestamp: new Date(Date.now() - (3 - i) * 3600000 - 30000).toISOString()
        });
        messageCount++;
      }

      // Mensagem do atendente (se IA pausada) - Comentado por enquanto (sem usuário autenticado)
      // if (!conversation.ia_active) {
      //   await supabase.from('messages').insert({
      //     conversation_id: conversation.id,
      //     sender_type: 'attendant',
      //     sender_user_id: userId1,
      //     content: 'Olá! Um momento que vou verificar isso para você.',
      //     timestamp: new Date(Date.now() - (3 - i) * 3600000).toISOString()
      //   });
      //   messageCount++;
      // }
    }

    console.log(`✅ ${messageCount} mensagens criadas`);

    // 10. Criar Base de Conhecimento
    console.log('\n📚 Criando Base de Conhecimento...');
    const { data: kb, error: kbError } = await supabase
      .from('base_conhecimentos')
      .insert({
        tenant_id: tenant.id,
        neurocore_id: neurocore.id,
        name: 'FAQ Geral',
        description: 'Perguntas frequentes gerais'
      })
      .select()
      .single();

    if (kbError) throw kbError;
    console.log('✅ Base criada:', kb.name);

    // 11. Criar Synapses
    console.log('\n🧩 Criando Synapses...');
    const synapses = [
      {
        title: 'Horário de Atendimento',
        content: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Aos sábados das 9h às 13h.',
        description: 'Informações sobre horário de funcionamento',
        status: 'publishing'
      },
      {
        title: 'Como rastrear pedido',
        content: 'Para rastrear seu pedido, acesse a área "Meus Pedidos" no site e informe o número do pedido. Você receberá atualizações por email e SMS.',
        description: 'Instruções para rastreamento de pedidos',
        status: 'publishing'
      },
      {
        title: 'Política de Devolução',
        content: 'Aceitamos devoluções em até 30 dias após a compra. O produto deve estar em perfeito estado, sem uso, com etiquetas e embalagem original.',
        description: 'Regras para devolução de produtos',
        status: 'draft'
      }
    ];

    for (const synapseData of synapses) {
      await supabase.from('synapses').insert({
        ...synapseData,
        tenant_id: tenant.id,
        base_conhecimento_id: kb.id,
        is_enabled: true
      });
      console.log('  ✅', synapseData.title);
    }

    console.log('\n✅ Database populada com sucesso!');
    console.log('\n📊 Resumo:');
    console.log('  - 1 Neurocore');
    console.log('  - 1 Tenant');
    console.log('  - 1 Canal (WhatsApp)');
    console.log('  - 1 Agent');
    console.log('  - 2 Usuários');
    console.log('  - 3 Contatos');
    console.log('  - 3 Conversas');
    console.log(`  - ${messageCount} Mensagens`);
    console.log('  - 1 Base de Conhecimento');
    console.log('  - 3 Synapses');
    console.log('\n🎉 Você pode começar a testar o Livechat!');

  } catch (error) {
    console.error('\n❌ Erro ao popular banco:', error.message);
    console.error(error);
  }
}

seedDatabase();
