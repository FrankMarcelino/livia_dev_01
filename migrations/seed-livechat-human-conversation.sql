-- Seed: Conversa humana completa para demonstrar estados pending/sent/failed/read
-- Execute este script diretamente no SQL Editor do Supabase (role: service_role ou equivalente)
-- Ele cria/atualiza um tenant de demo, contato, conversa e mensagens necessárias para o Livechat.

BEGIN;

DO
$$
DECLARE
  v_now timestamptz := now();

  v_neurocore_id        uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0001';
  v_tenant_id           uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0002';
  v_channel_provider_id uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0003';
  v_channel_id          uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0004';
  v_agent_id            uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0005';
  v_contact_id          uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0006';
  v_conversation_id     uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0007';

  -- Ajuste para um usuário existente em auth.users/public.users
  v_attendant_user_id   uuid := '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0008';
BEGIN
  -- Neurocore
  INSERT INTO neurocores (id, name, description, id_subwork_n8n_neurocore, is_active)
  VALUES (
    v_neurocore_id,
    'Neurocore Livechat Demo',
    'Neurocore focado em atendimento humano assistido',
    'livechat-neurocore-demo',
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    name        = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active   = true;

  -- Se já existir um tenant com o mesmo CNPJ, reutilizamos o ID para evitar conflito
  PERFORM id
  FROM tenants
  WHERE cnpj = '12345678000190'
  LIMIT 1;

  IF FOUND THEN
    SELECT id INTO v_tenant_id
    FROM tenants
    WHERE cnpj = '12345678000190'
    LIMIT 1;
  END IF;

  -- Tenant
  INSERT INTO tenants (
    id,
    name,
    neurocore_id,
    cnpj,
    phone,
    plan,
    responsible_finance_name,
    responsible_finance_email,
    responsible_finance_whatsapp,
    responsible_tech_name,
    responsible_tech_email,
    responsible_tech_whatsapp,
    is_active,
    master_integration_active
  )
  VALUES (
    v_tenant_id,
    'Empresa Demo Livechat',
    v_neurocore_id,
    '12345678000190',
    '+5511999999999',
    'livechat_pro',
    'João Financeiro',
    'financeiro@empresademo.com',
    '+5511988888888',
    'Pedro Técnico',
    'tech@empresademo.com',
    '+5511977777777',
    true,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    neurocore_id = EXCLUDED.neurocore_id,
    plan         = EXCLUDED.plan,
    is_active    = true;

  -- Channel Provider
  INSERT INTO channel_providers (
    id,
    name,
    description,
    channel_provider_identifier_code
  )
  VALUES (
    v_channel_provider_id,
    'WhatsApp Business API (Demo)',
    'Provider fictício utilizado no seed',
    'WABA-DEMO'
  )
  ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description;

  -- Canal
  INSERT INTO channels (
    id,
    tenant_id,
    channel_provider_id,
    name,
    identification_number,
    is_active,
    is_sending_messages,
    is_receiving_messages
  )
  VALUES (
    v_channel_id,
    v_tenant_id,
    v_channel_provider_id,
    'WhatsApp Oficial',
    '+5511999999999',
    true,
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE SET
    tenant_id = EXCLUDED.tenant_id,
    is_active = true;

  -- Agent (IA)
  INSERT INTO agents (
    id,
    name,
    type,
    function,
    associated_neurocores,
    instructions,
    conversation_roteiro,
    limitations,
    other_instructions,
    is_intent_agent
  )
  VALUES (
    v_agent_id,
    'Assistente LIVIA',
    'reactive',
    'support',
    ARRAY[v_neurocore_id],
    jsonb_build_object('tone', 'friendly'),
    '{}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    false
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name;

  -- Contato
  INSERT INTO contacts (
    id,
    tenant_id,
    name,
    phone,
    email,
    status,
    last_interaction_at,
    external_contact_id
  )
  VALUES (
    v_contact_id,
    v_tenant_id,
    'João Cliente',
    '+5511912345678',
    'joao.cliente@example.com',
    'open',
    v_now,
    'whatsapp-contact-joao'
  )
  ON CONFLICT (id) DO UPDATE SET
    status              = 'open',
    last_interaction_at = EXCLUDED.last_interaction_at;

  -- Conversa
  INSERT INTO conversations (
    id,
    tenant_id,
    contact_id,
    channel_id,
    status,
    ia_active,
    last_message_at,
    external_id
  )
  VALUES (
    v_conversation_id,
    v_tenant_id,
    v_contact_id,
    v_channel_id,
    'open',
    false,
    v_now - interval '72 seconds',
    'waba-conv-livechat-demo-001'
  )
  ON CONFLICT (id) DO UPDATE SET
    status          = 'open',
    ia_active       = false,
    last_message_at = EXCLUDED.last_message_at;

  -- Mensagens: remove anteriores e insere a timeline completa
  DELETE FROM messages WHERE conversation_id = v_conversation_id;

  INSERT INTO messages (
    conversation_id,
    channel_id,
    sender_type,
    sender_user_id,
    sender_agent_id,
    content,
    timestamp,
    status,
    external_message_id
  )
  VALUES
    (
      v_conversation_id,
      v_channel_id,
      'customer',
      NULL,
      NULL,
      'Oi, bom dia! Recebi um boleto em duplicidade, conseguem me ajudar?',
      v_now - interval '18 minutes',
      'read',
      'waba-msg-001'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'ai',
      NULL,
      v_agent_id,
      'Olá João! Posso ajudar sim. Você pode me informar o número do pedido?',
      v_now - interval '17 minutes',
      'read',
      'waba-msg-002'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'customer',
      NULL,
      NULL,
      'É o pedido 48291. Prefiro conversar com um humano, ok?',
      v_now - interval '16 minutes 30 seconds',
      'read',
      'waba-msg-003'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'system',
      NULL,
      NULL,
      'IA pausada por Carla Souza após solicitação do cliente.',
      v_now - interval '16 minutes 12 seconds',
      'sent',
      NULL
    ),
    (
      v_conversation_id,
      v_channel_id,
      'attendant',
      v_attendant_user_id,
      NULL,
      'Olá João! Aqui é a Carla. Já estou olhando o seu pedido, tudo bem?',
      v_now - interval '15 minutes 30 seconds',
      'read',
      'waba-msg-004'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'attendant',
      v_attendant_user_id,
      NULL,
      'Consegui validar: o boleto correto vence amanhã. Já te envio o comprovante.',
      v_now - interval '3 minutes',
      'sent',
      'waba-msg-005'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'attendant',
      v_attendant_user_id,
      NULL,
      'Arquivo: comprovante-pedido-48291.pdf',
      v_now - interval '2 minutes 12 seconds',
      'failed',
      'waba-msg-006'
    ),
    (
      v_conversation_id,
      v_channel_id,
      'attendant',
      v_attendant_user_id,
      NULL,
      'Reenvio do comprovante... quase lá! 👍',
      v_now - interval '72 seconds',
      'pending',
      NULL
    );
END
$$;

COMMIT;

-- Resumo rápido (opcional)
SELECT
  c.id AS conversation_id,
  c.status,
  c.ia_active,
  c.ia_pause_reason,
  COUNT(m.*) AS total_messages
FROM conversations c
JOIN messages m ON m.conversation_id = c.id
WHERE c.id = '1ee0b0c6-6c9f-4009-9fb4-3cbc1d1d0007'
GROUP BY c.id;

