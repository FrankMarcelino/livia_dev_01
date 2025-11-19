# Progresso do Projeto - LIVIA MVP

## Sessão 2025-11-19 - Implementação do Treinamento Neurocore

### Completado
- [x] Analisar MVP descrito vs implementado (análise de contraste)
- [x] Criar plano detalhado de implementação (400+ linhas)
- [x] Instalar dependências (react-markdown, remark-gfm, uuid, sonner)
- [x] Criar types completos para Neurocore
- [x] Implementar API route com modo mock configurável
- [x] Implementar Server Action para feedback
- [x] Criar 5 componentes (NeurocoreChat, TrainingQueryInput, etc.)
- [x] Integrar componentes na página Neurocore
- [x] Adicionar error handling e loading states
- [x] Executar testes (type-check, lint, build) - Sucesso
- [x] Documentar decisão #008 em DECISIONS.md
- [x] Atualizar PROGRESS.md

### Funcionalidades Implementadas

**Treinamento Neurocore:**
- ✅ Interface de chat para testar conhecimento da IA
- ✅ API route com modo mock (desenvolvimento sem n8n)
- ✅ Renderização de respostas em markdown (seguro)
- ✅ Cards de synapses usadas com score de similaridade
- ✅ Progress bar visual para score (0-100%)
- ✅ Feedback like/dislike com comentário opcional
- ✅ Auto-scroll para última resposta
- ✅ Empty state amigável
- ✅ Loading states animados
- ✅ Error handling robusto
- ✅ Timeout de 30s para n8n
- ✅ Limite de 20 queries no histórico (performance)

**Arquitetura:**
- ✅ Estado local das queries (não persiste no banco)
- ✅ Modo mock configurável via `NEUROCORE_MOCK=true`
- ✅ Simulação de latência realista (2-3s)
- ✅ Feedback salvo em `message_feedbacks` (JSON context)
- ✅ Validação: min 3 chars, max 500 chars
- ✅ Ctrl+Enter para enviar pergunta

### Arquivos Criados
- `types/neurocore.ts` - Types completos (TrainingQuery, TrainingResponse, etc.)
- `app/api/neurocore/query/route.ts` - API route com mock
- `app/actions/neurocore.ts` - Server Action para feedback
- `components/neurocore/neurocore-chat.tsx` - Container principal
- `components/neurocore/training-query-input.tsx` - Form de pergunta
- `components/neurocore/training-response-card.tsx` - Card de resposta
- `components/neurocore/synapse-used-card.tsx` - Card de synapse
- `components/neurocore/response-feedback-dialog.tsx` - Modal de feedback
- `components/neurocore/index.ts` - Barrel export
- `.env.local.example` - Variáveis de ambiente documentadas
- `docs/NEUROCORE_PLAN.md` - Plano detalhado (400 linhas)
- `docs/MVP_CONTRAST_ANALYSIS.md` - Análise de gaps (600 linhas)

### Arquivos Modificados
- `app/(dashboard)/neurocore/page.tsx` - Integração do NeurocoreChat
- `package.json` - Adicionadas dependências

### Bibliotecas Adicionadas
- `react-markdown` (12M downloads/semana) - Renderizar respostas
- `remark-gfm` - GitHub Flavored Markdown
- `uuid` + `@types/uuid` - IDs locais de queries
- `sonner` - Toast notifications (substitui toast deprecated)
- shadcn/ui: `progress`, `label`, `separator`

### Próximos Passos (Priorizados)
1. **Refatorar Base de Conhecimento** (hierarquia bases → synapses)
2. **Feedback de Mensagens** no Livechat (like/dislike em balões)
3. **Respostas Rápidas** no Livechat (comando "/" + sheet)
4. **Refatorar SynapseDialog** para reutilização no Neurocore
5. Dashboard (KPIs, gráficos)
6. Personalização NeuroCore

### Decisões Técnicas
- **Modo mock**: Desenvolvimento frontend independente do n8n (trocar flag quando pronto)
- **Estado local**: Queries não persistem no banco (simplicidade MVP)
- **react-markdown**: Padrão de mercado, seguro (whitelist de componentes)
- **Sonner**: Toast modern (shadcn/ui recomenda sobre toast deprecated)
- **Limitar histórico**: 20 queries no estado (evita problemas de performance)
- **Type assertion**: `message_feedbacks` não está no tipo gerado (aceito temporariamente)

