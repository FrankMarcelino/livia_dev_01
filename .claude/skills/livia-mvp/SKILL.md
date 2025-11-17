---
name: livia-mvp
description: Development assistant for LIVIA MVP project using Next.js 15, Supabase, and n8n. Enforces coding patterns, component structure, API routes conventions, and database queries. Activate when working with LIVIA codebase, creating components, integrating n8n webhooks, implementing Supabase features, or when user mentions LIVIA, contacts, conversations, or messages.
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# LIVIA MVP Development Assistant

## Contexto do Projeto
Sistema de atendimento com IA integrado ao n8n e Supabase.

## Arquitetura
- **Next.js 15** (App Router)
- **Supabase** (Auth + Database + Realtime)
- **n8n** (Orquestração de IA via webhooks)
- **shadcn/ui** (Componentes)

## 📚 Referências Especializadas

Para implementações específicas, consulte:
- **n8n integrations** → `n8n-reference.md` (webhooks, API routes, padrões)
- **Supabase queries & realtime** → `supabase-reference.md` (queries, auth, RLS, realtime)
- **UI components & Next.js** → `frontend-reference.md` (componentes, routing, shadcn/ui)
- **Estados e fluxos** → `states-and-flows.md` (máquinas de estado, transições, diagramas)
- **Webhooks LIVIA** → `webhooks-livia.md` (todos os webhooks n8n do projeto)

## Tipos do Sistema
Sempre importar de `@/types/database` ou `@/types/models`:
```typescript
import { Contact, Conversation, Message } from '@/types/database';
import { ContactWithConversations } from '@/types/models';
```

**Convenção:**
- `@/types/database` - Tipos base do Supabase
- `@/types/models` - Tipos compostos e modelos de domínio

## Convenções de Nomenclatura
- **Componentes:** PascalCase (ex: `MessageList.tsx`)
- **Arquivos:** kebab-case (ex: `use-messages.ts`)
- **Funções/Variáveis:** camelCase (ex: `sendMessage`)
- **Tipos/Interfaces:** PascalCase (ex: `MessageProps`)
- **Constantes:** UPPER_SNAKE_CASE (ex: `MAX_MESSAGE_LENGTH`)

## Estrutura de Pastas Recomendada
```
app/
├── (auth)/
│   ├── login/
│   └── signup/
├── (dashboard)/
│   ├── contacts/
│   ├── conversations/
│   └── settings/
├── api/
│   └── n8n/
│       ├── send-message/
│       └── quick-reply/
└── layout.tsx

components/
├── ui/              # shadcn components
├── contacts/
├── conversations/
└── messages/

lib/
├── supabase/
│   ├── client.ts
│   └── server.ts
└── utils.ts

types/
├── database.ts
└── models.ts
```

## Boas Práticas LIVIA

1. **Segurança:**
   - NUNCA expor credenciais ou webhooks no client
   - Sempre validar tenant_id nas queries
   - Usar RLS (Row Level Security) no Supabase

2. **Performance:**
   - Preferir Server Components quando possível
   - Usar streaming com Suspense
   - Implementar loading states adequados

3. **UX:**
   - Feedback visual para todas as ações
   - Tratamento de erros amigável
   - Estados de loading, empty e error

4. **Código:**
   - DRY (Don't Repeat Yourself)
   - Componentes pequenos e focados
   - Testes quando relevante
   - Comentários apenas quando necessário

## Checklist de Criação de Features

- [ ] Criar tipos necessários em `@/types/`
- [ ] Implementar queries Supabase (com RLS)
- [ ] Criar API Routes para n8n se necessário
- [ ] Desenvolver componentes UI com shadcn
- [ ] Adicionar tratamento de erros
- [ ] Implementar loading states
- [ ] Testar fluxo completo
- [ ] Verificar segurança (tenant_id, auth)
- [ ] Documentar decisões em DECISIONS.md
- [ ] Atualizar PROGRESS.md
