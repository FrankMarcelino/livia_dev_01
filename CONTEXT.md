# Contexto do Projeto - LIVIA MVP

**Última atualização:** 2025-11-16

## Visão Geral
**LIVIA** é uma plataforma SaaS de atendimento com inteligência artificial, **multi-tenant** e **multiusuário**, voltada para empresas que atendem seus clientes finais por canais como WhatsApp, Instagram, webchat e outros.

O **aplicativo do tenant (Versão 1)** é a interface usada pelos **usuários internos da empresa cliente** para:
- Acompanhar e interagir com conversas em tempo real (**Livechat**)
- Gerenciar o conteúdo da **Base de Conhecimento** (bases e synapses)
- **Testar e treinar o uso do conhecimento** pelo agente de IA (**Treinamento Neurocore**)

## Telas Principais do MVP

### 1. Livechat
Centro operacional de atendimento. Permite:
- **Visualizar** lista de contatos e conversas
- **Acompanhar em tempo real** (Supabase Realtime) mensagens entre cliente ↔ IA ↔ usuário
- **Pausar/retomar** conversa (nível conversa) e IA (nível específico)
- **Enviar mensagens manuais** (via n8n para canal)
- **Retomar conversas encerradas** pela IA

### 2. Base de Conhecimento
Modelagem do conhecimento usado pela IA. Permite:
- **CRUD de bases** de conhecimento (agrupamentos lógicos)
- **CRUD de synapses** (unidades de conteúdo)
  - Título, content, descrição, image_url
  - Estados: draft, indexing, publishing, error
  - Flag is_enabled (ativar/desativar)
- **Fluxo de publicação**: draft → publish → n8n processa → embeddings criados e armazenados externamente

### 3. Treinamento Neurocore
Interface de teste e validação do comportamento da IA. Permite:
- **Simular perguntas** para a IA
- **Visualizar resposta** gerada
- **Ver synapses usadas** na resposta
- **Editar synapses** diretamente da tela (se identificar problemas)
- **Despublicar/desabilitar/remover** synapses problemáticas

## Estado Atual
**Fase:** Setup e Planejamento ✅ COMPLETO

**Completado:**
- ✅ Estrutura de documentação criada (CONTEXT, PROGRESS, DECISIONS)
- ✅ Skill customizada do Claude Code criada (estrutura híbrida)
- ✅ Decisões arquiteturais documentadas (MCP, Skills)
- ✅ Referências técnicas detalhadas (n8n, Supabase, Frontend, States, Webhooks)
- ✅ Schema do banco documentado e migração criada
- ✅ Estados e fluxos mapeados
- ✅ Webhooks n8n especificados
- ✅ Tipos TypeScript exemplo gerados

**Próximo:** Iniciar desenvolvimento do projeto Next.js

## Objetivos da Próxima Sessão
- [ ] Criar projeto Next.js 15 com App Router
- [ ] Configurar Supabase (client/server)
- [ ] Rodar migração 001_schema_improvements.sql no Supabase
- [ ] Configurar shadcn/ui
- [ ] Criar estrutura de pastas do projeto
- [ ] Gerar tipos TypeScript do Supabase (`npx supabase gen types`)
- [ ] Configurar variáveis de ambiente (.env.local)

## Tecnologias Utilizadas
- **Next.js 15** - Framework React com App Router
- **Supabase** - BaaS (Auth + Database + Realtime)
- **n8n** - Orquestração de workflows de IA
- **shadcn/ui** - Biblioteca de componentes UI
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Estilização

## Estrutura do Projeto
```
projeto/                                    ← Raiz = Projeto Next.js ✅
├── app/                                    ← App Router (páginas Next.js)
│   ├── page.tsx                            # Home page
│   ├── layout.tsx                          # Layout raiz
│   ├── globals.css                         # Estilos globais
│   ├── livechat/page.tsx                   # Página Livechat
│   └── api/                                # API Routes
│       ├── conversations/pause-ia/
│       ├── conversations/resume-ia/
│       └── n8n/send-message/
├── components/                             ← Componentes React
│   ├── livechat/                           # Componentes Livechat
│   └── ui/                                 # shadcn/ui components
├── lib/                                    ← Bibliotecas e utilidades
│   ├── supabase/                           # Cliente Supabase
│   ├── queries/                            # Queries Supabase
│   ├── hooks/                              # React hooks
│   └── utils.ts                            # Funções auxiliares
├── types/                                  ← Tipos TypeScript
│   ├── database.ts                         # Tipos gerados Supabase
│   └── livechat.ts                         # Tipos Livechat
├── public/                                 ← Assets estáticos
├── scripts/                                ← Scripts utilitários
│   ├── test-supabase.js
│   ├── seed-database.js
│   ├── clean-database.js
│   └── verify-seed.js
├── .claude/skills/livia-mvp/              ← Skills Claude Code
│   ├── SKILL.md                            # Skill principal
│   ├── n8n-reference.md                    # Padrões de integração n8n
│   ├── supabase-reference.md               # Queries e Realtime
│   ├── frontend-reference.md               # Next.js e shadcn/ui
│   ├── states-and-flows.md                 # Estados e fluxos
│   └── webhooks-livia.md                   # Webhooks LIVIA
├── docs/                                   ← Documentação técnica
│   ├── database-schema.md
│   ├── types-example.ts
│   ├── SETUP.md
│   ├── webhook-implementation-notes.md
│   └── migrations/
│       ├── 001_schema_improvements.sql
│       └── 001_schema_improvements_v2.sql  ✅
├── package.json                            ← Dependências (consolidado)
├── next.config.ts                          ← Config Next.js
├── tsconfig.json                           ← Config TypeScript
├── tailwind.config.ts                      ← Config Tailwind
├── .env.local                              ← Variáveis de ambiente
├── CONTEXT.md
├── PROGRESS.md
├── DECISIONS.md
└── REFACTORING_PLAN.md                     ← Plano de refatoração ✅
```

