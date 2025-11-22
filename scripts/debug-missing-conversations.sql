-- Debug: Por que conversas novas não aparecem no Livechat?
-- Execute este script no Supabase SQL Editor

-- 1️⃣ Ver conversas criadas recentemente (últimas 24h)
SELECT
  id,
  contact_id,
  tenant_id,
  status,
  ia_active,
  created_at,
  last_message_at,
  CASE
    WHEN contact_id IS NULL THEN '❌ SEM CONTACT_ID'
    ELSE '✅ TEM CONTACT'
  END as diagnostico
FROM conversations
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;

-- 2️⃣ Contar conversas SEM contact_id (essas NÃO aparecem no Livechat)
SELECT
  COUNT(*) as conversas_sem_contact,
  'Essas conversas NÃO aparecem no Livechat porque a query usa INNER JOIN' as motivo
FROM conversations
WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
  AND contact_id IS NULL;

-- 3️⃣ Ver contatos sem conversas associadas
SELECT
  c.id,
  c.name,
  c.phone,
  c.created_at,
  COUNT(conv.id) as num_conversations
FROM contacts c
LEFT JOIN conversations conv ON conv.contact_id = c.id
WHERE c.tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
GROUP BY c.id, c.name, c.phone, c.created_at
HAVING COUNT(conv.id) = 0
ORDER BY c.created_at DESC
LIMIT 5;

-- 4️⃣ SOLUÇÃO TEMPORÁRIA: Associar conversas órfãs a um contato existente
-- ⚠️ Execute apenas se tiver conversas sem contact_id

-- Primeiro, veja se existe alguma conversa órfã:
-- SELECT id, external_id, created_at
-- FROM conversations
-- WHERE tenant_id = 'd23e15bb-5294-4f33-905e-f1565ba6022d'
--   AND contact_id IS NULL;

-- Se existir, você pode associar manualmente:
-- UPDATE conversations
-- SET contact_id = '<ID_DO_CONTACT>'
-- WHERE id = '<ID_DA_CONVERSA_ORFÃ>';
