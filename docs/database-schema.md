# Database Schema - LIVIA MVP

Documentação completa do schema do banco de dados Supabase.

## Visão Geral

O LIVIA utiliza **PostgreSQL via Supabase** com:
- **Multi-tenancy**: Isolamento total por `tenant_id`
- **RLS (Row Level Security)**: Todas as tabelas protegidas
- **Realtime**: Subscriptions para updates em tempo real
- **Base Vetorial**: pgvector para embeddings de synapses

---

## Tipos Enumerados (ENUMs)

### `reason_type_enum`
```sql
'pause' | 'closure'
```
Tipo de razão para pausar ou encerrar uma conversa.

### `access_user_role`
```sql
'super_admin' | 'user'
```
- **super_admin**: Acesso total (gerencia neurocores, agents, tenants)
- **user**: Acesso ao próprio tenant

### `agent_type_enum`
```sql
'reactive' | 'active'
```
Tipo de comportamento do agente de IA.

### `agent_function_enum`
```sql
'support' | 'sales' | 'after_sales' | 'research'
```
Função principal do agente.

### `agent_gender_enum`
```sql
'male' | 'female'
```
Gênero para personalidade do agente.

### `contact_status_enum`
```sql
'open' | 'with_ai' | 'paused' | 'closed'
```
Estado do contato no sistema.

### `conversation_status_enum`
```sql
'open' | 'paused' | 'closed'
```
Estado da conversa.

### `message_sender_type_enum`
```sql
'customer' | 'attendant' | 'ai' | 'system'
```
- **customer**: Cliente final
- **attendant**: Usuário interno do tenant
- **ai**: Agente de IA
- **system**: Mensagens automáticas do sistema

### `feedback_type_enum`
```sql
'like' | 'dislike'
```

### `synapse_status_enum`
```sql
'draft' | 'indexing' | 'publishing' | 'error'
```
- **draft**: Rascunho (não publicada)
- **indexing**: Sendo processada para vetorização
- **publishing**: Publicada e disponível para IA
- **error**: Erro no processamento

### `feedback_process_status_enum`
```sql
'open' | 'in_progress' | 'closed'
```

---

## Tabelas Principais

### 1. `tenants` (Multi-tenancy)
Empresas clientes do LIVIA.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar | Nome da empresa |
| neurocore_id | uuid | FK → neurocores |
| niche_id | uuid | FK → niches (opcional) |
| is_active | boolean | Tenant ativo? |
| cnpj | varchar | UNIQUE |
| phone | varchar | |
| responsible_tech_* | varchar | Contato técnico |
| responsible_finance_* | varchar | Contato financeiro |
| plan | varchar | Plano contratado |
| master_integration_url | varchar | |
| master_integration_active | boolean | |

**RLS**: Apenas super_admin

---

### 2. `users` (Usuários Internos)
Usuários das empresas clientes.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK, FK → auth.users (Supabase Auth) |
| tenant_id | uuid | FK → tenants |
| full_name | varchar | |
| email | varchar | UNIQUE |
| whatsapp_number | varchar | |
| role | access_user_role | 'super_admin' \| 'user' |
| avatar_url | text | |
| is_active | boolean | |
| last_sign_in_at | timestamp | |
| modules | text[] | Módulos permitidos |

**RLS**:
- User pode ver si mesmo
- User pode ver colegas do tenant
- User pode atualizar próprio perfil
- Super_admin vê todos

---

### 3. `contacts` (Clientes Finais)
Pessoas que interagem via canais (WhatsApp, Instagram, etc).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| channel_id | uuid | FK → channels |
| name | varchar | |
| phone | varchar | |
| phone_secondary | varchar | |
| email | varchar | |
| country, city, zip_code | varchar | |
| address_* | varchar | |
| cpf, rg | varchar | |
| last_interaction_at | timestamp | |
| status | contact_status_enum | |
| customer_data_extracted | jsonb | Dados extraídos pela IA |
| tags | text[] | |
| last_negotiation | jsonb | |
| external_contact_id | text | ID no provedor externo |

**RLS**: Acesso por tenant

---

