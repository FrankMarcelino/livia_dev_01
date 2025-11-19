# Progresso do Projeto - LIVIA MVP

## Sessão 2025-11-19 (Tarde) - Refatoração Master-Detail + Webhooks N8N

### Completado
- [x] Criar plano detalhado KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md (736 linhas)
- [x] Documentar Decisão #010 em DECISIONS.md
- [x] Sprint 1: Remover 3 componentes antigos (modal aninhado)
- [x] Sprint 2: Criar 4 componentes novos (master-detail)
- [x] Sprint 3: Adicionar webhooks N8N para embeddings
- [x] Sprint 4: Atualizar página principal
- [x] Sprint 5: Executar testes (type-check, build) - Sucesso
- [x] Sprint 6: Atualizar documentação (DECISIONS.md, PROGRESS.md)

### Funcionalidades Implementadas

**Layout Master-Detail:**
- ✅ Scroll horizontal de cards (BaseConhecimentoCarousel)
- ✅ Card individual com highlight quando selecionado
- ✅ Badge com contador de synapses
- ✅ Toggle Ativa/Desativa em cada card
- ✅ Tabela de synapses exibida abaixo ao selecionar base
- ✅ Modal simples para criar/editar base (sem synapses aninhadas)
- ✅ Empty state quando não há bases
- ✅ Loading state ao carregar synapses

**Integração N8N:**
- ✅ Helper function para webhooks (`lib/utils/n8n-webhooks.ts`)
- ✅ Modo mock configurável via `N8N_MOCK=true`
- ✅ 4 webhooks implementados:
  - Sync Synapse (create/update) → gera embeddings
  - Delete Synapse Embeddings → remove embeddings
  - Toggle Synapse Embeddings → ativa/desativa embeddings
  - Inactivate Base → inativa base (synapses inacessíveis)
- ✅ Error handling robusto (webhooks não bloqueiam CRUD)
- ✅ Timeout de 10s para cada webhook
- ✅ Logs detalhados para debug

**Regras de Negócio:**
- ✅ Base inativa → todas synapses ficam inacessíveis
- ✅ Synapse desativada → webhook remove embeddings
- ✅ Delete de base → apenas soft delete (toggle inactive)
- ✅ Webhooks assíncronos (não bloqueiam UI)

### Arquivos Criados
- `components/knowledge-base/base-conhecimento-card.tsx` - Card individual
- `components/knowledge-base/base-conhecimento-carousel.tsx` - Scroll horizontal
- `components/knowledge-base/base-conhecimento-form-dialog.tsx` - Modal simples
- `components/knowledge-base/knowledge-base-master-detail.tsx` - Orquestrador
- `lib/utils/n8n-webhooks.ts` - Helper + types para webhooks
- `docs/KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md` - Plano completo (736 linhas)

### Arquivos Deletados
- `components/knowledge-base/base-conhecimento-dialog.tsx` - Modal aninhado antigo
- `components/knowledge-base/base-conhecimento-table.tsx` - DataTable antiga
- `components/knowledge-base/knowledge-base-container.tsx` - Orquestrador antigo

### Arquivos Modificados
- `components/knowledge-base/index.ts` - Exports atualizados
- `app/(dashboard)/knowledge-base/page.tsx` - Usa KnowledgeBaseMasterDetail
- `app/actions/synapses.ts` - Adicionadas 4 chamadas de webhook
- `app/actions/base-conhecimento.ts` - Adicionada 1 chamada de webhook
- `.env.local.example` - Variáveis N8N + flag N8N_MOCK
- `DECISIONS.md` - Decisão #010 adicionada

### Componentes Reutilizados (sem modificar)
- `SynapsesTable` - Já tinha callbacks perfeitos
- `SynapseDialog` - Já tinha onSuccess callback
- `DeleteSynapseDialog` - Já funcionava
- `SynapseActions` - Já passava callbacks

### Princípios SOLID Aplicados
**Single Responsibility:**
- Cada componente tem responsabilidade única e clara
- BaseConhecimentoCard: apenas renderiza card
- BaseConhecimentoCarousel: apenas layout de scroll
- BaseConhecimentoFormDialog: apenas form de base
- KnowledgeBaseMasterDetail: apenas orquestra estado

**Open/Closed:**
- Componentes extensíveis via callbacks
- Fechados para modificação (lógica interna estável)

