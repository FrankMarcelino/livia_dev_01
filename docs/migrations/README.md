# Migrações SQL - LIVIA MVP

## 📋 Arquivos Disponíveis

### ✅ USAR ESTES:

#### **002_mvp_whatsapp_idempotent.sql** ⭐ RECOMENDADO
- ✅ **Totalmente idempotente** (pode rodar múltiplas vezes)
- ✅ Focado em WhatsApp MVP
- ✅ Sem tabela `synapse_embeddings` (base vetorial gerenciada pelo n8n)
- ✅ Todas as constraints com verificação `IF NOT EXISTS`

**Use este arquivo!**

---

#### **000_cleanup_duplicates.sql** (Opcional)
- Use APENAS se receber erros de "constraint already exists"
- Remove constraints duplicadas
- Remove tabela `synapse_embeddings` (não necessária no frontend)
- Execute ANTES da migração principal se necessário

---

### ❌ NÃO USAR:

#### **001_schema_improvements.sql**
- ❌ NÃO é idempotente (causa erros ao rodar 2x)
- ❌ Inclui tabela `synapse_embeddings` (base vetorial no frontend - decisão revertida)
- ❌ Inclui lógica multi-canal (removida do MVP)

**Mantido apenas para referência histórica.**

---

## 🚀 Como Usar

### Cenário 1: Primeira Execução (Banco Limpo)

1. Execute **002_mvp_whatsapp_idempotent.sql**
2. Pronto!

---

### Cenário 2: Já Tentou Rodar 001 e Deu Erro

1. Execute **000_cleanup_duplicates.sql** (limpa constraints duplicadas)
2. Execute **002_mvp_whatsapp_idempotent.sql**
3. Pronto!

---

### Cenário 3: Não Tem Certeza do Estado do Banco

Execute **002_mvp_whatsapp_idempotent.sql** diretamente.
- Se rodar sem erros: ✅ Tudo certo
- Se der erro de constraint: Execute **000_cleanup_duplicates.sql** e rode 002 novamente

---

## 📊 O Que Cada Migração Faz

### 002_mvp_whatsapp_idempotent.sql

**Alterações em synapses:**
- `+ content` (text) - Conteúdo principal usado pela IA
- `+ is_enabled` (boolean) - Controle de ativação

**Alterações em contacts:**
- `+ external_contact_id` (text) - ID do WhatsApp (ex: 5511999999999@c.us)

**Alterações em messages:**
- `+ external_message_id` (text) - ID da mensagem no WhatsApp

**Alterações em users:**
- `+ FK para auth.users` - Link com autenticação do Supabase

**Triggers:**
- Atualização automática de `updated_at` em todas as tabelas

**Validações:**
- Synapses publicadas devem ter conteúdo
- Mensagens de IA devem ter `agent_id`
- Mensagens de attendant devem ter `user_id`

---

## ⚠️ Observações Importantes

1. **Base Vetorial**: Gerenciada pelo n8n (Pinecone, Weaviate, etc), não no Supabase
2. **Multi-canal**: MVP foca apenas em WhatsApp, lógica multi-canal removida
3. **Idempotência**: 002 pode ser executado múltiplas vezes sem erro
4. **RLS**: Todas as tabelas devem ter Row Level Security habilitado

---

## 🔗 Referências

- **Schema Completo**: [database-schema.md](../database-schema.md)
- **Estados e Fluxos**: [../../.claude/skills/livia-mvp/states-and-flows.md](../../.claude/skills/livia-mvp/states-and-flows.md)
- **Decisão sobre Base Vetorial**: [../../DECISIONS.md](../../DECISIONS.md) (#003)