### 4. `conversations` (Conversas)
Cada interação entre contact e tenant.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| contact_id | uuid | FK → contacts |
| tenant_id | uuid | FK → tenants |
| channel_id | uuid | FK → channels |
| external_id | varchar | UNIQUE, ID externo |
| status | conversation_status_enum | 'open' \| 'paused' \| 'closed' |
| ia_active | boolean | IA está respondendo? |
| ia_paused_by_user_id | uuid | FK → users (quem pausou IA) |
| ia_paused_at | timestamp | Quando pausou |
| ia_pause_reason | text | Por que pausou |
| last_message_at | timestamp | |
| overall_feedback_type | feedback_type_enum | |
| overall_feedback_text | text | |
| conversation_pause_reason_id | uuid | FK → reasons |
| pause_notes | text | |
| conversation_closure_reason_id | uuid | FK → reasons |
| closure_notes | text | |

**RLS**: Acesso por tenant

**Lógica de Pausa/Retomada**:
```typescript
// Pausar IA
conversation.ia_active = false;
conversation.ia_paused_by_user_id = user.id;
conversation.ia_paused_at = now();

// Retomar IA
conversation.ia_active = true;
conversation.ia_paused_by_user_id = null;
conversation.ia_paused_at = null;
```

---

### 5. `messages` (Mensagens)
Histórico de mensagens das conversas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| channel_id | uuid | FK → channels |
| sender_type | message_sender_type_enum | customer \| attendant \| ai \| system |
| sender_user_id | uuid | FK → users (se attendant) |
| sender_agent_id | uuid | FK → agents (se ai) |
| content | text | Conteúdo da mensagem |
| timestamp | timestamp | |
| feedback_type | feedback_type_enum | |
| feedback_text | text | |
| external_message_id | text | ID no provedor |

**RLS**: Acesso baseado na conversa (que tem tenant_id)

**Constraints**:
- Se `sender_type = 'ai'` → `sender_agent_id NOT NULL`
- Se `sender_type = 'attendant'` → `sender_user_id NOT NULL`

---

### 6. `conversation_state_history` (Histórico de Estados)
Rastreia todas as mudanças de estado das conversas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| conversation_id | uuid | FK → conversations |
| from_status | conversation_status_enum | Estado anterior |
| to_status | conversation_status_enum | Novo estado |
| changed_by_user_id | uuid | FK → users |
| reason_id | uuid | FK → reasons |
| notes | text | |
| ia_active_before | boolean | |
| ia_active_after | boolean | |
| created_at | timestamp | |

**RLS**: Acesso baseado na conversa

**Exemplo de uso**:
```sql
-- Registrar pausa de conversa
INSERT INTO conversation_state_history (
  conversation_id,
  from_status,
  to_status,
  changed_by_user_id,
  reason_id,
  ia_active_before,
  ia_active_after
) VALUES (
  '...',
  'open',
  'paused',
  auth.uid(),
  'reason-uuid',
  true,
  false
);
```

---

### 7. `base_conhecimentos` (Bases de Conhecimento)
Agrupamentos lógicos de synapses.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| neurocore_id | uuid | FK → neurocores |
| name | varchar | Nome da base |
| description | text | |
| is_active | boolean | |

**RLS**: Acesso por tenant

---

### 8. `synapses` (Conteúdo para IA)
Unidades de conhecimento da base.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| base_conhecimento_id | uuid | FK → base_conhecimentos |
| tenant_id | uuid | FK → tenants |
| title | varchar | Título |
| content | text | **Conteúdo principal** |
| description | text | Resumo/meta |
| image_url | text | |
| status | synapse_status_enum | draft \| indexing \| publishing \| error |
| is_enabled | boolean | Ativa para uso? |

**RLS**: Acesso por tenant

**Fluxo de Publicação**:
```
1. Criar synapse (status: 'draft')
2. Editar content
3. Publicar → status: 'indexing'
4. n8n processa e cria embeddings
5. n8n atualiza status: 'publishing'
6. IA usa synapse nas respostas
```

---

### 9. `synapse_embeddings` (Base Vetorial)
Chunks e embeddings das synapses para busca semântica.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| synapse_id | uuid | FK → synapses |
| tenant_id | uuid | FK → tenants |
| chunk_index | integer | Ordem do chunk |
| chunk_content | text | Texto do chunk |
| embedding | vector(1536) | Embedding OpenAI ada-002 |
| metadata | jsonb | Tags, contexto |

