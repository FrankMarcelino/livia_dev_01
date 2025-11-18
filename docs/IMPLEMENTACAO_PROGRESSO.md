# Progresso da Implementação - Quick Replies, Customer Data Panel e Feedback

**Data:** 2025-11-18
**Status:** ✅ Fase de Preparação e Quick Replies (Backend) Completa

---

## ✅ Concluído

### 1. Preparação Inicial
- ✅ Instalados componentes shadcn/ui: dialog, label, sonner, popover, command
- ✅ Instaladas bibliotecas: zod, @brazilian-utils/brazilian-utils, use-debounce, date-fns
- ✅ Corrigido bug em `getQuickReplies()` - removido filtro `is_active` inexistente
- ✅ Criados novos tipos TypeScript em `types/livechat.ts`

### 2. Quick Replies - Backend
- ✅ `lib/queries/quick-replies.ts` - Queries para buscar, criar e incrementar uso
- ✅ `lib/utils/quick-replies.ts` - Helper para substituição de variáveis dinâmicas
- ✅ `app/api/quick-replies/route.ts` - API GET e POST
- ✅ `app/api/quick-replies/usage/route.ts` - API POST para incrementar contador
- ✅ `docs/sql-quick-replies.sql` - SQL function (PRECISA SER EXECUTADA NO SUPABASE)

### 3. Validações
- ✅ `npm run type-check` - 0 erros de tipo
- ✅ Todos os arquivos seguem padrões do projeto

---

## ⏳ Próximos Passos

### PASSO 1: Executar SQL no Supabase ⚠️ IMPORTANTE

Antes de continuar, execute o SQL no Supabase SQL Editor:

```sql
-- Arquivo: docs/sql-quick-replies.sql
CREATE OR REPLACE FUNCTION increment_quick_reply_usage(reply_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE quick_reply_templates
  SET usage_count = usage_count + 1,
      updated_at = NOW()
  WHERE id = reply_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### PASSO 2: Criar Componente QuickRepliesPanel

**Arquivo:** `components/livechat/quick-replies-panel.tsx`

**Funcionalidades:**
- Popover com lista de quick replies
- Busca/filtro em tempo real
- Navegação por teclado (↑↓ Enter)
- Badge "Popular" nas top 3
- Substituição de variáveis ao selecionar
- Registro de uso em background (fire-and-forget)

**Referência:** Ver exemplo completo no plano de implementação aprovado

### PASSO 3: Integrar no MessageInput

**Arquivo:** `components/livechat/message-input.tsx` (MODIFICAR)

Adicionar:
1. Botão ⚡ antes do textarea
2. State para controlar abertura do painel
3. Callback para inserir mensagem selecionada no textarea
4. Passar props necessárias: `conversationId`, `contactName`, `tenantId`

### PASSO 4: Fase 2 - Customer Data Panel

#### 4.1 Executar SQL no Supabase

```sql
-- Criar tabela contact_data_changes
CREATE TABLE contact_data_changes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  contact_id UUID NOT NULL REFERENCES contacts(id),
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID NOT NULL REFERENCES users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_contact_data_changes_contact ON contact_data_changes(contact_id);
CREATE INDEX idx_contact_data_changes_tenant ON contact_data_changes(tenant_id);

ALTER TABLE contact_data_changes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view changes from their tenant"
  ON contact_data_changes FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert changes"
  ON contact_data_changes FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));
```

#### 4.2 Criar Arquivos

1. **`lib/utils/validators.ts`** - Validações BR (CPF, CNPJ, telefone, email)
2. **`lib/queries/contacts.ts`** - Queries para buscar/atualizar contato
3. **`app/api/contacts/[id]/route.ts`** - GET e PATCH
4. **`components/livechat/customer-data-panel.tsx`** - Painel flutuante
5. Integrar em `app/livechat/page.tsx`

### PASSO 5: Fase 3 - Message Feedback

#### 5.1 Executar SQL no Supabase

```sql
CREATE TABLE message_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  message_id UUID NOT NULL REFERENCES messages(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  rating TEXT NOT NULL CHECK (rating IN ('positive', 'negative')),
  comment TEXT,
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX idx_message_feedback_message ON message_feedback(message_id);
CREATE INDEX idx_message_feedback_conversation ON message_feedback(conversation_id);

ALTER TABLE message_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view feedback from their tenant"
  ON message_feedback FOR SELECT
  USING (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can insert feedback"
  ON message_feedback FOR INSERT
  WITH CHECK (tenant_id = (SELECT tenant_id FROM auth.users WHERE id = auth.uid()));
```

#### 5.2 Criar Arquivos

1. **`lib/queries/feedback.ts`** - Queries para criar/buscar feedback
2. **`app/api/feedback/message/route.ts`** - POST
3. **`components/livechat/message-feedback-buttons.tsx`** - Botões 👍👎
4. Modificar `components/livechat/message-item.tsx` - Adicionar botões

### PASSO 6: Adicionar Toaster no Layout

**Arquivo:** `app/layout.tsx` ou `app/livechat/layout.tsx`

```tsx
import { Toaster } from '@/components/ui/sonner';

// No JSX:
<body>
  {children}
  <Toaster />
</body>
```

### PASSO 7: Testes e Validações

Executar antes de commitar cada fase:
```bash
npm run type-check
npm run lint
```

Testar manualmente:
- Quick Replies: Abrir painel, buscar, selecionar, verificar variáveis substituídas
- Customer Data: Editar campo, verificar auto-save, copiar dados
- Feedback: Dar feedback positivo/negativo em mensagem da IA

### PASSO 8: Atualizar Documentação

**Arquivo:** `docs/LIVECHAT_STATUS.md`

Alterar status de ⏳ para ✅:
- Todos os endpoints de feedback e dados
- Todos os componentes planejados
- Todas as queries planejadas

### PASSO 9: Commit Final

```bash
git add .
git commit -m "feat: implementar quick replies, painel de dados e feedback

- Quick replies com substituição de variáveis e contador de uso
- Painel de dados do cliente com auto-save e validações
- Sistema de feedback para mensagens da IA
- Todas funcionalidades com validação TypeScript e ESLint"
```

---

## 📋 Arquivos Criados (até agora)

1. `types/livechat.ts` - Tipos adicionados
2. `lib/queries/quick-replies.ts` - NEW
3. `lib/utils/quick-replies.ts` - NEW
4. `app/api/quick-replies/route.ts` - NEW
5. `app/api/quick-replies/usage/route.ts` - NEW
6. `docs/sql-quick-replies.sql` - NEW
7. `components/ui/dialog.tsx` - Instalado
8. `components/ui/label.tsx` - Instalado
9. `components/ui/sonner.tsx` - Instalado
10. `components/ui/popover.tsx` - Instalado
11. `components/ui/command.tsx` - Instalado

## 📝 Observações Importantes

1. **SQL Functions:** Precisam ser executadas manualmente no Supabase antes de testar
2. **Toaster:** Precisa ser adicionado no layout para ver notificações toast
3. **Validações:** Sempre rodar `npm run type-check` antes de commitar
4. **Multi-tenancy:** Todas as rotas validam `tenant_id` (padrão seguido)
5. **Padrões:** Código segue exatamente os padrões do projeto existente

## 🎯 Estimativa Restante

- Quick Replies (Frontend): ~6h
- Customer Data Panel: ~16h
- Message Feedback: ~12h
- Testes e documentação: ~4h
- **Total:** ~38h

---

**Continuar implementação seguindo os passos acima na ordem.**