### Gaps Identificados (MVP Descrito vs Implementado)
🔴 **Gap Crítico #1**: Base de Conhecimento sem hierarquia
- Implementamos CRUD de synapses direto
- MVP pede: Bases → Synapses relacionadas
- Impacto: Arquitetura diverge, precisa refactor

⚠️ **Gap #2**: Livechat - Layout pode estar divergente
- Implementado: 3 colunas
- MVP descrito: 4 colunas (Contatos | Conversas | Interações | Dados)

⚠️ **Gap #3**: Feedback de mensagens ausente
- Like/dislike no header da conversa
- Hover thumb-up/down em balões

⚠️ **Gap #4**: Respostas Rápidas ausentes
- Botão lightning-bolt (10 mais usadas)
- Comando "/" no input
- Sheet de gerenciamento

### Bloqueios/Problemas Resolvidos
- ✅ `use-toast` deprecated → Migrado para `sonner`
- ✅ `message_feedbacks` não no tipo → Type assertion temporário
- ✅ `tenant_id` pode ser null → Validação explícita
- ✅ Variável não usada no mock → Prefixada com `_`
- ✅ Import não usado → Removido

### Métricas
- **Arquivos criados**: 11
- **Componentes criados**: 5
- **Linhas de código**: ~1500 (componentes + API + types)
- **Documentação**: 1000+ linhas (planos + análise)
- **Build time**: 20.7s
- **Type-check**: ✅ Zero erros
- **Testes manuais**: Pendentes (aguardando setup do ambiente)

---

## Sessão 2025-11-18 - Implementação de Sidebar com Auto-Collapse

### Completado
- [x] Consultar documentação atualizada do shadcn/ui sidebar
- [x] Instalar componente sidebar do shadcn/ui
- [x] Criar hook customizado `useSidebarAutoCollapse` seguindo SOLID
- [x] Criar route groups `(auth)` e `(dashboard)`
- [x] Implementar componente AppSidebar com navegação
- [x] Criar layout do dashboard com SidebarProvider
- [x] Mover páginas existentes para route groups apropriados
- [x] Criar páginas placeholder (Knowledge Base, Neurocore)
- [x] Corrigir bug: sidebar expande ao sair do livechat
- [x] Executar testes de tipo (TypeScript) - Zero erros
- [x] Executar ESLint - Zero erros nos arquivos novos
- [x] Build production - Sucesso
- [x] Documentar decisão #006 em DECISIONS.md

### Funcionalidades Implementadas

**Sidebar de Navegação:**
- ✅ Componente shadcn/ui sidebar profissional
- ✅ Auto-collapse no `/livechat` (modo icon)
- ✅ Auto-expand ao sair do livechat
- ✅ 3 items de navegação (Livechat, Knowledge Base, Neurocore)
- ✅ Persistência de estado via cookies
- ✅ Keyboard shortcuts (Ctrl+B / Cmd+B)
- ✅ Acessibilidade completa (ARIA labels)
- ✅ Animações suaves de transição
- ✅ SidebarTrigger no header

**Arquitetura:**
- ✅ Route Groups: `(auth)` e `(dashboard)`
- ✅ Hook customizado: `useSidebarAutoCollapse`
- ✅ Wrapper Component para Server Components
- ✅ Layout unificado no dashboard

### Arquivos Criados
- `lib/hooks/use-sidebar-auto-collapse.ts` - Hook de auto-collapse
- `lib/hooks/index.ts` - Export barrel
- `components/layout/app-sidebar.tsx` - Sidebar principal
- `components/layout/nav-items.tsx` - Configuração de navegação
- `components/layout/sidebar-auto-collapse-wrapper.tsx` - Wrapper client
- `components/layout/index.ts` - Export barrel
- `app/(dashboard)/layout.tsx` - Layout com SidebarProvider
- `app/(dashboard)/livechat/page.tsx` - Livechat ajustado
- `app/(dashboard)/knowledge-base/page.tsx` - Placeholder
- `app/(dashboard)/neurocore/page.tsx` - Placeholder
- `app/(auth)/login/page.tsx` - Movido de app/login

### Arquivos Modificados
- `components/auth/header.tsx` - Adicionado SidebarTrigger + Separator
- `components/ui/sidebar.tsx` - Corrigido Math.random → useState
- `app/page.tsx` - Redirect para /livechat

### Próximos Passos
- [ ] Implementar Base de Conhecimento (CRUD de synapses)
- [ ] Implementar Treinamento Neurocore
- [ ] Adicionar testes E2E
- [ ] Corrigir RLS da tabela users (BACKLOG-001)

