-- Script de Teste: Inserir mensagem para testar Realtime
-- Executar no Supabase SQL Editor

-- 1. Verificar se existe alguma conversa ativa
SELECT
  id as conversation_id,
  contact_id,
  tenant_id,
  status
FROM conversations
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
AND status != 'closed'
ORDER BY created_at DESC
LIMIT 5;

-- 2. Copie o conversation_id de uma conversa acima e cole abaixo:
-- (Troque <CONVERSATION_ID> pelo ID real)

-- 3. Inserir mensagem de teste
INSERT INTO messages (
  id,
  tenant_id,
  conversation_id,
  content,
  sender_type,
  timestamp,
  created_at
) VALUES (
  gen_random_uuid(),
  'd23e15bb-5294-4f33-905e-f1565ba6022d',  -- Seu tenant_id
  '<CONVERSATION_ID>',  -- ⚠️ COLE O ID AQUI
  'TESTE REALTIME - Se você ver isso no console, funcionou!',
  'client',
  NOW(),
  NOW()
);

-- 4. Após executar, verifique o console do navegador
-- Deve aparecer:
-- [realtime-contact-list] 💬 INSERT message received: {...}