## Dependências Principais
**Runtime:**
- next@15
- react@18
- @supabase/ssr
- @supabase/supabase-js

**UI:**
- shadcn/ui components
- tailwindcss
- lucide-react (ícones)

**Dev:**
- typescript
- eslint
- prettier (recomendado)

## Observações Importantes

### Decisões Arquiteturais
- ❌ **MCP não será usado no MVP** - Foco em simplicidade e entrega rápida
- ✅ **Skills customizadas** - Estrutura híbrida com referências especializadas
- ✅ **Server Components por padrão** - Client components apenas quando necessário

### Segurança
- NUNCA expor webhooks n8n no client
- Sempre validar `tenant_id` nas queries (multi-tenancy)
- Usar RLS (Row Level Security) em todas as tabelas Supabase
- API Routes como proxy para n8n

### Convenções
- Componentes: PascalCase
- Arquivos: kebab-case
- Tipos: Importar de `@/types/database` ou `@/types/models`

### Conceitos Importantes

**Multi-tenancy**:
- Isolamento total por `tenant_id`
- RLS (Row Level Security) em todas as tabelas
- Usuários só vêem dados do próprio tenant

**Synapses e Base Vetorial**:
- **Synapse**: Unidade de conhecimento (título + content + descrição)
- **Embeddings**: Synapse é publicada → n8n processa → chunks vetorizados (OpenAI ada-002) → armazenados em base vetorial externa (gerenciada pelo n8n)
- **Busca semântica**: IA (via n8n) faz query vetorial para encontrar synapses relevantes
- **Frontend**: Apenas gerencia CRUD de synapses, não acessa embeddings diretamente

**Estados de Conversa**:
- `open`: Conversa ativa
- `paused`: Conversa pausada (IA para)
- `closed`: Conversa encerrada
- `ia_active`: Controla se IA responde ou não (independente do status)

**Fluxo de Integração**:
```
Frontend → API Route → n8n Webhook → IA/Canal → Callback → Supabase → Realtime → Frontend
```

### Webhooks n8n (MVP WhatsApp - 6 webhooks)
- `/webhook/livia/send-message` - Enviar mensagem para WhatsApp
- `/webhook/livia/sync-synapse` - Publicar/editar synapse (vetorização)
- `/webhook/livia/pause-conversation` - Pausar conversa (IA + usuário)
- `/webhook/livia/resume-conversation` - Retomar conversa
- `/webhook/livia/pause-ia` - Pausar IA (conversa específica)
- `/webhook/livia/resume-ia` - Retomar IA (conversa específica)

**Webhooks removidos do MVP** (substituídos por CRUD no banco):
- ❌ `neurocore-query` - Query de treinamento (CRUD)
- ❌ `use-quick-reply` - Incrementar contador (CRUD)

**Veja documentação completa**: [webhooks-livia.md](.claude/skills/livia-mvp/webhooks-livia.md)
**Veja decisão arquitetural**: [DECISIONS.md - Decisão #005](DECISIONS.md)

## Documentação Detalhada

- **Schema do Banco**: [docs/database-schema.md](docs/database-schema.md)
- **Estados e Fluxos**: [.claude/skills/livia-mvp/states-and-flows.md](.claude/skills/livia-mvp/states-and-flows.md)
- **Webhooks n8n**: [.claude/skills/livia-mvp/webhooks-livia.md](.claude/skills/livia-mvp/webhooks-livia.md)
- **Migração SQL**: [docs/migrations/001_schema_improvements_v2.sql](docs/migrations/001_schema_improvements_v2.sql)
- **Tipos TypeScript (exemplo)**: [docs/types-example.ts](docs/types-example.ts)

## Links Úteis
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Claude Code Skills](https://code.claude.com/docs/en/skills)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)

## Variáveis de Ambiente Necessárias
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY= # Para server-side admin

# n8n Base URL
N8N_BASE_URL=https://n8n.example.com

# n8n Webhooks LIVIA (MVP WhatsApp - 6 webhooks)
N8N_SEND_MESSAGE_WEBHOOK=/webhook/livia/send-message
N8N_SYNC_SYNAPSE_WEBHOOK=/webhook/livia/sync-synapse
N8N_PAUSE_CONVERSATION_WEBHOOK=/webhook/livia/pause-conversation
N8N_RESUME_CONVERSATION_WEBHOOK=/webhook/livia/resume-conversation
N8N_PAUSE_IA_WEBHOOK=/webhook/livia/pause-ia
N8N_RESUME_IA_WEBHOOK=/webhook/livia/resume-ia

# n8n Callback Configuration
N8N_CALLBACK_SECRET=random-secret-key-here
N8N_CALLBACK_BASE_URL=https://livia-app.example.com/api/n8n/callback
```