### Decisões Técnicas
- **shadcn/ui Sidebar**: Escolhido por acessibilidade, animações e keyboard shortcuts
- **Hook customizado**: `useSidebarAutoCollapse` aplica lógica baseada em rota
- **Route Groups**: Organiza rotas autenticadas vs públicas
- **Auto-collapse bidirecional**: Colapsa no livechat, expande ao sair
- **Princípios SOLID**: Single Responsibility, Open/Closed, Dependency Inversion

### Bloqueios/Problemas
- ✅ Bug corrigido: Sidebar não expandia ao sair do livechat
- ✅ ESLint warning: Fragment desnecessário (corrigido)
- ✅ Math.random em render (corrigido para useState)

---

## Sessão 2025-11-17 (Parte 2) - Implementação Completa do Livechat

### Completado
- [x] Corrigir bugs no Livechat (naming inconsistente em payloads)
- [x] Implementar API routes para controle de conversas:
  - `/api/conversations/pause` - Pausar conversa completa
  - `/api/conversations/resume` - Retomar conversa pausada
  - `/api/conversations/reopen` - Reabrir conversa encerrada
  - `/api/conversations/pause-ia` - Pausar IA (já existia, corrigido)
  - `/api/conversations/resume-ia` - Retomar IA (já existia, corrigido)
- [x] Expandir ConversationControls com controles de conversa
- [x] Adicionar indicadores visuais de status (badges coloridos)
- [x] Implementar confirmação para reabrir conversas encerradas
- [x] Validar todas as regras de negócio:
  - Não pausar conversa já pausada
  - Não pausar conversa encerrada
  - Não retomar conversa já ativa
  - Reabrir apenas conversas encerradas
  - Desabilitar controles de IA quando conversa pausada
- [x] Verificação de tipos TypeScript (passou sem erros)

### Funcionalidades do Livechat Implementadas

**Interface de Usuário:**
- ✅ Lista de contatos com conversas ativas
- ✅ Visualização de mensagens em tempo real
- ✅ Envio de mensagens manuais
- ✅ Controles de status da conversa (Aberta/Pausada/Encerrada)
- ✅ Controles de IA (Ativa/Pausada)
- ✅ Auto-scroll nas mensagens
- ✅ Badges coloridos indicando status
- ✅ Loading states durante operações

**Backend:**
- ✅ 5 API Routes implementadas
- ✅ Integração com webhooks n8n
- ✅ Validação de autenticação e tenant
- ✅ Tratamento de erros robusto
- ✅ Realtime Supabase funcionando

**Fluxos Completos:**
- ✅ Pausar conversa → IA desativa → UI atualiza
- ✅ Retomar conversa → IA reativa → UI atualiza
- ✅ Reabrir conversa encerrada → Confirmação → IA reativa
- ✅ Pausar IA específica → Conversa continua aberta
- ✅ Retomar IA → IA volta a responder
- ✅ Nova mensagem → Realtime → UI atualiza automaticamente

### Arquivos Modificados
- `components/livechat/conversation-controls.tsx` - Expandido com novos controles
- `components/livechat/message-input.tsx` - Corrigido naming de payload
- `app/api/conversations/pause/route.ts` - Criado
- `app/api/conversations/resume/route.ts` - Criado
- `app/api/conversations/reopen/route.ts` - Criado
- `BACKLOG.md` - Atualizado (Realtime marcado como concluído)

### Próximos Passos
- [ ] Implementar Base de Conhecimento (CRUD de synapses)
- [ ] Implementar Treinamento Neurocore
- [ ] Adicionar testes E2E
- [ ] Melhorar tratamento de erros com toast notifications
- [ ] Corrigir RLS da tabela users (BACKLOG-001)

### Decisões Técnicas
- **Separação de controles**: Conversa e IA são controladas separadamente
- **Confirmação para ações críticas**: Reabrir conversa encerrada requer confirmação
- **Desabilitar controles contextualmente**: IA não pode ser controlada se conversa pausada
- **Webhooks n8n**: Todas operações críticas passam pelo n8n para consistência
- **Realtime completo**: Mensagens e estado da conversa atualizam automaticamente

### Bloqueios/Problemas
- **RLS Users**: Ainda usando workaround com admin client (não bloqueante)
- **Webhooks n8n**: URLs ainda não configuradas (desenvolvimento local pendente)

---

## Sessão 2025-11-17 (Parte 1) - Setup do Projeto Next.js 15