**Índices**:
- IVFFlat para busca vetorial (`embedding`)
- B-tree para `synapse_id`

**RLS**: Acesso por tenant

**Exemplo de busca**:
```sql
-- Buscar synapses mais relevantes
SELECT
  s.title,
  s.content,
  e.chunk_content,
  1 - (e.embedding <=> query_embedding) AS similarity
FROM synapse_embeddings e
JOIN synapses s ON s.id = e.synapse_id
WHERE e.tenant_id = :tenant_id
  AND s.is_enabled = true
  AND s.status = 'publishing'
ORDER BY e.embedding <=> :query_embedding
LIMIT 5;
```

---

### 10. `channels` (Canais de Mensageria)
WhatsApp, Instagram, webchat, etc.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| channel_provider_id | uuid | FK → channel_providers |
| name | varchar | Nome do canal |
| identification_number | varchar | Número/ID |
| instance_company_name | varchar | UNIQUE |
| is_active | boolean | |
| is_receiving_messages | boolean | |
| is_sending_messages | boolean | |
| observations | text | |
| external_api_url | varchar | |
| provider_external_channel_id | text | |
| config_json | jsonb | Configurações específicas |
| message_wait_time_fragments | integer | Tempo entre fragmentos (padrão: 8s) |

**RLS**: Acesso por tenant

---

### 11. `quick_reply_templates` (Respostas Rápidas)
Templates de mensagens para usuários internos.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| title | varchar | Título |
| message | text | Conteúdo |
| category | text | Categoria (ex: "saudacao", "comercial") |
| tags | text[] | Tags para busca |
| icon | varchar | |
| usage_count | integer | Contador de uso |
| is_active | boolean | |

**RLS**: Acesso por tenant

**Exemplo de uso**:
```sql
-- Buscar templates por categoria
SELECT * FROM quick_reply_templates
WHERE tenant_id = :tenant_id
  AND is_active = true
  AND category = 'comercial'
ORDER BY usage_count DESC;
```

---

### 12. `feedbacks` (Feedbacks)
Feedbacks dos usuários sobre conversas/mensagens.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants |
| user_id | uuid | FK → users |
| conversation_id | uuid | FK → conversations |
| message_id | uuid | FK → messages (opcional) |
| feedback_type | feedback_type_enum | like \| dislike |
| feedback_text | text | |
| feedback_status | feedback_process_status_enum | open \| in_progress \| closed |
| super_admin_comment | text | |

**RLS**: Acesso por tenant

---

## Tabelas de Configuração (Super Admin)

### `neurocores`
Núcleos de IA configurados pelo super admin.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar | |
| description | text | |
| id_subwork_n8n_neurocore | varchar | ID do subworkflow n8n |
| is_active | boolean | |
| associated_agents | uuid[] | Array de agent IDs |

**RLS**: Apenas super_admin

---

### `agents`
Agentes de IA configurados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar | |
| type | agent_type_enum | reactive \| active |
| function | agent_function_enum | support \| sales \| ... |
| gender | agent_gender_enum | |
| persona | text | Descrição da persona |
| personality_tone | text | |
| communication_medium | varchar | |
| objective | text | |
| is_intent_agent | boolean | |
| associated_neurocores | uuid[] | |
| instructions | jsonb | |
| limitations | jsonb | |
| conversation_roteiro | jsonb | |
| other_instructions | jsonb | |

**RLS**: Apenas super_admin

---

### `channel_providers`
Provedores de mensageria (WhatsApp Business API, Instagram, etc).

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar | UNIQUE |
| description | text | |
| channel_provider_identifier_code | text | |
| id_subwork_n8n_master_integrator | text | |
| api_base_config | jsonb | |

**RLS**: Apenas super_admin

---

### `niches`
Nichos de mercado dos tenants.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| name | varchar | UNIQUE |
| description | text | |

**RLS**: Apenas super_admin

---

### `feature_modules`
Módulos de funcionalidades do sistema.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| key | varchar | UNIQUE |
| name | varchar | |
| description | text | |
| icon | varchar | |

**RLS**: Apenas super_admin

---

