# Plano de Implementação: Treinamento Neurocore

## Índice
1. [Visão Geral](#visão-geral)
2. [Jornada do Usuário](#jornada-do-usuário)
3. [Arquitetura Técnica](#arquitetura-técnica)
4. [Plano de Ação Detalhado](#plano-de-ação-detalhado)
5. [Desafios e Soluções](#desafios-e-soluções)

---

## Visão Geral

### Objetivo do Neurocore
O **Treinamento Neurocore** é uma interface para **validar e refinar** o conhecimento da IA antes de usar em produção com clientes reais.

### Problema que Resolve
- ❌ **Sem Neurocore**: Criar synapses → Ativar → Esperar cliente perguntar → Ver se funcionou
- ✅ **Com Neurocore**: Criar synapses → **Testar imediatamente** → Ajustar → Validar → Só então ativar

### Valor para o Usuário
1. **Validação Rápida**: Testa conhecimento sem depender de clientes reais
2. **Iteração Ágil**: Identifica gaps de conhecimento e corrige na hora
3. **Confiança**: Valida que a IA responde corretamente antes de ir para produção
4. **Rastreabilidade**: Feedback (like/dislike) ajuda a identificar respostas ruins

---

## Jornada do Usuário

### Persona: Ana (Gerente de Conhecimento)

**Contexto:** Ana acabou de criar 5 synapses sobre "Política de Devolução" na Base de Conhecimento. Antes de ativar para clientes, ela quer testar se a IA responde corretamente.

---

### Fluxo Principal: Testar Conhecimento da IA

#### 1. Entrada na Tela

**Ação:**
- Ana clica em **"Treinamento Neurocore"** na sidebar

**Estado Inicial da Tela:**
```
┌─────────────────────────────────────────────────────────┐
│ Treinamento Neurocore                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [Ícone de cérebro]                                     │
│                                                         │
│  Teste o conhecimento da sua IA                         │
│  Faça perguntas para validar as respostas antes         │
│  de ativar em produção                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Faça uma pergunta...                      [Enviar] │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  💡 Dica: Teste perguntas que seus clientes            │
│     fariam para validar se a IA responde corretamente  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

#### 2. Digitando a Pergunta

**Ação:**
- Ana digita: _"Qual o prazo para devolução de produtos?"_

**Estado da Tela:**
```
┌─────────────────────────────────────────────────────────┐
│ Treinamento Neurocore                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Qual o prazo para devolução de produtos? [Enviar] │
│  └─────────────────────────────────────────────────┘   │
│                       ↑ texto digitado                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Validações:**
- ✅ Input tem `minLength: 3` (no mínimo "Por quê?")
- ✅ Input tem `maxLength: 500` (evita textos enormes)
- ✅ Botão "Enviar" desabilitado se vazio

---

#### 3. Enviando a Pergunta (Loading State)

**Ação:**
- Ana clica em **[Enviar]**

**Estado da Tela:**
```
┌─────────────────────────────────────────────────────────┐
│ Treinamento Neurocore                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Qual o prazo para devolução de produtos? [...]  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🤖 Sua Pergunta                                  │   │
│  │ Qual o prazo para devolução de produtos?        │   │
│  │                                       10:35      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ [Spinner] Analisando conhecimento...            │   │
│  │ • Buscando synapses relevantes                  │   │
│  │ • Gerando resposta                              │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Backend Flow:**
1. Frontend → `POST /api/neurocore/query`
2. API Route valida auth + tenant
3. API Route → `POST /webhook/n8n/neurocore-query`
4. n8n:
   - Gera embedding da pergunta
   - Busca synapses similares (vector search)
   - Monta contexto
   - Chama LLM (GPT-4)
   - Retorna resposta + synapses usadas
5. API Route retorna para frontend

**Tempo estimado:** 3-8 segundos

---

#### 4. Recebendo a Resposta (Success)

**Estado da Tela:**
```
┌─────────────────────────────────────────────────────────┐
│ Treinamento Neurocore                                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Faça outra pergunta...                    [Enviar] │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🤖 Sua Pergunta                                  │   │
│  │ Qual o prazo para devolução de produtos?        │   │
│  │                                       10:35      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🧠 Resposta da IA                                │   │
│  │                                                  │   │
│  │ O prazo para devolução de produtos é de **7     │   │
│  │ dias corridos** a partir do recebimento. Para   │   │
│  │ produtos eletrônicos, o prazo é de **15 dias**.  │   │
│  │ Produtos com defeito têm **30 dias** de         │   │
│  │ garantia.                                        │   │
│  │                                                  │   │
│  │ ───────────────────────────────────────────────  │   │
│  │ 📚 Conhecimento Usado (2 synapses)               │   │
│  │                                                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ 📄 Política de Devolução - Prazos           │ │   │
│  │ │ Similaridade: 94%               [Ver][Editar]│ │   │
│  │ │                                              │ │   │
│  │ │ Os clientes têm 7 dias corridos para        │ │   │
│  │ │ devolução de produtos após recebimento...   │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ ┌─────────────────────────────────────────────┐ │   │
│  │ │ 📄 Garantia de Produtos Eletrônicos         │ │   │
│  │ │ Similaridade: 87%               [Ver][Editar]│ │   │
│  │ │                                              │ │   │
│  │ │ Produtos eletrônicos possuem prazo de 15    │ │   │
│  │ │ dias para devolução. Em caso de defeito...  │ │   │
│  │ └─────────────────────────────────────────────┘ │   │
│  │                                                  │   │
│  │ ───────────────────────────────────────────────  │   │
│  │ Esta resposta foi útil?                          │   │
│  │ [👍 Sim] [👎 Não]                               │   │
│  │                                       10:35      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Elementos da Resposta:**
1. **Resposta da IA** (markdown renderizado)
2. **Synapses Usadas** (cards colapsáveis)
   - Título da synapse
   - Score de similaridade (%)
   - Preview do conteúdo (primeiras 2 linhas)
   - Botões: **[Ver]** (expande) e **[Editar]** (abre dialog)
3. **Feedback** (like/dislike)

---

#### 5. Ana Analisa a Resposta

**Cenário A: Resposta Boa** ✅

**Ação:**
- Ana lê a resposta
- Acha completa e correta
- Clica em **[👍 Sim]**

**Estado da Tela:**
```
│  ───────────────────────────────────────────────  │
│  Esta resposta foi útil?                          │
│  [✅ Feedback enviado! Obrigado.]                 │
│                                       10:35      │
└─────────────────────────────────────────────────┘
```

**Backend:**
- Frontend chama Server Action `submitFeedbackAction`
- Salva em `message_feedbacks`:
```sql
INSERT INTO message_feedbacks (
  tenant_id,
  feedback_type, -- 'like'
  comment, -- JSON com contexto da query
  created_at
)
```

---

**Cenário B: Resposta Incompleta** ⚠️

**Ação:**
- Ana percebe que a resposta não menciona "produtos usados"
- Clica em **[👎 Não]**

**Estado da Tela:**
```
│  ───────────────────────────────────────────────  │
│  Esta resposta foi útil?                          │
│  [👎 Feedback negativo]                          │
│                                                  │
│  ┌─────────────────────────────────────────────┐ │
│  │ O que podemos melhorar? (opcional)          │ │
│  │ ┌─────────────────────────────────────────┐ │ │
│  │ │ Não mencionou produtos usados...        │ │ │
│  │ └─────────────────────────────────────────┘ │ │
│  │                         [Cancelar] [Enviar] │ │
│  └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Backend:**
- Salva em `message_feedbacks`:
```sql
INSERT INTO message_feedbacks (
  tenant_id,
  feedback_type, -- 'dislike'
  comment, -- "Não mencionou produtos usados" + contexto JSON
  created_at
)
```

---

#### 6. Editando Synapse Usada

**Ação:**
- Ana clica em **[Editar]** no card "Política de Devolução - Prazos"

**Estado da Tela:**
```
┌─────────────────────────────────────────────────────────┐
│ [Dialog Modal]                                    [X]   │
│                                                         │
│ Editar Synapse                                          │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Título                                           │   │
│ │ Política de Devolução - Prazos                   │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Conteúdo                                         │   │
│ │ Os clientes têm 7 dias corridos para devolução  │   │
│ │ de produtos após recebimento. Produtos           │   │
│ │ eletrônicos têm 15 dias. Defeituosos: 30 dias.   │   │
│ │                                                  │   │
│ │ **PRODUTOS USADOS NÃO PODEM SER DEVOLVIDOS**    │   │
│ │                           ↑ Ana adiciona isso    │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ ┌─────────────────────────────────────────────────┐   │
│ │ Descrição (opcional)                             │   │
│ │ Regras gerais de devolução                       │   │
│ └─────────────────────────────────────────────────┘   │
│                                                         │
│ 🔄 Status: Publicado                                    │
│ ✅ Habilitado                                           │
│                                                         │
│                               [Cancelar] [Salvar]      │
└─────────────────────────────────────────────────────────┘
```

**Componente Reutilizado:**
- `<SynapseDialog>` (mesmo da Base de Conhecimento)
- Benefício: DRY, já testado, comportamento consistente

**Backend Flow:**
1. Ana clica **[Salvar]**
2. Server Action `updateSynapseAction`
3. UPDATE `synapses` SET `content = ...`
4. `revalidatePath('/neurocore')` (atualiza UI)
5. n8n detecta mudança via Realtime (se configurado)
6. n8n recria embeddings da synapse

---

#### 7. Testando Novamente Após Edição

**Ação:**
- Ana fecha o dialog
- Digita a mesma pergunta novamente: _"Qual o prazo para devolução de produtos?"_
- Clica **[Enviar]**

**Nova Resposta:**
```
│ 🧠 Resposta da IA                                │
│                                                  │
│ O prazo para devolução de produtos é de **7     │
│ dias corridos** a partir do recebimento. Para   │
│ produtos eletrônicos, o prazo é de **15 dias**.  │
│ Produtos com defeito têm **30 dias** de         │
│ garantia.                                        │
│                                                  │
│ ⚠️ **Importante**: Produtos usados NÃO podem    │
│ ser devolvidos.                                  │
│                           ↑ NOVO conteúdo!       │
```

**Ação de Ana:**
- Ana vê que agora a resposta está completa
- Clica **[👍 Sim]**
- **Validação concluída!** ✅

---

### Fluxo Secundário: Expandir Synapse para Ver Conteúdo Completo

**Ação:**
- Ana clica em **[Ver]** no card de synapse

**Estado:**
```
│ ┌─────────────────────────────────────────────┐ │
│ │ 📄 Política de Devolução - Prazos    [Fechar]│ │
│ │ Similaridade: 94%                   [Editar]│ │
│ │                                              │ │
│ │ ───── Conteúdo Completo ─────               │ │
│ │                                              │ │
│ │ Os clientes têm 7 dias corridos para        │ │
│ │ devolução de produtos após recebimento.     │ │
│ │ Para produtos eletrônicos, o prazo é de     │ │
│ │ 15 dias corridos.                           │ │
│ │                                              │ │
│ │ Produtos com defeito têm garantia de 30     │ │
│ │ dias corridos a partir do recebimento.      │ │
│ │                                              │ │
│ │ **PRODUTOS USADOS NÃO PODEM SER             │ │
│ │ DEVOLVIDOS.**                                │ │
│ │                                              │ │
│ │ Para iniciar uma devolução, entre em        │ │
│ │ contato pelo SAC: 0800-123-4567             │ │
│ └─────────────────────────────────────────────┘ │
```

**Componente:**
- Card expansível (Accordion ou Dialog)
- Mostra conteúdo completo da synapse
- Botão **[Editar]** também disponível

---

### Fluxo de Erro: n8n Não Responde

**Cenário:**
- n8n está offline ou demora mais de 30s

**Estado da Tela:**
```
│  ┌─────────────────────────────────────────────────┐
│  │ ❌ Erro ao processar sua pergunta               │
│  │                                                  │
│  │ O serviço de IA não está disponível no momento. │
│  │ Por favor, tente novamente.                     │
│  │                                                  │
│  │                                  [Tentar Novamente]
│  └─────────────────────────────────────────────────┘
```

**Tratamento:**
- Timeout de 30s
- Mensagem clara de erro
- Botão para retry
- Não perde a pergunta digitada

---

### Fluxo de Erro: Nenhuma Synapse Encontrada

**Cenário:**
- Ana pergunta sobre algo que não está na base de conhecimento
- Pergunta: _"Qual a política de trocas internacionais?"_

**Resposta do n8n:**
```json
{
  "answer": "Desculpe, não encontrei informações sobre esse assunto na base de conhecimento.",
  "synapsesUsed": [],
  "confidence": 0
}
```

**Estado da Tela:**
```
│  ┌─────────────────────────────────────────────────┐
│  │ 🧠 Resposta da IA                                │
│  │                                                  │
│  │ Desculpe, não encontrei informações sobre       │
│  │ esse assunto na base de conhecimento.           │
│  │                                                  │
│  │ ⚠️ Nenhuma synapse encontrada                    │
│  │                                                  │
│  │ 💡 Sugestão:                                     │
│  │ • Crie uma synapse sobre "trocas internacionais" │
│  │ • Vá para Base de Conhecimento                  │
│  │                                                  │
│  │                    [Criar Synapse] [Tentar Outra]
│  └─────────────────────────────────────────────────┘
```

**Ação:**
- Botão **[Criar Synapse]** → redireciona para Base de Conhecimento
- Pré-preenche título com termo da pergunta

---

## Arquitetura Técnica

### Stack
```
Frontend (Client Component)
    ↓ fetch('/api/neurocore/query')
API Route (Server)
    ↓ Valida auth + tenant
    ↓ POST webhook n8n
n8n Workflow
    ↓ Embedding + Vector Search
    ↓ LLM (GPT-4)
    ↓ Response { answer, synapsesUsed }
API Route
    ↓ Response para frontend
Frontend
    ↓ Renderiza resposta + synapses
    ↓ User dá feedback
Server Action (submitFeedbackAction)
    ↓ INSERT message_feedbacks
Supabase
```

### Componentes

#### 1. `neurocore-chat.tsx` (Container - Client Component)
**Responsabilidade:**
- Estado local: `queries: TrainingQuery[]`
- Gerencia envio de queries
- Renderiza histórico de queries/respostas

**Estado:**
```typescript
const [queries, setQueries] = useState<TrainingQuery[]>([]);
const [isLoading, setIsLoading] = useState(false);
```

---

#### 2. `training-query-input.tsx`
**Responsabilidade:**
- Form de input
- Validação (min 3, max 500 chars)
- Submit para container

**Props:**
```typescript
interface Props {
  onSubmit: (question: string) => Promise<void>;
  isLoading: boolean;
}
```

---

#### 3. `training-response-card.tsx`
**Responsabilidade:**
- Renderiza resposta da IA (markdown)
- Lista synapses usadas
- Feedback buttons

**Props:**
```typescript
interface Props {
  query: TrainingQuery;
  onFeedback: (type: 'like' | 'dislike', comment?: string) => void;
}
```

---

#### 4. `synapse-used-card.tsx`
**Responsabilidade:**
- Card de synapse individual
- Score de similaridade
- Botões [Ver] [Editar]

**Props:**
```typescript
interface Props {
  synapse: SynapseUsed;
  onEdit: (synapseId: string) => void;
}
```

---

#### 5. `response-feedback.tsx`
**Responsabilidade:**
- Botões like/dislike
- Dialog de comentário (se dislike)
- Submit feedback

**Props:**
```typescript
interface Props {
  queryId: string;
  onSubmit: (type: 'like' | 'dislike', comment?: string) => void;
}
```

---

### API Route

#### `POST /api/neurocore/query`

**Request:**
```typescript
{
  question: string;
  tenantId: string;
}
```

**Response:**
```typescript
{
  answer: string;
  synapsesUsed: Array<{
    id: string;
    title: string;
    content: string;
    score: number; // 0-1
  }>;
  processingTime: number; // ms
}
```

**Validações:**
- ✅ Auth (Supabase)
- ✅ Tenant (user pertence ao tenant)
- ✅ Question não vazia

**Mock para Desenvolvimento:**
```typescript
// Modo mock (sem n8n)
if (process.env.NEUROCORE_MOCK === 'true') {
  return NextResponse.json({
    answer: 'Mock response...',
    synapsesUsed: [...],
    processingTime: 1500
  });
}
```

---

### Server Action

#### `submitFeedbackAction`

**Signature:**
```typescript
export async function submitFeedbackAction(
  tenantId: string,
  feedbackType: 'like' | 'dislike',
  context: {
    question: string;
    answer: string;
    synapsesUsed: string[]; // IDs
  },
  comment?: string
): Promise<ActionResult>
```

**Lógica:**
1. Valida auth
2. Valida tenant
3. INSERT `message_feedbacks` com context JSON
4. Return success

---

## Plano de Ação Detalhado

### Sprint 1: Fundação (2-3 horas)

#### Task 1.1: Types e Interfaces
- [ ] Criar `/types/neurocore.ts`
- [ ] Definir `TrainingQuery`, `TrainingResponse`, `SynapseUsed`
- [ ] Definir `ResponseFeedback`, `ActionResult`

#### Task 1.2: API Route Mock
- [ ] Criar `/app/api/neurocore/query/route.ts`
- [ ] Implementar validação auth + tenant
- [ ] Implementar mock response (sem n8n)
- [ ] Testar com Postman/curl

#### Task 1.3: Server Action
- [ ] Criar `/app/actions/neurocore.ts`
- [ ] Implementar `submitFeedbackAction`
- [ ] Validações + INSERT Supabase
- [ ] Testar isoladamente

---

### Sprint 2: Componentes Base (3-4 horas)

#### Task 2.1: Input Component
- [ ] Criar `components/neurocore/training-query-input.tsx`
- [ ] Form com validação (react-hook-form)
- [ ] Min 3 chars, max 500 chars
- [ ] Loading state
- [ ] Testar isoladamente

#### Task 2.2: Response Card
- [ ] Criar `components/neurocore/training-response-card.tsx`
- [ ] Renderizar markdown (answer)
- [ ] Empty state (nenhuma synapse)
- [ ] Timestamp
- [ ] Testar isoladamente

#### Task 2.3: Synapse Card
- [ ] Criar `components/neurocore/synapse-used-card.tsx`
- [ ] Score visual (progress bar ou badge)
- [ ] Expandir/colapsar conteúdo
- [ ] Botões [Ver] [Editar]
- [ ] Testar isoladamente

---

### Sprint 3: Feedback e Integração (2-3 horas)

#### Task 3.1: Feedback Component
- [ ] Criar `components/neurocore/response-feedback.tsx`
- [ ] Botões like/dislike
- [ ] Dialog de comentário (dislike)
- [ ] Submit para Server Action
- [ ] Toast de confirmação

#### Task 3.2: Container Component
- [ ] Criar `components/neurocore/neurocore-chat.tsx`
- [ ] Estado local: `queries[]`
- [ ] handleSubmitQuery
- [ ] handleFeedback
- [ ] Renderizar histórico

#### Task 3.3: Página Principal
- [ ] Atualizar `app/(dashboard)/neurocore/page.tsx`
- [ ] Integrar `<NeurocoreChat>`
- [ ] Empty state
- [ ] Layout responsivo

---

### Sprint 4: Reutilização e Refinamento (2 horas)

#### Task 4.1: Reutilizar Synapse Dialog
- [ ] Importar `<SynapseDialog>` da Base de Conhecimento
- [ ] Passar synapse como prop
- [ ] Callback `onSave` → revalidate
- [ ] Testar edição

#### Task 4.2: Loading States
- [ ] Skeleton para resposta
- [ ] Spinner durante query
- [ ] Desabilitar input durante loading

#### Task 4.3: Error Handling
- [ ] Try-catch em API route
- [ ] Timeout de 30s
- [ ] Mensagens de erro amigáveis
- [ ] Retry button

---

### Sprint 5: Testes e Documentação (1 hora)

#### Task 5.1: Testes
- [ ] `npm run type-check` ✅
- [ ] `npm run lint` ✅
- [ ] `npm run build` ✅
- [ ] Testar manualmente todos fluxos

#### Task 5.2: Documentação
- [ ] Atualizar DECISIONS.md (Decisão #008)
- [ ] Atualizar PROGRESS.md
- [ ] Screenshots (opcional)
- [ ] Commit + Push

---

## Desafios e Soluções

### Desafio 1: n8n Não Configurado Ainda
**Problema:** Webhook n8n ainda não existe
**Solução:**
- Implementar modo mock (env var `NEUROCORE_MOCK=true`)
- Retorna resposta fake + synapses fake
- Permite desenvolver/testar frontend sem n8n
- Quando n8n estiver pronto, trocar flag

**Código:**
```typescript
if (process.env.NEUROCORE_MOCK === 'true') {
  await new Promise(r => setTimeout(r, 2000)); // simula delay
  return mockResponse;
}
```

---

### Desafio 2: Salvar Feedback Sem message_id
**Problema:** `message_feedbacks.message_id` espera FK para `messages`
**Solução 1 (Recomendada):**
- Deixar `message_id = NULL`
- Usar campo `comment` para armazenar contexto JSON:
```json
{
  "type": "neurocore_training",
  "question": "Qual o prazo...",
  "answer": "O prazo é...",
  "synapsesUsed": ["uuid1", "uuid2"]
}
```

**Solução 2 (Alternativa):**
- Criar tabela `neurocore_training_feedbacks`
- Específica para treinamento
- ❌ Mais complexo, não necessário para MVP

**Decisão:** Solução 1 (reutilizar tabela existente)

---

### Desafio 3: Reutilizar SynapseDialog
**Problema:** Dialog está acoplado à página de Base de Conhecimento
**Solução:**
- Refatorar `<SynapseDialog>` para aceitar props genéricos
- Não depender de pathname
- Callback `onSave(synapse) => void` flexível
- Componente se torna reutilizável

**Refactor:**
```typescript
// Antes
<SynapseDialog tenantId={...} baseConhecimentoId={...} />

// Depois
<SynapseDialog
  synapse={selectedSynapse}
  onSave={handleSave}
  onClose={handleClose}
/>
```

---

### Desafio 4: Performance com Histórico Grande
**Problema:** Usuário faz 50 queries, estado fica pesado
**Solução:**
- Limitar histórico em memória (últimas 20 queries)
- Virtualização (react-window) se necessário
- Não é crítico para MVP (poucos usuários)

---

### Desafio 5: Markdown Injection
**Problema:** Resposta da IA pode conter markdown malicioso
**Solução:**
- Usar `react-markdown` com `remarkGfm`
- Sanitizar HTML (DOMPurify)
- Whitelist de componentes permitidos
- Desabilitar scripts

**Código:**
```typescript
<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Whitelist
    p: 'p',
    strong: 'strong',
    em: 'em',
    // Block scripts
    script: () => null,
  }}
>
  {answer}
</ReactMarkdown>
```

---

## Decisões Técnicas (Summary)

| # | Decisão | Justificativa |
|---|---------|---------------|
| 1 | Estado local (não persiste queries) | Simplicidade MVP, histórico não é crítico |
| 2 | Reutilizar `message_feedbacks` | Evita criar tabela nova, flexível via JSON |
| 3 | Mock do n8n via env var | Desenvolvimento paralelo frontend/backend |
| 4 | Reutilizar `<SynapseDialog>` | DRY, consistência UX, já testado |
| 5 | Timeout 30s para n8n | n8n pode demorar (embeddings + LLM) |
| 6 | Markdown sanitizado | Segurança (XSS) |
| 7 | Score visual (%) | Transparência para usuário entender relevância |

---

## Métricas de Sucesso

### MVP Considerado Bem-Sucedido Se:
- ✅ Usuário consegue fazer pergunta e receber resposta
- ✅ Resposta mostra synapses usadas com score
- ✅ Usuário consegue dar feedback (like/dislike)
- ✅ Usuário consegue editar synapse direto do Neurocore
- ✅ Mudanças nas synapses refletem em novas queries
- ✅ Zero erros TypeScript e build passa

### Métricas Pós-Deploy:
- % de feedbacks positivos (target: >70%)
- Tempo médio de resposta n8n (target: <5s)
- Quantidade de synapses editadas via Neurocore (indica uso ativo)

---

## Próximos Passos Pós-MVP

### Features Futuras (Não MVP):
1. **Histórico Persistido** - Salvar queries no banco
2. **Comparação de Respostas** - "Testar novamente" e comparar
3. **Sugestões de Melhorias** - IA sugere ajustes nas synapses
4. **Export de Relatório** - PDF com queries + feedbacks
5. **Métricas de Qualidade** - Dashboard de performance da IA
6. **Teste em Batch** - Importar CSV de perguntas, testar todas

---

**Pronto para implementar!** 🚀