### Completado
- [x] Criar projeto Next.js 15 com App Router
- [x] Configurar TypeScript strict mode com regras extras
- [x] Configurar ESLint rigoroso com limite de 200 linhas
- [x] Instalar e configurar Husky + lint-staged para pre-commit hooks
- [x] Instalar dependências do Supabase (@supabase/supabase-js, @supabase/ssr)
- [x] Instalar e configurar shadcn/ui
- [x] Instalar componentes essenciais (Button, Input, Card, Avatar, Badge, etc)
- [x] Criar estrutura de pastas modularizada
- [x] Criar Supabase client para Client Components
- [x] Criar Supabase client para Server Components
- [x] Criar n8n webhook client base
- [x] Criar template de variáveis de ambiente (.env.local.example)
- [x] Criar types placeholder para database
- [x] Criar documentação de setup (SETUP.md)
- [x] Inicializar git no projeto

### Configurações Aplicadas

**TypeScript Strict Mode:**
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- `noImplicitReturns: true`
- `noFallthroughCasesInSwitch: true`
- `noUncheckedIndexedAccess: true`
- `forceConsistentCasingInFileNames: true`

**ESLint Rigoroso:**
- `max-lines: 200` (warning) - Previne arquivos grandes
- `@typescript-eslint/no-explicit-any: error` - Proíbe uso de `any`
- `@typescript-eslint/no-unused-vars: error` - Variáveis não usadas
- `no-console: warn` (permite console.warn e console.error)
- `prefer-const: error`
- `no-var: error`
- `react-hooks/exhaustive-deps: error`

**Estrutura de Pastas:**
```
app/
├── api/{n8n,supabase}/
├── components/{livechat,knowledge-base,neurocore,shared,ui}/
├── lib/{supabase,n8n,utils,hooks}/
└── types/
```

**Dependências Instaladas:**
- next@16.0.3
- react@19.2.0
- @supabase/supabase-js
- @supabase/ssr
- lucide-react
- shadcn/ui components
- husky@9.1.7
- lint-staged@16.2.6

### Próximos Passos (Pendentes)
- [ ] Criar arquivo .env.local com credenciais reais
- [ ] Rodar migração 001_schema_improvements_mvp_whatsapp.sql no Supabase
- [ ] Gerar tipos TypeScript do Supabase (`npx supabase gen types`)
- [ ] Criar primeiras API Routes para n8n webhooks
- [ ] Implementar componentes do Livechat (ContactList, ConversationView, MessageInput)
- [ ] Configurar Supabase Realtime subscriptions
- [ ] Implementar autenticação

### Decisões Técnicas
- **Max 200 linhas por arquivo**: Configurado como warning no ESLint para incentivar modularização
- **Sem uso de `any`**: TypeScript strict impede uso de tipos implícitos
- **Pre-commit hooks**: Previne commits com erros de tipo ou lint
- **Estrutura modular**: Pastas separadas por feature/responsabilidade

### Bloqueios/Problemas
Nenhum bloqueio identificado. Setup pronto para desenvolvimento.

---

## Sessão 2025-11-16 (Parte 2) - Ajustes na Arquitetura de Dados

