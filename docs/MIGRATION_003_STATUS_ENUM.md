# Migration 003: Message Status ENUM

**Data:** 2025-11-21
**Arquivo:** `migrations/003_message_status_enum.sql`

## Objetivo

Converter o campo `messages.status` de TEXT para ENUM para:
1. Melhor integridade de dados
2. Performance otimizada
3. Deixar claro que **N8N é responsável** por atualizar o status

## Como Executar

### Opção 1: Supabase SQL Editor (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new
2. Cole o conteúdo do arquivo `migrations/003_message_status_enum.sql`
3. Clique em "Run"

### Opção 2: Via Terminal (se tiver acesso direto ao banco)

```bash
psql $DATABASE_URL < migrations/003_message_status_enum.sql
```

### Opção 3: Copiar e Colar SQL

Cole o SQL abaixo no SQL Editor do Supabase:

```sql
-- 1. Create ENUM type
DO $$ BEGIN
  CREATE TYPE message_status AS ENUM ('pending', 'sent', 'failed', 'read');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Drop existing CHECK constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_status_check;

-- 3. Remove DEFAULT before changing column type (IMPORTANTE!)
ALTER TABLE messages ALTER COLUMN status DROP DEFAULT;

-- 4. Convert column to ENUM
ALTER TABLE messages
ALTER COLUMN status TYPE message_status
USING (status::message_status);

-- 5. Set new default value with correct type
ALTER TABLE messages
ALTER COLUMN status SET DEFAULT 'pending'::message_status;

-- 6. Add comment
COMMENT ON COLUMN messages.status IS 'Message delivery status (ENUM). N8N is responsible for updating this field: pending → sent/failed → read. Frontend only inserts as pending.';

-- 7. Ensure index exists
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);
```

## Impacto

### ✅ O que continua funcionando
- Todas as mensagens existentes (serão convertidas automaticamente)
- Queries que filtram por status
- Índices existentes

### ⚠️ O que muda
- Apenas valores válidos podem ser inseridos: 'pending', 'sent', 'failed', 'read'
- TypeScript/tipos do Supabase precisarão ser regenerados

### 🔄 Responsabilidades

#### Frontend (API Route)
- Insere mensagens com `status = 'pending'`
- Nunca atualiza o status diretamente
- Apenas fallback para 'failed' se n8n não responder

#### N8N (Webhook)
- Atualiza `status = 'sent'` após envio bem-sucedido ao WhatsApp
- Atualiza `status = 'failed'` se houver erro
- Atualiza `status = 'read'` quando receber webhook de leitura do WhatsApp

## Verificar Após Migration

```sql
-- Verificar tipo da coluna
\d messages

-- Ver valores únicos de status
SELECT status, COUNT(*) FROM messages GROUP BY status;

-- Testar insert (deve funcionar)
INSERT INTO messages (conversation_id, content, sender_type, status)
VALUES ('test-id', 'test', 'attendant', 'pending');
```

## Rollback (se necessário)

```sql
-- Converter de volta para TEXT
ALTER TABLE messages
ALTER COLUMN status TYPE TEXT;

-- Recriar CHECK constraint
ALTER TABLE messages
ADD CONSTRAINT messages_status_check
CHECK (status IN ('pending', 'sent', 'failed', 'read'));
```
