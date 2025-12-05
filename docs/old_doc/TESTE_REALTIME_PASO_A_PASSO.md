# 🧪 Teste de Realtime - Passo a Passo

**Data:** 2025-11-22
**Objetivo:** Verificar se o Realtime está funcionando na lista de conversas

---

## 📋 Preparação

1. **Abra o navegador** (Chrome/Edge/Firefox)
2. **Abra DevTools** (F12)
3. **Vá para a aba Console**
4. **Limpe o console** (Ctrl+L ou botão 🚫 Clear)

---

## 🔍 Teste 1: Verificar Subscriptions

### Passo 1: Abrir Livechat

1. Acesse `/livechat`
2. No console, procure por:

```
[realtime-contact-list] 🔵 Hook initialized with
[realtime-contact-list] 🚀 Starting Realtime subscriptions for tenant: <seu-tenant-id>
```

### Passo 2: Verificar Conexões

Aguarde alguns segundos e procure por:

```
[realtime-contact-list] 📡 Conversations subscription status: SUBSCRIBED
[realtime-contact-list] ✅ Successfully subscribed to conversations
[realtime-contact-list] 📡 Messages subscription status: SUBSCRIBED
[realtime-contact-list] ✅ Successfully subscribed to messages
```

**✅ SE APARECER:** Subscriptions funcionando!
**❌ SE NÃO APARECER:** Problema na conexão Supabase Realtime

---

## 🔍 Teste 2: Testar UPDATE de Conversa

### Método Manual (Direto no Banco)

1. **Abra o Supabase Studio** ou pgAdmin
2. **Execute este SQL:**

```sql
-- Pegue uma conversa existente
SELECT id, status, ia_active, tenant_id
FROM conversations
WHERE tenant_id = 'SEU_TENANT_ID'
LIMIT 1;

-- Atualize o status (troque <conversation-id>)
UPDATE conversations
SET ia_active = NOT ia_active
WHERE id = '<conversation-id>';
```

### O que deve acontecer:

No console do navegador, deve aparecer:

```
[realtime-contact-list] 📝 UPDATE conversation received: {
  id: '<conversation-id>',
  status: 'open',
  ia_active: true/false,
  fullPayload: {...}
}
[realtime-contact-list] 🔄 Updating conversation in state...
[realtime-contact-list] ✅ Found contact to update: Nome do Contato
```

**E o badge de IA na UI deve mudar** (sem refresh!)

**✅ SE ACONTECER:** Realtime de conversations funcionando!
**❌ SE NÃO ACONTECER:** Filtro errado ou payload não chegou

---

## 🔍 Teste 3: Testar INSERT de Mensagem

### Método Manual (Direto no Banco)

1. **Pegue uma conversa existente:**

```sql
SELECT id, contact_id, tenant_id
FROM conversations
WHERE tenant_id = 'SEU_TENANT_ID'
LIMIT 1;
```

2. **Insira uma mensagem manualmente:**

```sql
INSERT INTO messages (
  id,
  tenant_id,
  conversation_id,
  content,
  sender_type,
  timestamp
) VALUES (
  gen_random_uuid(),
  'SEU_TENANT_ID',
  '<conversation-id>',
  'Mensagem de teste via SQL',
  'client',
  NOW()
);
```

### O que deve acontecer:

No console do navegador, deve aparecer:

```
[realtime-contact-list] 💬 INSERT message received: {
  id: '<message-id>',
  conversation_id: '<conversation-id>',
  content: 'Mensagem de teste via SQL' (ou '(no content in payload)'),
  timestamp: '2025-11-22T...',
  fullPayload: {...}
}
[realtime-contact-list] 🔄 Updating message in state...
[realtime-contact-list] ✅ Found contact to update with new message: Nome do Contato
```

**E a conversa deve:**
1. Subir para o topo da lista (reordenação)
2. Mostrar horário "Agora"
3. Mostrar preview da mensagem (se `content` veio no payload)

**✅ SE ACONTECER:** Realtime de messages funcionando!
**❌ SE NÃO ACONTECER:** Verificar filtro ou REPLICA IDENTITY

---

## 🚨 Diagnóstico de Problemas

### Problema 1: Nenhum log aparece

**Causa provável:** Supabase Realtime desabilitado

**Solução:**
1. Acesse Supabase Dashboard
2. Settings → Database → Realtime
3. Verifique se "Enable Realtime" está ON
4. Adicione tabelas `conversations` e `messages` às Realtime Publications

### Problema 2: "SUBSCRIBED" não aparece

**Causa provável:** Erro na URL do Supabase ou Auth

**Solução:**
1. Verifique `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Verifique se está logado (auth)

### Problema 3: Logs aparecem mas UI não atualiza

**Causa provável:** Estado do React não está sendo atualizado

**O que verificar:**
- Procure por `🔄 Updating conversation in state...`
- Procure por `✅ Found contact to update:`
- Se aparecer "Found contact" mas UI não muda, problema no render

### Problema 4: "content" não aparece no payload

**Causa provável:** REPLICA IDENTITY não inclui `content`

**Solução:**
```sql
ALTER TABLE messages REPLICA IDENTITY FULL;
```

Isso faz Supabase enviar todos os campos no Realtime.

---

## 📊 Checklist de Debug

- [ ] Console mostra "🔵 Hook initialized"
- [ ] Console mostra "🚀 Starting Realtime subscriptions"
- [ ] Console mostra "✅ Successfully subscribed to conversations"
- [ ] Console mostra "✅ Successfully subscribed to messages"
- [ ] UPDATE conversation gera log "📝 UPDATE conversation received"
- [ ] UPDATE conversation gera log "✅ Found contact to update"
- [ ] INSERT message gera log "💬 INSERT message received"
- [ ] INSERT message gera log "✅ Found contact to update with new message"
- [ ] UI atualiza sem refresh (badges, ordem, preview)

---

## 💡 Dicas

1. **Filtro "Todas":** Teste com filtro "Todas" selecionado para ver todas as conversas
2. **Múltiplas Abas:** Abra 2 abas do Livechat para ver update em tempo real
3. **Network Tab:** Verifique se há erros na aba Network (filtrar por "websocket")
4. **Realtime Inspector:** Use Supabase Studio → Realtime Inspector para ver eventos

---

## 📞 Próximos Passos

**Se tudo funcionar:**
- ✅ Realtime está OK
- ✅ Pode remover alguns logs de debug (manter apenas erros)
- ✅ Testar em produção com n8n real

**Se não funcionar:**
- ❌ Compartilhe os logs do console
- ❌ Compartilhe screenshot do Supabase Realtime settings
- ❌ Verifique se `tenant_id` está correto
