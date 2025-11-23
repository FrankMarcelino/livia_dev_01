// Seed específico para popular o Livechat com uma conversa transferida para humano
// O objetivo é demonstrar os estados pending/sent/failed/read do atendente e a IA pausada

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseServiceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para executar o seed.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const IDS = {
  neurocore: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0001',
  tenant: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0002',
  channelProvider: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0003',
  channel: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0004',
  agent: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0005',
  contact: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0006',
  conversation: '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0007'
};

const ATTENDANT = {
  email: 'carla.souza@empresademo.com',
  password: 'Demo123!',
  fullName: 'Carla Souza',
  whatsapp: '+5511987654321'
};

async function upsertSingle(table, payload) {
  const { data, error } = await supabase.from(table).upsert(payload, { onConflict: 'id' }).select();

  if (error) {
    throw new Error(`Erro ao upsert ${table}: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error(`Nenhum registro retornado ao upsert ${table}`);
  }

  return data[0];
}

async function ensureAuthAttendant() {
  let authUser;

  const { data: existingUser, error: fetchError } = await supabase.auth.admin.getUserByEmail(ATTENDANT.email);

  if (fetchError && fetchError.message !== 'User not found') {
    throw new Error(`Erro ao buscar usuário do auth: ${fetchError.message}`);
  }

  if (existingUser?.user) {
    authUser = existingUser.user;
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: ATTENDANT.email,
      password: ATTENDANT.password,
      email_confirm: true,
      user_metadata: {
        full_name: ATTENDANT.fullName,
        role: 'attendant'
      }
    });

    if (error) {
      throw new Error(`Erro ao criar usuário do auth: ${error.message}`);
    }

    authUser = data.user;
  }

  return authUser;
}

function minutesAgo(min) {
  const now = Date.now();
  return new Date(now - min * 60 * 1000).toISOString();
}

async function seedHumanConversation() {
  console.log('🌱 Iniciando seed de conversa humana para o Livechat...');

  // 1. Bases necessárias
  const neurocore = await upsertSingle('neurocores', {
    id: IDS.neurocore,
    name: 'Neurocore Livechat Demo',
    description: 'Neurocore focado em atendimento humano assistido',
    id_subwork_n8n_neurocore: 'livechat-neurocore-demo',
    is_active: true
  });
  console.log('🧠 Neurocore pronto:', neurocore.name);

  const tenant = await upsertSingle('tenants', {
    id: IDS.tenant,
    name: 'Empresa Demo Livechat',
    neurocore_id: IDS.neurocore,
    cnpj: '12345678000190',
    phone: '+5511999999999',
    plan: 'livechat_pro',
    responsible_finance_name: 'João Financeiro',
    responsible_finance_email: 'financeiro@empresademo.com',
    responsible_finance_whatsapp: '+5511988888888',
    responsible_tech_name: 'Pedro Técnico',
    responsible_tech_email: 'tech@empresademo.com',
    responsible_tech_whatsapp: '+5511977777777',
    is_active: true,
    master_integration_active: false
  });
  console.log('🏢 Tenant pronto:', tenant.name);

  const channelProvider = await upsertSingle('channel_providers', {
    id: IDS.channelProvider,
    name: 'WhatsApp Business API (Demo)',
    description: 'Provider fictício utilizado para o seed',
    channel_provider_identifier_code: 'WABA-DEMO'
  });
  console.log('📱 Provider pronto:', channelProvider.name);

  const channel = await upsertSingle('channels', {
    id: IDS.channel,
    tenant_id: IDS.tenant,
    channel_provider_id: IDS.channelProvider,
    name: 'WhatsApp Oficial',
    identification_number: '+5511999999999',
    is_active: true,
    is_sending_messages: true,
    is_receiving_messages: true
  });
  console.log('📞 Canal pronto:', channel.name);

  const agent = await upsertSingle('agents', {
    id: IDS.agent,
    name: 'Assistente LIVIA',
    type: 'reactive',
    function: 'support',
    associated_neurocores: [IDS.neurocore],
    instructions: { tone: 'friendly' },
    conversation_roteiro: {},
    limitations: {},
    other_instructions: {},
    is_intent_agent: false
  });
  console.log('🤖 Agent pronto:', agent.name);

  // 2. Usuário atendente (auth + tabela users)
  const authUser = await ensureAuthAttendant();

  const attendant = await upsertSingle('users', {
    id: authUser.id,
    tenant_id: IDS.tenant,
    full_name: ATTENDANT.fullName,
    email: ATTENDANT.email,
    whatsapp_number: ATTENDANT.whatsapp,
    role: 'user',
    modules: ['livechat'],
    is_active: true,
    last_sign_in_at: authUser.last_sign_in_at ?? new Date().toISOString()
  });
  console.log('👩🏽‍💻 Atendente pronta:', attendant.full_name);

  // 3. Contato e conversa
  const contact = await upsertSingle('contacts', {
    id: IDS.contact,
    tenant_id: IDS.tenant,
    channel_id: IDS.channel,
    name: 'João Cliente',
    phone: '+5511912345678',
    email: 'joao.cliente@example.com',
    status: 'open',
    last_interaction_at: new Date().toISOString(),
    external_contact_id: 'whatsapp-contact-joao'
  });
  console.log('📇 Contato pronto:', contact.name);

  // Timeline dos eventos da conversa (minutos atrás)
  const timeline = [
    {
      sender_type: 'customer',
      content: 'Oi, bom dia! Recebi um boleto em duplicidade, conseguem me ajudar?',
      timestamp: minutesAgo(18),
      status: 'read',
      external_message_id: 'waba-msg-001'
    },
    {
      sender_type: 'ai',
      sender_agent_id: IDS.agent,
      content: 'Olá João! Posso ajudar sim. Você pode me informar o número do pedido?',
      timestamp: minutesAgo(17),
      status: 'read',
      external_message_id: 'waba-msg-002'
    },
    {
      sender_type: 'customer',
      content: 'É o pedido 48291. Prefiro conversar com um humano, ok?',
      timestamp: minutesAgo(16.5),
      status: 'read',
      external_message_id: 'waba-msg-003'
    },
    {
      sender_type: 'system',
      content: 'IA pausada por Carla Souza após solicitação do cliente.',
      timestamp: minutesAgo(16.2),
      status: 'sent'
    },
    {
      sender_type: 'attendant',
      sender_user_id: attendant.id,
      content: 'Olá João! Aqui é a Carla. Já estou olhando o seu pedido, tudo bem?',
      timestamp: minutesAgo(15.5),
      status: 'read',
      external_message_id: 'waba-msg-004'
    },
    {
      sender_type: 'attendant',
      sender_user_id: attendant.id,
      content: 'Consegui validar: o boleto correto vence amanhã. Já te envio o comprovante.',
      timestamp: minutesAgo(3),
      status: 'sent',
      external_message_id: 'waba-msg-005'
    },
    {
      sender_type: 'attendant',
      sender_user_id: attendant.id,
      content: 'Arquivo: comprovante-pedido-48291.pdf',
      timestamp: minutesAgo(2.2),
      status: 'failed',
      external_message_id: 'waba-msg-006'
    },
    {
      sender_type: 'attendant',
      sender_user_id: attendant.id,
      content: 'Reenvio do comprovante... quase lá! 👍',
      timestamp: minutesAgo(1.2),
      status: 'pending'
    }
  ];

  const lastMessageAt = timeline[timeline.length - 1].timestamp;
  const iaPausedAt = timeline[3].timestamp; // no momento do takeover

  const conversation = await upsertSingle('conversations', {
    id: IDS.conversation,
    tenant_id: IDS.tenant,
    contact_id: IDS.contact,
    channel_id: IDS.channel,
    status: 'open',
    ia_active: false,
    ia_paused_by_user_id: attendant.id,
    ia_paused_at: iaPausedAt,
    ia_pause_reason: 'Cliente solicitou atendimento humano',
    last_message_at: lastMessageAt,
    external_id: 'waba-conv-livechat-demo-001'
  });
  console.log('💬 Conversa pronta:', conversation.id);

  // 4. Mensagens (limpa e re-insere para idempotência)
  await supabase.from('messages').delete().eq('conversation_id', IDS.conversation);

  const messagesPayload = timeline.map((message) => ({
    ...message,
    conversation_id: IDS.conversation,
    channel_id: IDS.channel
  }));

  const { error: messageError } = await supabase.from('messages').insert(messagesPayload);

  if (messageError) {
    throw new Error(`Erro ao inserir mensagens: ${messageError.message}`);
  }

  console.log(`📨 ${messagesPayload.length} mensagens inseridas (cliente, IA, sistema e atendente).`);

  console.log('\n✅ Seed concluído! Abra o Livechat e selecione esta conversa para ver o takeover humano com os 4 estados visuais.');
}

seedHumanConversation().catch((error) => {
  console.error('❌ Falha ao executar seed:', error.message);
  process.exit(1);
});