### Completado
- [x] Revisar migração SQL e identificar necessidade de ajustes
- [x] Remover tabela `synapse_embeddings` da migração (base vetorial gerenciada pelo n8n)
- [x] Renumerar seções da migração SQL (v2)
- [x] Atualizar resumo final da migração
- [x] Documentar decisão arquitetural (#003) sobre base vetorial
- [x] Atualizar CONTEXT.md com nova arquitetura de embeddings
- [x] Remover referências a pgvector do CONTEXT.md

### Decisão Tomada
**Base Vetorial no n8n**: A tabela `synapse_embeddings` foi removida do Supabase. O n8n gerencia toda a lógica de embeddings:
- Criação de embeddings ao publicar synapses
- Armazenamento em base vetorial externa
- Busca semântica durante processamento de IA

**Frontend apenas:**
- CRUD de synapses
- Controle de estados e flags
- Disparo de webhooks para publicação

### Bloqueios/Problemas
Nenhum bloqueio identificado.

---

## Sessão 2025-11-16 (Parte 1) - Setup Completo e Documentação Técnica

### Completado
- [x] Criar estrutura de documentação do projeto (CONTEXT, PROGRESS, DECISIONS)
- [x] Criar skill customizada LIVIA (estrutura híbrida)
- [x] Criar arquivo n8n-reference.md (8KB de padrões e exemplos)
- [x] Criar arquivo supabase-reference.md (13KB de queries e realtime)
- [x] Criar arquivo frontend-reference.md (13KB de Next.js e shadcn/ui)
- [x] Criar arquivo states-and-flows.md (estados, transições, diagramas)
- [x] Criar arquivo webhooks-livia.md (todos os webhooks específicos)
- [x] Documentar decisão sobre não usar MCP no MVP
- [x] Documentar decisão sobre estrutura híbrida de skills
- [x] Analisar schema do banco de dados (prós/contras detalhados)
- [x] Criar SQL de migração 001_schema_improvements_v2.sql (versão idempotente)
- [x] Criar database-schema.md (documentação completa do schema)
- [x] Gerar tipos TypeScript (arquivo de exemplo)
- [x] Atualizar CONTEXT.md com detalhes reais do projeto (3 telas, synapses, etc)
- [x] Atualizar SKILL.md com novas referências
- [x] Atualizar PROGRESS.md com sessão completa
- [x] Corrigir erro de idempotência na migração SQL

### Pendente (Próxima Sessão)
- [ ] Criar projeto Next.js 15 com App Router
- [ ] Configurar Supabase (client/server)
- [ ] Rodar migração 001_schema_improvements_v2.sql no Supabase
- [ ] Gerar tipos TypeScript com `npx supabase gen types`
- [ ] Configurar shadcn/ui
- [ ] Criar estrutura de pastas do projeto
- [ ] Configurar variáveis de ambiente (.env.local)
- [ ] Criar primeiros componentes (Livechat, Base Conhecimento)

### Bloqueios/Problemas
Nenhum bloqueio identificado.

---

## Histórico de Sessões

### Sessão 2025-11-16 - Setup Inicial
**Foco:** Estrutura de trabalho, skills customizadas e decisões arquiteturais

**Completado:**
- [x] Estrutura de documentação (CONTEXT, PROGRESS, DECISIONS)
- [x] Skill LIVIA com estrutura híbrida (1 skill + 3 referências)
- [x] Análise de prós/contras sobre uso de MCP
- [x] Decisão de não usar MCP no MVP
- [x] Documentação completa de padrões (n8n, Supabase, Frontend)

**Aprendizados:**
- Estrutura híbrida de skills é ideal para projetos complexos (economia de tokens + contexto unificado)
- MCP adiciona complexidade que não se justifica no MVP
- Documentar decisões arquiteturais desde o início facilita onboarding
- Claude Code skills com arquivos de referência funcionam como "documentação executável"
- Analisar schema ANTES de começar a codar evita retrabalho
- Documentar estados e fluxos previne bugs de lógica de negócio
- Webhooks bem especificados facilitam integração com n8n

**Decisões Tomadas:**
- Adiar MCP para pós-MVP
- Usar estrutura híbrida de skills (SKILL.md + referências)
- shadcn/ui para componentes UI
- Server Components por padrão
- Melhorias críticas no schema (content em synapses, tabela de embeddings, etc)

**Problemas Encontrados no Schema:**
- Falta campo `content` em synapses (CORRIGIDO na migração)
- Falta tabela `synapse_embeddings` para base vetorial (CRIADO)
- Falta rastreamento de pausa de IA por usuário (CORRIGIDO)
- Falta tipo `system` em message_sender_type (CORRIGIDO)
- `users.id` não estava linkado com `auth.users` (CORRIGIDO)

**Problemas Encontrados na Migração:**
- Erro "constraint already exists" ao executar migração múltiplas vezes
- Causa: `CREATE TABLE IF NOT EXISTS` com constraints inline cria constraints mesmo quando tabela existe
- Solução: Migração v2 com verificação individual de cada constraint via pg_constraint
- Status: CORRIGIDO (001_schema_improvements_v2.sql é totalmente idempotente)

---

## Métricas
- **Skills criadas:** 1 (livia-mvp)
- **Arquivos de referência:** 5 (n8n, supabase, frontend, states, webhooks)
- **Documentação criada:** 3 arquivos (database-schema.md, types-example.ts, migração SQL)
- **Decisões documentadas:** 2 (MCP, Skills)
- **Melhorias no schema:** 10 (detalhadas na migração)
- **Webhooks mapeados:** 9 (send-message, sync-synapse, neurocore-query, etc)
- **Total de componentes criados:** 0 (próxima sessão)
- **Testes implementados:** 0 (próxima sessão)
- **Protótipos validados:** 0 (próxima sessão)
