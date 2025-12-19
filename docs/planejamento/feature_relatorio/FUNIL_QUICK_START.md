# ⚡ Relatório Funil - Quick Start Guide

> Guia rápido para colocar o Relatório Funil em funcionamento

---

## ✅ Checklist de Implementação

### 1. Backend SQL (5 minutos)

```bash
# 1. Abrir Supabase Dashboard
# 2. Ir para SQL Editor
# 3. Copiar conteúdo de:
```

📁 `sql/dashboard/03_function_funil.sql`

```sql
-- Clicar em "Run" ou CMD+Enter
-- Aguardar mensagem: "Success. No rows returned"
```

**Validar:**
```sql
-- Testar função (substituir TENANT_ID):
SELECT get_funil_data(
  'SEU_TENANT_ID_AQUI'::UUID,
  30,
  NULL
);

-- Deve retornar JSON estruturado
```

---

### 2. Verificar Dependências (1 minuto)

```bash
# Recharts deve estar instalado
npm list recharts

# Se não estiver:
npm install recharts
```

---

### 3. Testar Localmente (2 minutos)

```bash
# Iniciar servidor
npm run dev

# Abrir navegador
# http://localhost:3000/relatorios/funil

# Fazer login se necessário
```

**Verificar:**
- ✅ KPIs carregam (6 cards)
- ✅ Funil visual aparece
- ✅ Gráficos renderizam
- ✅ Filtros funcionam

---

### 4. Ajustes Opcionais

#### Adicionar Indexes (se performance < 2s)

```sql
CREATE INDEX IF NOT EXISTS idx_conversations_tenant_status 
  ON conversations(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_conversations_tenant_created_status 
  ON conversations(tenant_id, created_at, status);
```

#### Configurar Reasons Reais (futuro)

```sql
-- Opção 1: Adicionar colunas
ALTER TABLE conversations 
  ADD COLUMN IF NOT EXISTS pause_reason TEXT,
  ADD COLUMN IF NOT EXISTS closure_reason TEXT;

-- Opção 2: Tabela de eventos (recomendado)
CREATE TABLE IF NOT EXISTS conversation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  event_type TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Acesso Rápido

### URLs
- **Dev:** http://localhost:3000/relatorios/funil
- **Prod:** https://seu-dominio.com/relatorios/funil

### Arquivos Principais
```
sql/dashboard/03_function_funil.sql       ← Executar no Supabase
app/(dashboard)/relatorios/funil/page.tsx ← Página principal
components/funil/funil-container.tsx      ← Container
hooks/use-funil-data.ts                   ← Hook de dados
app/api/funil/route.ts                    ← API endpoint
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| "Function does not exist" | Executar `03_function_funil.sql` no Supabase |
| "Unauthorized" | Fazer login novamente |
| "Tenant mismatch" | Verificar tenant_id do usuário |
| Gráficos vazios | Verificar se há conversas no período |
| Performance lenta | Adicionar indexes recomendados |

---

## 📊 Dados de Exemplo

Para testar com dados mock:

```sql
-- Inserir conversas de teste
INSERT INTO conversations (id, tenant_id, status, created_at, updated_at)
VALUES 
  (gen_random_uuid(), 'SEU_TENANT_ID'::UUID, 'open', NOW(), NOW()),
  (gen_random_uuid(), 'SEU_TENANT_ID'::UUID, 'paused', NOW() - INTERVAL '1 day', NOW()),
  (gen_random_uuid(), 'SEU_TENANT_ID'::UUID, 'closed', NOW() - INTERVAL '2 days', NOW());
```

---

## 🚀 Deploy Checklist

Antes de fazer deploy:

```bash
# 1. Lint
npm run lint

# 2. TypeScript
npx tsc --noEmit

# 3. Build
npm run build

# 4. Verificar no preview
npm run start
```

✅ Todos devem passar sem erros!

---

## 📝 Notas Importantes

1. **Mock Data:** Motivos de pausa/fechamento são calculados. Adicionar campos reais para produção.

2. **Cache:** Dados ficam em cache por 5 minutos. Use botão "Refresh" para forçar atualização.

3. **Tenant Isolation:** Sempre validado. Usuário só vê dados do próprio tenant.

4. **Performance:** Otimizado para até 100K conversas. Adicionar indexes se necessário.

---

**✨ Pronto para usar! Qualquer dúvida, consultar `FUNIL_IMPLEMENTATION_SUMMARY.md`**