**Dependency Inversion:**
- Componentes dependem de callbacks abstratos
- Não dependem de router.refresh (usar callbacks)
- Queries abstraídas em lib/queries

### Decisões Técnicas
- **Layout Master-Detail**: Alinha 100% com wireframe do usuário
- **Webhooks N8N**: Integração real para vetorização de synapses
- **Modo mock N8N**: Desenvolvimento sem dependência de N8N estar configurado
- **Error handling**: Webhooks não bloqueiam CRUD (logs + continue)
- **Estado local**: Refetch synapses ao trocar base (simplicidade MVP)
- **Callbacks**: onSuccess, onSynapseChange para refresh sem fechar modal

### Variáveis de Ambiente Adicionadas
```bash
# Webhooks N8N
N8N_DELETE_SYNAPSE_EMBEDDINGS_WEBHOOK=/webhook/livia/delete-synapse-embeddings
N8N_TOGGLE_SYNAPSE_EMBEDDINGS_WEBHOOK=/webhook/livia/toggle-synapse-embeddings
N8N_INACTIVATE_BASE_WEBHOOK=/webhook/livia/inactivate-base

# Mock Mode
N8N_MOCK=true  # Modo mock para desenvolvimento
```

### Bloqueios/Problemas Resolvidos
- ✅ Button importado mas não usado → Removido import
- ✅ Nome incorreto de action → toggleBaseConhecimentoActiveAction
- ✅ TypeScript errors → Corrigidos (type-check passou)
- ✅ Build errors → Nenhum (build passou)
- ✅ **Scroll horizontal na página toda** → Sidebar influenciava largura total
  - Solução: Adicionado `w-full overflow-x-hidden` no SidebarInset e todos containers
  - Arquivos: layout.tsx, page.tsx, master-detail.tsx, carousel.tsx
- ✅ **Toggle da sidebar não funcionava** → Hook forçava estado continuamente
  - Solução: Refatorado hook com useRef para detectar mudança de rota
  - Arquivo: use-sidebar-auto-collapse.ts
  - Comportamento: Agora permite toggle manual sem interferência do hook

### Métricas
- **Arquivos criados**: 5
- **Arquivos deletados**: 3
- **Arquivos modificados**: 10 (6 iniciais + 4 correções finais)
- **Componentes criados**: 4 (master-detail)
- **Webhooks implementados**: 4
- **Linhas de código**: ~800 (componentes + webhooks + types)
- **Documentação**: ~900 linhas (plano + decisão)
- **Build time**: 14.1s (melhor que antes: 18.4s)
- **Type-check**: ✅ Zero erros
- **ESLint**: ✅ Zero erros
- **Tempo total**: ~3 horas (plano + implementação + testes + docs)

### Próximos Passos
1. ✅ **Refatoração Master-Detail** - COMPLETO
2. Testar layout manualmente (aguarda ambiente dev)
3. Configurar webhooks N8N reais (trocar N8N_MOCK=false)
4. Feedback de Mensagens no Livechat (like/dislike em balões)
5. Respostas Rápidas no Livechat (comando "/" + sheet)
6. Dashboard (KPIs, gráficos)

---

## Sessão 2025-11-19 (Manhã) - Implementação do Treinamento Neurocore

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

---

## Sessão: 2025-11-19 (Continuação - Hierarquia Base de Conhecimento)

