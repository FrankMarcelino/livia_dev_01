# Decisões Arquiteturais - LIVIA MVP

## Índice de Decisões
1. [Não usar MCP no MVP](#decisão-001-não-usar-mcp-no-mvp)
2. [Estrutura Híbrida de Skills](#decisão-002-estrutura-híbrida-de-skills)
3. [Base Vetorial Gerenciada pelo n8n](#decisão-003-base-vetorial-gerenciada-pelo-n8n)
4. [Aceitar Type Assertions `any` para Queries Supabase](#decisão-004-aceitar-type-assertions-any-para-queries-supabase)
5. [Webhooks n8n Simplificados para MVP WhatsApp](#decisão-005-webhooks-n8n-simplificados-para-mvp-whatsapp)
6. [Sidebar com Auto-Collapse](#decisão-006-sidebar-com-shadcnui-e-auto-collapse-baseado-em-rota)
7. [CRUD Simples de Synapses](#decisão-007-crud-simples-de-synapses-sem-webhook-de-publicação)
8. [Treinamento Neurocore com Modo Mock](#decisão-008-treinamento-neurocore-com-modo-mock)
9. [Hierarquia Base de Conhecimento → Synapses](#decisão-009-hierarquia-base-de-conhecimento--synapses)
10. [Refatoração Master-Detail com N8N Webhooks](#decisão-010-refatoração-master-detail-com-n8n-webhooks)

---

## Decisão #001: Não usar MCP no MVP

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Durante o planejamento do projeto LIVIA, surgiu a questão sobre usar Model Context Protocol (MCP) para integração com Supabase e n8n. MCP permitiria ao Claude acessar diretamente o banco de dados e testar webhooks durante o desenvolvimento.

### Opções Consideradas

1. **MCP Completo**
   - Prós: Acesso direto ao banco, testes rápidos, geração automática de código baseado em schema
   - Contras: Alta complexidade, riscos de segurança, overhead de manutenção, curva de aprendizado

2. **MCP Seletivo (Schema Reader apenas)**
   - Prós: Types sempre atualizados, baixo risco (só leitura)
   - Contras: Ainda adiciona complexidade, precisa configurar infraestrutura

3. **Sem MCP (Skills + Scripts CLI)**
   - Prós: Simplicidade, menor risco, foco no MVP, sem infraestrutura adicional
   - Contras: Claude não acessa dados diretamente, precisa gerar código manualmente

### Decisão
**Adiar uso de MCP para pós-MVP.** Focar em entregar o MVP usando skills customizadas do Claude Code e scripts CLI quando necessário.

**Razões:**
- MVP precisa ser entregue rapidamente
- Skills criadas já cobrem todos os padrões necessários
- Evitar complexidade adicional na fase inicial
- Reduzir riscos de segurança
- Facilitar onboarding da equipe

### Consequências

**Positivas:**
- Menor complexidade no setup inicial
- Equipe foca em features, não em infraestrutura
- Menos pontos de falha
- Onboarding mais rápido
- Maior segurança (sem acesso direto ao banco)

**Negativas:**
- Claude não pode validar queries contra schema real
- Testes de integração n8n precisam ser manuais
- Types do Supabase precisam ser gerados manualmente

**Riscos e Mitigações:**
- **Risco:** Types desatualizados
  - **Mitigação:** Script CLI para gerar types do Supabase regularmente
- **Risco:** Dificuldade em testar webhooks n8n
  - **Mitigação:** Criar scripts CLI para testes comuns

### Revisão Futura
Reavaliar pós-MVP se:
- Equipe crescer (>3 devs)
- Testes de integração se tornarem gargalo
- Schema do banco mudar frequentemente
- ROI de MCP justificar a complexidade

### Referências
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- Análise de prós/contras documentada em conversa

---

## Decisão #002: Estrutura Híbrida de Skills

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Precisávamos definir como organizar skills do Claude Code para o projeto LIVIA: uma skill monolítica, múltiplas skills separadas por tecnologia, ou estrutura híbrida.

### Opções Consideradas

1. **1 Skill Monolítica**
   - Prós: Simplicidade, um arquivo só
   - Contras: Arquivo muito grande, consome muitos tokens, difícil de manter

2. **3 Skills Separadas (n8n, Supabase, Frontend)**
   - Prós: Especialização, ativação precisa
   - Contras: Possível overlap, contexto fragmentado, manutenção multiplicada

3. **1 Skill Principal + Arquivos de Referência**
   - Prós: Contexto unificado, carregamento progressivo, fácil manutenção
   - Contras: Requer boa organização dos arquivos

### Decisão
**Usar estrutura híbrida:** 1 SKILL.md principal com arquivos de referência especializados.

**Estrutura:**
```
.claude/skills/livia-mvp/
├── SKILL.md                 # Skill principal (sempre carregada)
├── n8n-reference.md         # Carregada quando necessário
├── supabase-reference.md    # Carregada quando necessário
└── frontend-reference.md    # Carregada quando necessário
```

### Consequências

**Positivas:**
- Claude carrega apenas o necessário (economia de tokens)
- Contexto do projeto permanece unificado
- Fácil de manter (um lugar para cada tipo de informação)
- Equipe pode contribuir em áreas específicas

**Negativas:**
- Requer disciplina para manter referências atualizadas
- Arquivos de referência podem ficar desatualizados se não revisados

**Riscos e Mitigações:**
- **Risco:** Referências desatualizadas
  - **Mitigação:** Revisar arquivos ao adicionar novas features
- **Risco:** Duplicação de informação
  - **Mitigação:** Definir claramente o que vai em cada arquivo

### Referências
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)

---

## Decisão #003: Base Vetorial Gerenciada pelo n8n

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Durante o planejamento da migração SQL, foi incluída uma tabela `synapse_embeddings` no Supabase para armazenar embeddings vetoriais (pgvector) das synapses. No entanto, a lógica de vetorização e busca semântica já é gerenciada pelo n8n.

### Opções Consideradas

1. **Tabela de embeddings no Supabase**
   - Prós: Dados centralizados, busca vetorial nativa (pgvector), controle total
   - Contras: Duplicação de lógica (n8n já faz), overhead de sincronização, complexidade adicional

2. **Base vetorial externa gerenciada pelo n8n**
   - Prós: Separação de responsabilidades, n8n já implementado, menor complexidade no frontend
   - Contras: Frontend não tem acesso direto aos embeddings (mas não precisa)

### Decisão
**Remover tabela `synapse_embeddings` do Supabase.** A base vetorial é responsabilidade do **n8n**, que gerencia:
- Criação de embeddings ao publicar synapses
- Armazenamento em serviço externo (Pinecone, Weaviate, ou similar)
- Busca semântica durante processamento de IA
- Sincronização com estado das synapses

**O frontend apenas:**
- Gerencia CRUD de synapses (título, content, descrição)
- Controla estados (draft, publishing, error)
- Ativa/desativa synapses (`is_enabled`)
- Dispara webhooks n8n para publicação

### Consequências

**Positivas:**
- Menor complexidade no schema do Supabase
- Não duplicar lógica de vetorização
- Separação clara de responsabilidades (Frontend = CRUD, n8n = IA/Embeddings)
- Menos manutenção e sincronização
- Migração SQL mais simples

**Negativas:**
- Frontend não tem visibilidade dos embeddings (mas não precisa para MVP)
- Não pode fazer queries vetoriais diretamente do frontend (mas não é necessário)

**Riscos e Mitigações:**
- **Risco:** Perda de visibilidade sobre embeddings
  - **Mitigação:** n8n pode expor métricas via webhook se necessário
- **Risco:** Difícil debugar problemas de busca
  - **Mitigação:** Tela de Treinamento Neurocore permite testar queries e ver synapses usadas

### Referências
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- Migração v2 atualizada sem `synapse_embeddings`

---

## Decisão #004: Aceitar Type Assertions `any` para Queries Supabase

**Data:** 2025-11-17

**Status:** Aceita

### Contexto
Durante o desenvolvimento da feature Livechat, ao criar queries Supabase com joins complexos e API routes, encontramos dificuldades com a inferência de tipos do Supabase JavaScript client. Queries com `.select()` usando joins não inferem tipos corretamente, resultando em tipos `never` ou erros de spread.

**Localizações afetadas:**
- [lib/queries/livechat.ts](app/lib/queries/livechat.ts) (4 ocorrências)
- [api/conversations/pause-ia/route.ts](app/api/conversations/pause-ia/route.ts) (2 ocorrências)
- [api/conversations/resume-ia/route.ts](app/api/conversations/resume-ia/route.ts) (2 ocorrências)
- [api/n8n/send-message/route.ts](app/api/n8n/send-message/route.ts) (1 ocorrência)

**Total:** 9 warnings `@typescript-eslint/no-explicit-any`

### Opções Consideradas

1. **Adicionar `eslint-disable-next-line` em cada ocorrência**
   - Prós: Suprime warnings, mantém regra ativa globalmente
   - Contras: Poluição visual, manutenção repetitiva (9 linhas)

2. **Desabilitar regra para pastas `api/` e `lib/queries/`**
   - Prós: Solução limpa, sem poluição visual
   - Contras: Pode mascarar problemas reais de `any` no futuro

3. **Aceitar warnings e continuar com desenvolvimento**
   - Prós: Pragmatismo, foco em entregar features, warnings são visíveis
   - Contras: Build mostra warnings (não é erro)

### Decisão
**Aceitar warnings `@typescript-eslint/no-explicit-any`** nas queries Supabase e API routes, mantendo assertions `as any` com comentários explicativos.

**Razões:**
- Pragmatismo: Supabase types não inferem corretamente para queries complexas
- Segurança: Todas as queries têm validação de `tenant_id` e null checks antes dos casts
- Visibilidade: Warnings permanecem visíveis, facilitando revisão futura
- Foco no MVP: Priorizar entrega de features sobre perfeição de tipos
- Comentários: Cada `any` tem comentário explicando o motivo

### Padrão Adotado

```typescript
// Exemplo em queries:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversation = data as any;
return {
  ...conversation,
  lastMessage: conversation.messages?.[0] || null,
} as ConversationWithLastMessage;

// Exemplo em API routes:
// @ts-expect-error - Supabase types not inferring correctly
const updateData: any = {
  ia_active: false,
  ia_paused_by_user_id: user.id,
  ia_paused_at: new Date().toISOString(),
};
```

### Consequências

**Positivas:**
- Velocidade de desenvolvimento mantida
- Código continua funcionalmente correto (validações robustas)
- Warnings visíveis para revisão pós-MVP
- Menos poluição visual que múltiplos `eslint-disable-next-line`
- Pragmatismo apropriado para MVP

**Negativas:**
- Perda parcial de type safety em pontos específicos
- Build mostra 9 warnings ESLint

**Riscos e Mitigações:**
- **Risco:** Proliferação de `any` em outros lugares
  - **Mitigação:** Restringir uso apenas a queries/API routes Supabase, sempre com comentário
- **Risco:** Mascarar problemas reais de tipos
  - **Mitigação:** Null checks e validações antes de cada cast, runtime validation de `tenant_id`

### Revisão Futura
Reavaliar pós-MVP quando:
- Supabase liberar melhor inferência de tipos para joins
- Migrar para types gerados automaticamente (`supabase gen types`)
- Time decidir gerar tipos customizados com Zod
- Quantidade de `any` crescer além de queries/API routes

### Referências
- [Supabase Type Support](https://supabase.com/docs/reference/javascript/typescript-support)
- ESLint warnings documentados durante desenvolvimento Livechat

---

## Decisão #005: Webhooks n8n Simplificados para MVP WhatsApp

**Data:** 2025-11-17

**Status:** Aceita

### Contexto
Durante a configuração do ambiente, identificou-se que alguns webhooks n8n mapeados inicialmente podem ser substituídos por operações diretas no banco de dados, simplificando a arquitetura do MVP.

### Análise de Webhooks

**Webhooks NECESSÁRIOS (integração com WhatsApp/IA):**
1. ✅ **N8N_SEND_MESSAGE_WEBHOOK** - Enviar mensagem para WhatsApp
   - Motivo: n8n integrado ao canal (WhatsApp Business API)
   - Fluxo: Frontend → API Route → n8n → WhatsApp

2. ✅ **N8N_SYNC_SYNAPSE_WEBHOOK** - Publicar/editar synapse
   - Motivo: n8n gerencia vetorização (embeddings OpenAI)
   - Fluxo: Frontend → API Route → n8n → Criar embeddings → Base vetorial

3. ✅ **N8N_PAUSE_CONVERSATION_WEBHOOK** - Pausar IA em conversa específica
   - Motivo: n8n precisa saber para pausar processamento
   - Fluxo: Frontend → API Route → n8n → Pausa processamento

4. ✅ **N8N_RESUME_CONVERSATION_WEBHOOK** - Retomar IA em conversa específica
   - Motivo: n8n precisa saber para retomar processamento
   - Fluxo: Frontend → API Route → n8n → Retoma processamento

5. ✅ **N8N_PAUSE_IA_WEBHOOK** - Pausar IA em TODO tenant
   - Motivo: n8n precisa saber para pausar TODAS conversas
   - Fluxo: Frontend → API Route → n8n → Pausa processamento global

6. ✅ **N8N_RESUME_IA_WEBHOOK** - Retomar IA em TODO tenant
   - Motivo: n8n precisa saber para retomar TODAS conversas
   - Fluxo: Frontend → API Route → n8n → Retoma processamento global

**Webhooks DESNECESSÁRIOS (CRUD no banco):**
1. ❌ **N8N_NEUROCORE_QUERY_WEBHOOK** - Simulação de perguntas no treinamento
   - Motivo: É apenas CRUD no banco (salvar queries de teste)
   - Alternativa: Operação direta no Supabase

2. ❌ **N8N_USE_QUICK_REPLY_WEBHOOK** - Usar resposta rápida
   - Motivo: Apenas incrementar `usage_count` no banco
   - Alternativa: UPDATE direto na tabela `quick_reply_templates`

### Decisão
**Remover** webhooks desnecessários do MVP e implementar como operações diretas no Supabase.

**Webhooks finais do MVP WhatsApp:** 6 webhooks (redução de 9 → 6)

### Consequências

**Positivas:**
- Arquitetura mais simples
- Menos pontos de falha
- Melhor performance (menos chamadas HTTP)
- Menor dependência do n8n para operações CRUD
- Facilita desenvolvimento e debug

**Negativas:**
- Perda de centralização de lógica (mas não é necessária para CRUD simples)

**Riscos e Mitigações:**
- **Risco:** Quick Replies podem precisar de lógica adicional no futuro
  - **Mitigação:** Se necessário, adicionar webhook posteriormente
- **Risco:** Neurocore pode precisar integrar com IA no futuro
  - **Mitigação:** Por enquanto é só teste, se necessário adicionar webhook depois

### Padrão Adotado

**Para enviar mensagens (exemplo):**
```typescript
// 1. Salvar mensagem no banco primeiro
const message = await supabase.from('messages').insert({...});

// 2. Chamar n8n para enviar ao WhatsApp
await callN8nWebhook('/webhook/livia/send-message', {
  conversation_id,
  user_id,
  content
});

// 3. Realtime do Supabase atualiza UI automaticamente
```

**Para Quick Replies (simplificado):**
```typescript
// Apenas incrementar no banco
await supabase
  .from('quick_reply_templates')
  .update({ usage_count: current + 1 })
  .eq('id', quickReplyId);
```

### Referências
- Observações do arquivo `.env.local` original
- Análise de fluxos de integração n8n

---

## Decisão #006: Sidebar com shadcn/ui e Auto-Collapse Baseado em Rota

**Data:** 2025-11-18

**Status:** ✅ Implementado

### Contexto
Necessidade de adicionar navegação entre features (Livechat, Base de Conhecimento, Treinamento Neurocore). O Livechat requer layout de 3 colunas (ContactList | ConversationView | CustomerDataPanel), então o sidebar precisa colapsar automaticamente nessa rota.

### Opções Consideradas

1. **Context API manual + Sidebar customizado**
   - Prós: Controle total, sem dependências
   - Contras: Muito trabalho, sem acessibilidade, sem animações

2. **Props drilling + Sidebar customizado**
   - Prós: Simples conceitualmente, explícito
   - Contras: Acoplamento alto, difícil manutenção

3. **shadcn/ui Sidebar + Hook customizado**
   - Prós: Acessibilidade completa, animações, responsivo, keyboard shortcuts
   - Contras: +10KB no bundle, dependência externa

### Decisão
**Usar shadcn/ui Sidebar component** com hook customizado `useSidebarAutoCollapse`.

**Arquitetura:**
- **Route Groups**: `(auth)` para login, `(dashboard)` para features autenticadas
- **SidebarProvider**: Contexto nativo do shadcn gerencia estado
- **Hook customizado**: `useSidebarAutoCollapse(['/livechat'])` aplica auto-collapse
- **Wrapper Component**: `SidebarAutoCollapseWrapper` permite Server Component usar hook
- **Modo icon**: Sidebar colapsa mostrando apenas ícones (collapsible="icon")

### Implementação

**Arquivos criados:**
- [lib/hooks/use-sidebar-auto-collapse.ts](lib/hooks/use-sidebar-auto-collapse.ts) - Hook de auto-collapse
- [components/layout/app-sidebar.tsx](components/layout/app-sidebar.tsx) - Sidebar principal
- [components/layout/nav-items.tsx](components/layout/nav-items.tsx) - Configuração de navegação
- [components/layout/sidebar-auto-collapse-wrapper.tsx](components/layout/sidebar-auto-collapse-wrapper.tsx) - Wrapper client
- [app/(dashboard)/layout.tsx](app/(dashboard)/layout.tsx) - Layout com SidebarProvider
- [app/(dashboard)/knowledge-base/page.tsx](app/(dashboard)/knowledge-base/page.tsx) - Placeholder
- [app/(dashboard)/neurocore/page.tsx](app/(dashboard)/neurocore/page.tsx) - Placeholder

**Arquivos modificados:**
- [components/auth/header.tsx](components/auth/header.tsx) - Adicionado SidebarTrigger
- [components/ui/sidebar.tsx](components/ui/sidebar.tsx) - Corrigido Math.random → useState
- [app/(dashboard)/livechat/page.tsx](app/(dashboard)/livechat/page.tsx) - Removido Header duplicado
- [app/page.tsx](app/page.tsx) - Redirect para /livechat

### Comportamento

**Livechat:**
- Sidebar **auto-colapsa** em modo icon (apenas ícones)
- Dá espaço para as 3 colunas do chat

**Outras rotas:**
- Sidebar permanece **expandida** mostrando nomes das features
- Estado persiste entre navegações (cookies)

**Controles:**
- Botão no header permite toggle manual
- Keyboard: Ctrl+B (Win) / Cmd+B (Mac)
- Acessibilidade: ARIA labels, foco no teclado

### Princípios SOLID Aplicados

1. **Single Responsibility**
   - `useSidebarAutoCollapse`: Apenas gerencia auto-collapse
   - `AppSidebar`: Apenas renderiza sidebar
   - `nav-items.tsx`: Apenas configuração de navegação

2. **Open/Closed**
   - Sidebar extensível via `navItems` array
   - Fechado para modificação (usa shadcn)

3. **Dependency Inversion**
   - Hook depende de abstração `useSidebar` (shadcn)
   - Componentes dependem de props, não de implementações

### Consequências

**Positivas:**
✅ Acessibilidade completa (ARIA, keyboard shortcuts)
✅ Responsivo (Sheet em mobile)
✅ Persistência de estado (cookies)
✅ Animações suaves (CSS transitions)
✅ Zero erros TypeScript ou ESLint
✅ Build passou com sucesso
✅ Economia de 4-6 horas de desenvolvimento

**Negativas:**
⚠️ shadcn sidebar adiciona ~10KB ao bundle
⚠️ Dependência de biblioteca externa

**Trade-offs aceitos:**
- Bundle maior vs UX superior
- Dependência vs tempo de desenvolvimento

### Testes Realizados

✅ TypeScript type-check (zero erros)
✅ ESLint (zero erros nos arquivos novos)
✅ Build production (sucesso)
✅ Rotas criadas: `/`, `/login`, `/livechat`, `/knowledge-base`, `/neurocore`

### Referências
- [shadcn/ui Sidebar Documentation](https://ui.shadcn.com/docs/components/sidebar)
- [Next.js Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups)

---

## Decisão #007: CRUD Simples de Synapses (Sem Webhook de Publicação)

**Data:** 2025-11-18

**Status:** ✅ Implementado

### Contexto
Ao implementar a Base de Conhecimento (CRUD de synapses), surgiu a questão: usar webhook n8n para publicar synapses ou deixar n8n monitorar mudanças em background?

### Opções Consideradas

1. **CRUD Simples (sem webhook)**
   - Prós: Simplicidade, offline-first, UX não bloqueante, menos dependências
   - Contras: Menos controle, sem feedback imediato, possível delay

2. **Com Webhook Explícito**
   - Prós: Controle explícito, feedback imediato, validação síncrona
   - Contras: Complexidade, dependência de n8n, UX bloqueante, mais latência

3. **Híbrida**
   - Prós: Flexibilidade, UX não bloqueante + controle quando necessário
   - Contras: Mais complexo, confusão do usuário

### Decisão
**CRUD Simples (sem webhook de publicação)** para MVP.

**Arquitetura:**
- Frontend faz CRUD completo (criar, editar, deletar)
- Toggle `is_enabled` via UPDATE direto no banco
- n8n monitora synapses com `is_enabled = true` via Supabase Realtime
- n8n cria embeddings automaticamente em background
- n8n atualiza campo `status` (draft → indexing → publishing → error)
- Frontend exibe status visual (badges coloridos)

### Fluxo de Publicação

```
1. Usuário cria synapse → Salva no Supabase (status: 'draft', is_enabled: false)
2. Usuário edita conteúdo → UPDATE direto
3. Usuário ativa (toggle is_enabled = true) → UPDATE direto
4. n8n detecta mudança via Realtime → Atualiza status para 'indexing'
5. n8n cria embeddings → Atualiza status para 'publishing'
6. IA passa a usar a synapse automaticamente
```

### Estados da Synapse

| Status | Cor | Descrição |
|--------|-----|-----------|
| draft | 🔵 Azul | Synapse criada, não ativa |
| indexing | 🟡 Amarelo | Ativa, embeddings sendo criados |
| publishing | 🟢 Verde | Ativa, IA usando (embeddings prontos) |
| error | 🔴 Vermelho | Falha no processamento |

### Consequências

**Positivas:**
✅ Simplicidade máxima (menos código, menos bugs)
✅ Frontend funciona offline (não depende de n8n)
✅ UX não bloqueante (operações instantâneas)
✅ Escalável (n8n processa em background)
✅ Menos latência (sem HTTP requests ao n8n)

**Negativas:**
⚠️ Usuário não recebe confirmação imediata de sucesso
⚠️ Possível delay entre ativar synapse e IA começar a usar
⚠️ Menos controle sobre timing de processamento

**Trade-offs aceitos:**
- Feedback imediato vs Simplicidade → Escolhemos simplicidade
- Controle explícito vs Autonomia do n8n → Escolhemos autonomia

### Desafios e Soluções

**Desafio 1:** Como usuário sabe se embedding foi criado?
- **Solução:** Badge de status visual atualizado por n8n via Realtime

**Desafio 2:** Synapse ativa mas sem embedding (delay)
- **Solução:** n8n valida e reprocessa synapses órfãs periodicamente

**Desafio 3:** Sincronização n8n
- **Solução:** n8n monitora via Supabase Realtime + polling de fallback

### Revisão Futura
Considerar webhook explícito SE:
- Usuários reclamarem de falta de feedback imediato
- Validação síncrona se tornar necessária
- Controle explícito for crítico para o negócio

### Referências
- [Decisão #003: Base Vetorial Gerenciada pelo n8n](DECISIONS.md#decisão-003-base-vetorial-gerenciada-pelo-n8n)
- Análise de trade-offs documentada em conversa

---

## Decisão #008: Treinamento Neurocore com Modo Mock

**Data:** 2025-11-19

**Status:** ✅ Implementado

### Contexto
Necessidade de implementar interface para testar e validar respostas da IA antes de ativar em produção. Surgiu a questão sobre como desenvolver frontend sem depender de webhook n8n estar configurado.

### Opções Consideradas

1. **Aguardar n8n estar pronto**
   - Prós: Integração real desde o início
   - Contras: Bloqueia desenvolvimento frontend, dependência externa

2. **Modo mock configurável**
   - Prós: Desenvolvimento paralelo, teste de UX independente
   - Contras: Requer manutenção de código mock

3. **Stub fixo hardcoded**
   - Prós: Mais simples
   - Contras: Difícil alternar para produção, menos realista

### Decisão
**Implementar modo mock configurável** via variável de ambiente `NEUROCORE_MOCK=true`.

**Arquitetura:**
- Estado local das queries (não persiste no banco)
- API route `/api/neurocore/query` com lógica condicional
- Mock retorna resposta fake + 3 synapses exemplo
- Simula latência real (2-3 segundos)
- Trocar flag quando n8n estiver pronto

### Implementação

**Componentes criados:**
- `NeurocoreChat` - Container com estado local
- `TrainingQueryInput` - Form com validação (min 3, max 500 chars)
- `TrainingResponseCard` - Renderiza resposta + synapses
- `SynapseUsedCard` - Card com score de similaridade visual
- `ResponseFeedbackDialog` - Modal para feedback negativo

**Bibliotecas adicionadas:**
- `react-markdown` + `remark-gfm` - Renderizar markdown seguro
- `uuid` - Gerar IDs locais de queries
- `sonner` - Toast notifications

**Features:**
- Interface de chat para testes
- Renderização markdown segura (whitelist de componentes)
- Score de similaridade visual (progress bar)
- Feedback like/dislike com comentário opcional
- Auto-scroll para última resposta
- Loading states e error handling
- Timeout 30s para n8n
- Limita histórico a 20 queries (performance)

### Fluxo de Uso

```
1. Usuário digita pergunta → Valida (min 3 chars)
2. Frontend chama POST /api/neurocore/query
3. API route valida auth + tenant
4. Se NEUROCORE_MOCK=true:
   - Simula latência 2-3s
   - Retorna mock response
5. Se NEUROCORE_MOCK=false:
   - Chama webhook n8n
   - Timeout 30s
6. Frontend renderiza resposta em markdown
7. Exibe synapses usadas (cards com score)
8. Usuário dá feedback (like/dislike)
9. Feedback salvo em message_feedbacks (JSON context)
```

### Consequências

**Positivas:**
✅ Desenvolvimento frontend independente do n8n
✅ UX testável antes de integração real
✅ Mock realista (latência + múltiplas synapses)
✅ Fácil trocar para produção (uma variável de ambiente)
✅ Estado local evita poluir banco com testes
✅ Feedback persiste mesmo sem histórico de queries

**Negativas:**
⚠️ Código mock precisa ser mantido
⚠️ Queries não persistem (histórico perdido ao recarregar)

**Trade-offs aceitos:**
- Histórico local vs Simplicidade → Simplicidade (MVP)
- Mock vs Integração real → Mock primeiro (velocidade)

### Melhorias Futuras (Pós-MVP)

**Não implementado agora:**
- Botões "Publicar Synapse" e "Excluir Synapse" no dialog
- Confirmação de exclusão customizada ("confirmo excluir synapse")
- Refactor de SynapseDialog para reutilização
- Histórico persistido no banco
- Filtros e busca no histórico
- Export de relatório (PDF)

**Motivo:** MVP focou em validar UX core. Features avançadas adicionadas conforme necessidade.

### Testes Realizados

✅ TypeScript type-check (zero erros)
✅ Build production (sucesso)
✅ Rota `/neurocore` criada corretamente
✅ Mock response funcional

### Referências
- [NEUROCORE_PLAN.md](docs/NEUROCORE_PLAN.md) - Plano detalhado (400 linhas)
- [MVP_CONTRAST_ANALYSIS.md](docs/MVP_CONTRAST_ANALYSIS.md) - Análise de gaps

---

## Decisão #009: Hierarquia Base de Conhecimento → Synapses

**Data:** 2025-11-19

**Status:** Implementada

### Contexto
A implementação inicial do MVP colocou synapses diretamente na página `/knowledge-base`, usando um `baseConhecimentoId` hardcoded ('00000000-...'). O MVP descrito especifica uma hierarquia clara: **Bases de Conhecimento** agrupam **Synapses** relacionadas, permitindo organização temática (ex: "Políticas de Devolução", "Suporte Técnico").

Esta decisão resolve o **Gap #1** identificado no [MVP_CONTRAST_ANALYSIS.md](docs/MVP_CONTRAST_ANALYSIS.md).

### Opções Consideradas

1. **Modal Aninhado** (Escolhida): Alinha com MVP, menor refactor, reutiliza componentes - 12-15h
2. **Navegação com Subrotas**: UX mais clean, mas refactor maior e perde contexto - 16-20h
3. **Accordion/Expansível**: Simples mas não alinha com MVP, não escalável - 6-8h

### Decisão
Implementar hierarquia usando **Modal Aninhado** com tabela de synapses aninhada dentro do BaseConhecimentoDialog.

**Razões:** Alinha com MVP, reutiliza SynapseDialog/SynapsesTable, mantém contexto, desktop-first.

### Implementação

**Arquivos Criados:**
- `types/knowledge-base.ts` - Tipos BaseConhecimento, BaseConhecimentoWithCount, BaseConhecimentoWithSynapses
- `lib/queries/knowledge-base.ts` - 9 queries para CRUD de bases
- `app/actions/base-conhecimento.ts` - 4 Server Actions
- `components/knowledge-base/base-conhecimento-table.tsx`
- `components/knowledge-base/base-conhecimento-dialog.tsx`
- `components/knowledge-base/knowledge-base-container.tsx`
- `app/api/bases/[baseId]/synapses/route.ts`
- `migrations/base-conhecimento-hierarchy.sql`

**Modificados:** knowledge-base/page.tsx, synapses-table.tsx, synapse-dialog.tsx, delete-synapse-dialog.tsx, synapse-actions.tsx (adicionados callbacks)

### Aplicação de SOLID

- **SRP**: Cada componente com responsabilidade única
- **OCP**: Callbacks (onSuccess, onSynapseChange) para extensibilidade
- **LSP**: SynapsesTable reutilizável em múltiplos contextos
- **ISP**: Props específicas, callbacks opcionais
- **DIP**: Queries abstraídas, componentes usam callbacks

### Consequências

**Positivas:** Organização temática, alinha 100% com MVP, reutilização máxima, UX fluida (callbacks), escalável

**Negativas:** Modal aninhado (não ideal mobile, mas MVP é desktop), pode ficar pesado com >50 synapses

### Migração de Dados

Executar `migrations/base-conhecimento-hierarchy.sql`:
1. Cria base padrão para cada tenant
2. Migra synapses órfãs (baseConhecimentoId='00000000...')
3. Valida ausência de órfãos
4. Gera estatísticas

### Testes Realizados

✅ TypeScript type-check
✅ Build production (18.4s)
✅ API route `/api/bases/[baseId]/synapses` criada
✅ Queries com JOIN (evita N+1)

### Referências
- [BASE_CONHECIMENTO_REFACTOR_PLAN.md](docs/BASE_CONHECIMENTO_REFACTOR_PLAN.md) - Análise completa (600 linhas)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)

---

## Decisão #010: Refatoração Master-Detail com N8N Webhooks

**Data:** 2025-11-19

**Status:** 🚧 Em Implementação

### Contexto
A Decisão #009 implementou a hierarquia Base de Conhecimento usando **modal aninhado** (Grid de Cards → Modal Base com synapses aninhadas). Após feedback visual do usuário com wireframe, identificou-se que a UX desejada era um **layout master-detail** com scroll horizontal de cards e synapses exibidas abaixo (não dentro de modal).

Além disso, surgiu a necessidade de integrar webhooks N8N para gerenciar embeddings das synapses (criar, deletar, ativar/desativar).

### Opções Consideradas

1. **Manter Modal Aninhado + Adicionar Webhooks**
   - Prós: Menos refactor, aproveitaria código existente
   - Contras: Não alinha com wireframe do usuário, UX inferior

2. **Refatorar para Master-Detail com Webhooks**
   - Prós: Alinha 100% com wireframe, UX superior, melhor performance, integração N8N
   - Contras: Refactor maior (deletar 3 componentes, criar 4 novos), 8-10h de trabalho

### Decisão
**Refatorar para layout Master-Detail** com integração de webhooks N8N.

**Arquitetura:**
- **Master:** Scroll horizontal de cards (BaseConhecimentoCarousel)
- **Detail:** Tabela de synapses abaixo (SynapsesTable reutilizada)
- **Modal Simples:** BaseConhecimentoFormDialog (sem synapses aninhadas)
- **Webhooks N8N:** Integração para sync/delete/toggle synapses e bases

### Mudanças no Layout

**❌ ANTES (Modal Aninhado):**
```
Grid de Cards → Click card → Modal Base (com synapses aninhadas)
                              └─> Click ADD SYNAPSE → Sub-modal Synapse
```

**✅ DEPOIS (Master-Detail):**
```
Scroll Horizontal de Cards (Master)
  ↓ Click card seleciona
Tabela de Synapses abaixo (Detail)
  ↓ Click ADD SYNAPSE
Modal Synapse (apenas form, não aninhado)
```

### Componentes

**A DELETAR:**
1. `BaseConhecimentoDialog.tsx` - Modal grande com synapses aninhadas
2. `BaseConhecimentoTable.tsx` - DataTable (substituído por carousel)
3. `KnowledgeBaseContainer.tsx` - Container antigo

**A CRIAR:**
1. `BaseConhecimentoCard.tsx` - Card individual com highlight quando selecionado
2. `BaseConhecimentoCarousel.tsx` - Scroll horizontal de cards
3. `BaseConhecimentoFormDialog.tsx` - Modal simples para create/edit base
4. `KnowledgeBaseMasterDetail.tsx` - Orquestrador do layout master-detail
5. `lib/utils/n8n-webhooks.ts` - Helper para chamar webhooks N8N

**A REUTILIZAR (sem modificar):**
- `SynapsesTable.tsx` - Já tem callbacks perfeitos
- `SynapseDialog.tsx` - Já tem onSuccess callback
- `DeleteSynapseDialog.tsx` - Já funciona
- `SynapseActions.tsx` - Já passa callbacks

### Webhooks N8N

**Webhooks a adicionar:**

1. **Sync Synapse** (`/webhook/livia/sync-synapse`)
   - Quando: Criar ou editar synapse
   - Payload: `{ synapseId, baseConhecimentoId, tenantId, operation, content, title }`

2. **Delete Synapse Embeddings** (`/webhook/livia/delete-synapse-embeddings`)
   - Quando: Deletar synapse
   - Payload: `{ synapseId, tenantId }`

3. **Toggle Synapse Embeddings** (`/webhook/livia/toggle-synapse-embeddings`)
   - Quando: Ativar/desativar synapse
   - Payload: `{ synapseId, tenantId, isEnabled }`

4. **Inactivate Base** (`/webhook/livia/inactivate-base`)
   - Quando: Ativar/desativar base
   - Payload: `{ baseConhecimentoId, tenantId, isActive }`

**Modo Mock:** Similar ao `NEUROCORE_MOCK`, criar flag `N8N_MOCK=true` para desenvolvimento sem depender de N8N estar configurado.

### Regras de Negócio Confirmadas

1. **Base inativa:** Synapses ficam inacessíveis (N8N ignora embeddings)
2. **Synapse desativada:** Webhook remove embeddings
3. **Feedback de processamento:** Pode demorar ~1 minuto, status muda automaticamente
4. **Delete de base:** Apenas soft delete (marcar como inativa), sem botão de hard delete
5. **Batch operations:** Não necessário (N8N trata individualmente)

### Aplicação de SOLID

**Single Responsibility:**
- `BaseConhecimentoCard`: Apenas renderiza card
- `BaseConhecimentoCarousel`: Apenas layout de scroll
- `BaseConhecimentoFormDialog`: Apenas form de base
- `KnowledgeBaseMasterDetail`: Apenas orquestra estado

**Open/Closed:**
- Componentes extensíveis via callbacks (onSelect, onToggleActive, onSuccess)
- Fechados para modificação (lógica interna estável)

**Dependency Inversion:**
- Componentes dependem de callbacks abstratos
- Não dependem de router.refresh (usar callbacks)
- Queries abstraídas em lib/queries

### Consequências

**Positivas:**
✅ Alinha 100% com wireframe do usuário
✅ Melhor UX (pattern master-detail conhecido)
✅ Menos z-index complexity (sem modal aninhado)
✅ Melhor performance (renderiza apenas synapses da base selecionada)
✅ Scroll horizontal suporta muitas bases
✅ Reutilização máxima de componentes existentes
✅ Integração N8N para embeddings
✅ Modo mock facilita desenvolvimento

**Negativas:**
⚠️ Refactor significativo (deletar 3, criar 4 componentes)
⚠️ Scroll horizontal pode esconder bases (mitigação: indicadores visuais ◄ ►)
⚠️ Webhooks podem falhar (mitigação: N8N_MOCK + error handling)
⚠️ Estado local de synapses requer refetch ao trocar base (simplicidade MVP)

**Trade-offs aceitos:**
- Refactor maior vs UX superior → UX vence
- Estado local vs Cache complexo → Simplicidade MVP
- Webhooks bloqueantes vs Não bloqueantes → Não bloqueantes (não bloqueia CRUD)

### Desafios e Soluções

**Desafio 1:** Scroll horizontal pode ser difícil em mobile
- **Solução:** CSS overflow-x-auto + -webkit-overflow-scrolling: touch + indicadores visuais

**Desafio 2:** Estado de synapses ao trocar base
- **Solução:** Sempre refetch ao selecionar (simplicidade MVP)

**Desafio 3:** Webhook N8N falha
- **Solução:** Try/catch em Server Actions, não bloqueia CRUD, toast de aviso

**Desafio 4:** Base inativa vs Synapse inativa
- **Solução:** Base inativa prevalece (TODAS synapses ficam inacessíveis)

**Desafio 5:** Performance com muitas bases/synapses
- **Solução:** Scroll horizontal suporta muitas bases, renderiza apenas synapses da base selecionada

### Plano de Implementação

**Sprint 1:** Remover componentes antigos (30min)
**Sprint 2:** Criar componentes novos (3-4h)
**Sprint 3:** Adicionar webhooks N8N (2-3h)
**Sprint 4:** Atualizar página principal (1h)
**Sprint 5:** Testes (1-2h)
**Sprint 6:** Documentação (30min)

**Estimativa Total:** 8-10 horas

Plano detalhado disponível em: [KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md](docs/KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md)

### Revisão Futura
Considerar otimizações SE:
- Scroll horizontal for problemático em mobile (grid 2 colunas)
- Performance com cache local (Map<baseId, Synapse[]>)
- Supabase Realtime para atualizar badges de status automaticamente
- Animações de transição ao trocar base

### Referências
- [Decisão #009: Hierarquia Base de Conhecimento](DECISIONS.md#decisão-009-hierarquia-base-de-conhecimento--synapses)
- [KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md](docs/KNOWLEDGE_BASE_MASTER_DETAIL_PLAN.md) - Plano completo (736 linhas)
- [Master-Detail Pattern](https://www.nngroup.com/articles/master-detail/)

---

## Decisões Rápidas

**Data** | **Decisão** | **Justificativa**
---------|-------------|------------------
2025-11-16 | shadcn/ui para componentes | Consistência visual, acessibilidade, manutenção facilitada
2025-11-16 | Server Components por padrão | Melhor performance, menor bundle, acesso direto a dados
2025-11-18 | Sidebar modo icon no livechat | Layout de 3 colunas requer mais espaço horizontal
2025-11-18 | CRUD simples para synapses | Simplicidade, offline-first, n8n em background
2025-11-19 | Neurocore com modo mock | Desenvolvimento frontend independente do n8n
2025-11-19 | Estado local (não persistir queries) | Simplicidade MVP, histórico não crítico
2025-11-19 | react-markdown para respostas | Padrão de mercado, seguro, 12M downloads/sem
2025-11-19 | Modal aninhado para hierarquia | Alinha MVP, reutiliza componentes, mantém contexto
2025-11-19 | Callbacks para refresh local | UX fluida sem fechar modal, SOLID (OCP/DIP)
2025-11-19 | API route para synapses | Client component precisa fetch, não pode usar server queries