### `conversation_reasons_pauses_and_closures`
Razões pré-definidas para pausar/encerrar conversas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| reason_type | reason_type_enum | pause \| closure |
| neurocore_id | uuid | FK → neurocores |
| description | text | |
| is_active | boolean | |

**RLS**: Apenas super_admin

---

### `conversation_reactivations_settings`
Configurações de reativação automática de conversas.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | PK |
| tenant_id | uuid | FK → tenants (UNIQUE) |
| is_active | boolean | |
| max_reactivations | integer | |
| reactivation_time_1_minutes | integer | |
| reactivation_time_2_minutes | integer | |
| ... | ... | Até 5 tempos |
| start_time | time | Horário início |
| end_time | time | Horário fim |

**RLS**: Acesso por tenant

---

## Relacionamentos Principais

```
tenants (1) ──< (N) users
tenants (1) ──< (N) contacts
tenants (1) ──< (N) conversations
tenants (1) ──< (N) channels
tenants (1) ──< (N) base_conhecimentos
tenants (1) ──< (N) synapses

contacts (1) ──< (N) conversations
conversations (1) ──< (N) messages
conversations (1) ──< (N) conversation_state_history

base_conhecimentos (1) ──< (N) synapses
synapses (1) ──< (N) synapse_embeddings

neurocores (1) ──< (N) tenants
agents (N) ──> (M) neurocores (via arrays)
```

---

## Queries Comuns

### Livechat: Buscar contatos com última mensagem
```sql
SELECT
  c.*,
  conv.id AS conversation_id,
  conv.status AS conversation_status,
  conv.ia_active,
  msg.content AS last_message_content,
  msg.timestamp AS last_message_time
FROM contacts c
LEFT JOIN conversations conv ON conv.contact_id = c.id
LEFT JOIN LATERAL (
  SELECT * FROM messages
  WHERE conversation_id = conv.id
  ORDER BY timestamp DESC
  LIMIT 1
) msg ON true
WHERE c.tenant_id = :tenant_id
ORDER BY msg.timestamp DESC NULLS LAST;
```

### Treinamento Neurocore: Buscar synapses usadas
```sql
-- Buscar synapses similares à query
SELECT
  s.id,
  s.title,
  s.content,
  e.chunk_content,
  1 - (e.embedding <=> :query_embedding) AS similarity
FROM synapse_embeddings e
JOIN synapses s ON s.id = e.synapse_id
JOIN base_conhecimentos bc ON bc.id = s.base_conhecimento_id
WHERE bc.tenant_id = :tenant_id
  AND s.is_enabled = true
  AND s.status = 'publishing'
ORDER BY similarity DESC
LIMIT 5;
```

### Base de Conhecimento: Listar bases com contagem de synapses
```sql
SELECT
  bc.*,
  COUNT(s.id) FILTER (WHERE s.status = 'publishing') AS published_count,
  COUNT(s.id) FILTER (WHERE s.status = 'draft') AS draft_count
FROM base_conhecimentos bc
LEFT JOIN synapses s ON s.base_conhecimento_id = bc.id
WHERE bc.tenant_id = :tenant_id
GROUP BY bc.id;
```

---

## Índices de Performance

Além dos índices automáticos (PKs, FKs), criar:

```sql
-- Busca por tenant (usado em quase todas as queries)
CREATE INDEX contacts_tenant_id_idx ON contacts(tenant_id);
CREATE INDEX conversations_tenant_id_idx ON conversations(tenant_id);
CREATE INDEX messages_conversation_id_idx ON messages(conversation_id);

-- Ordenação temporal
CREATE INDEX messages_timestamp_idx ON messages(timestamp DESC);
CREATE INDEX conversations_last_message_at_idx ON conversations(last_message_at DESC);

-- Busca de IDs externos
CREATE INDEX contacts_external_contact_id_idx ON contacts(external_contact_id);
CREATE INDEX messages_external_message_id_idx ON messages(external_message_id);

-- Busca em arrays
CREATE INDEX quick_reply_templates_tags_idx ON quick_reply_templates USING gin(tags);
```

---

## Migrações

Ao adicionar novos campos ou tabelas, usar scripts em `docs/migrations/`:
- `001_schema_improvements.sql` - Melhorias iniciais
- `002_...` - Próximas migrações

Sempre testar em ambiente de dev antes de produção!