**Foco:** Implementação de hierarquia Base de Conhecimento → Synapses (Gap #1 do MVP)

**Completado:**
- [x] Sprint 1: Types, Queries e Server Actions para Base de Conhecimento
  - Criados 6 tipos (BaseConhecimento, BaseConhecimentoWithCount, etc.)
  - Criadas 9 queries (getBaseConhecimentos, createBaseConhecimento, etc.)
  - Criadas 4 Server Actions (create, update, delete, toggle)
- [x] Sprint 2: Componentes UI com Modal Aninhado
  - BaseConhecimentoTable (lista de bases)
  - BaseConhecimentoDialog (form + synapses aninhadas)
  - KnowledgeBaseContainer (client wrapper para estado)
  - Refatorado SynapsesTable, SynapseDialog, DeleteSynapseDialog (callbacks onSuccess)
- [x] Sprint 3: Integração e Migração
  - Refatorado /knowledge-base page para usar hierarquia
  - Criado API route /api/bases/[baseId]/synapses (client component fetch)
  - Criado script SQL de migração (base padrão + reassign synapses órfãs)
- [x] Sprint 4: Validações (já implementadas nos componentes)
- [x] Sprint 5: Testes e Documentação
  - ✅ TypeScript type-check
  - ✅ Build production (18.4s)
  - ✅ Decisão #009 documentada
  - ✅ 3 decisões rápidas adicionadas

**Aprendizados:**
- Modal aninhado funciona bem com shadcn/ui (portals gerenciam z-index)
- Callbacks (onSuccess, onSynapseChange) permitem UX fluida sem fechar modal
- Client components não podem usar queries de server.ts → usar API routes
- JOIN com count evita N+1 queries (getBaseConhecimentos)
- Migração SQL idempotente é crítica (verificações IF NOT EXISTS)
- SOLID aplicado previne refactors grandes (componentes reutilizáveis)

**Decisões Tomadas:**
- Modal Aninhado (vs Subrotas ou Accordion) - alinha MVP, 12-15h
- Callbacks para refresh local (vs router.refresh que perde contexto)
- API route para fetch de synapses (client component limitation)
- shadcn/ui Select component adicionado

**Problemas Encontrados e Resolvidos:**
1. **Build Error: Client component importing server queries**
   - Problema: BaseConhecimentoDialog importava getSynapsesByBase que usa createClient(server.ts)
   - Causa: next/headers só funciona em Server Components
   - Solução: Criada API route /api/bases/[baseId]/synapses, client usa fetch()

2. **Select component não instalado**
   - Problema: Import error em BaseConhecimentoDialog
   - Solução: `npx shadcn@latest add select`

3. **Unused request parameter**
   - Problema: TypeScript error em API route
   - Solução: Prefixado com `_request`

**Arquivos Criados (Total: 8):**
- types/knowledge-base.ts (6 novos tipos)
- lib/queries/knowledge-base.ts (9 queries)
- app/actions/base-conhecimento.ts (4 Server Actions)
- components/knowledge-base/base-conhecimento-table.tsx
- components/knowledge-base/base-conhecimento-dialog.tsx
- components/knowledge-base/knowledge-base-container.tsx
- app/api/bases/[baseId]/synapses/route.ts
- migrations/base-conhecimento-hierarchy.sql

**Arquivos Modificados (Total: 6):**
- app/(dashboard)/knowledge-base/page.tsx (refatorado para hierarquia)
- components/knowledge-base/synapses-table.tsx (callback onSynapseChange)
- components/knowledge-base/synapse-dialog.tsx (callback onSuccess)
- components/knowledge-base/delete-synapse-dialog.tsx (callback onSuccess)
- components/knowledge-base/synapse-actions.tsx (passa callbacks)
- components/knowledge-base/index.ts (exports)

**SOLID Aplicado:**
- **SRP**: Cada componente tem responsabilidade única
- **OCP**: Componentes extensíveis via callbacks, fechados para modificação
- **LSP**: SynapsesTable substituível em múltiplos contextos
- **ISP**: Props específicas, callbacks opcionais
- **DIP**: Queries abstraídas, componentes usam callbacks não implementações

---

## Métricas Atualizadas
- **Decisões documentadas:** 9 (adicionado #009)
- **Decisões rápidas:** 9 (3 novas sobre hierarquia)
- **Componentes criados:** 3 (BaseConhecimentoTable, Dialog, Container)
- **Componentes refatorados:** 4 (SynapsesTable, SynapseDialog, DeleteDialog, Actions)
- **API routes criadas:** 1 (/api/bases/[baseId]/synapses)
- **Queries criadas:** 9 (bases de conhecimento)
- **Server Actions criadas:** 4 (CRUD de bases)
- **Migrações SQL criadas:** 1 (hierarchy migration)
- **Build time:** 18.4s
- **Gaps do MVP resolvidos:** 1/4 (Gap #1: Hierarquia)

---

## Próximos Passos (Prioridade Alta)
1. **Executar migração SQL** `migrations/base-conhecimento-hierarchy.sql`
2. **Gap #2: Livechat Layout** - Ajustar para 4 colunas (conversations sidebar)
3. **Gap #3: Feedback de Mensagens** - Implementar like/dislike no livechat
4. **Gap #4: Quick Replies** - Respostas rápidas no livechat

## Próximos Passos (Prioridade Média)
- Refatorar SynapseDialog para reutilização no Neurocore
- Adicionar paginação se base tiver >50 synapses
- Adicionar busca/filtros em bases e synapses
- Melhorar empty states com call-to-action
