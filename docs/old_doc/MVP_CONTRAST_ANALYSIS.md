# Análise de Contraste: MVP Descrito vs Implementado

## Índice
1. [Visão Geral](#visão-geral)
2. [Contraste Feature por Feature](#contraste-feature-por-feature)
3. [Gaps Críticos Identificados](#gaps-críticos-identificados)
4. [Análise de Prioridades](#análise-de-prioridades)
5. [Plano de Ação Recomendado](#plano-de-ação-recomendado)

---

## Visão Geral

### O que temos implementado (Status atual):

| Feature | Status | Completude |
|---------|--------|------------|
| **Sidebar** | ✅ Completo | 100% |
| **Livechat** | ⚠️ Parcial | 60% |
| **Base de Conhecimento** | ⚠️ Parcial | 50% |
| **Treinamento Neurocore** | 📝 Planejado | 0% |
| **Dashboard** | ❌ Não iniciado | 0% |
| **Personalização NeuroCore** | ❌ Não iniciado | 0% |

---

## Contraste Feature por Feature

### 1. Dashboard (/cliente/dashboard)

#### MVP Descrito:
```
✅ KPIs:
  - Total de Conversas com IA Agora
  - Total de Conversas em Pause Agora
✅ Gráfico: Quantidade de Conversas por Hora
✅ Nuvem de Palavras
✅ Filtros: Período, Seleção de Conversas
✅ Empty States
```

#### Implementado:
```
❌ Nada implementado
```

#### Gap:
- **100% de gap** - Feature completamente ausente

#### Prioridade:
- **BAIXA** (analytics, não bloqueia uso do sistema)

---

### 2. Live Chat (/cliente/live-chat)

#### MVP Descrito:

**Layout:** 4 colunas
```
Coluna 1: Lista de Contatos
  ✅ Filtros por ContactStatus
  ✅ Busca com "Microseletor" (Nome/Telefone/Tag)
  ✅ Ordenação por lastInteraction

Coluna 2: Lista de Conversas
  ✅ Filtros por ConversationStatus
  ✅ Conversas do contato selecionado

Coluna 3: Interações da Conversa
  ✅ Botões pause/play IA
  ✅ Feedback da Conversa (like/dislike no header)
  ✅ Histórico de Mensagens (balões WhatsApp)
  ✅ Feedback de Mensagem Individual (hover thumb-up/down)
  ✅ Respostas Rápidas Frequentes (lightning-bolt, popover)
  ✅ Comando "/" para Quick Replies (lista ancorada)
  ✅ Sheet "Gerenciar Respostas Rápidas"
  ✅ Modal "Adicionar/Editar Resposta Rápida"

Coluna 4: Dados do Cliente
  ✅ Ficha Cadastral (formulário editável)
  ✅ Último Negócio (JSON formatado)
  ✅ Botão "Copiar Informações" (markdown)
```

#### Implementado:

**Layout:** 3 colunas (originalmente planejado)
```
Coluna 1: Lista de Contatos
  ✅ Existe
  ❌ Filtros ausentes
  ❌ Busca ausente

Coluna 2: Conversação
  ✅ Histórico de mensagens
  ✅ Botões pause/play IA
  ✅ Enviar mensagem manual
  ❌ Feedback de conversa (header)
  ❌ Feedback de mensagem individual
  ❌ Respostas Rápidas
  ❌ Comando "/"
  ❌ Sheet gerenciar

Coluna 3: Dados do Cliente
  ❌ Não implementada
  ❌ Ficha cadastral
  ❌ Último negócio
  ❌ Copiar markdown
```

#### Gaps Críticos:
1. **Layout diferente** (3 colunas vs 4 colunas descritas)
2. **Feedback de mensagens** - Feature CORE ausente
3. **Respostas Rápidas** - Feature CORE ausente
4. **Coluna 4 (Dados do Cliente)** - Completamente ausente

#### Impacto:
- ⚠️ **ALTO** - Layout pode estar incorreto
- ⚠️ **MÉDIO** - Features core faltando (feedback, quick replies)

#### Prioridade:
- **ALTA** - Livechat é feature principal

---

### 3. Base de Conhecimento (/cliente/base-conhecimento)

#### MVP Descrito:
```
✅ Tabela de Bases de Conhecimento (DataTable)
  Colunas: Nome, Descrição, NeuroCore, Qtd Synapses, Status
  Ações: Editar, Inativar

✅ Modal "Ver/Editar/Adicionar Base de Conhecimento"
  Campos: BaseConhecimento
  Campo NeuroCore (Select, desabilitado)
  Seção: Synapses Relacionadas (tabela dentro do modal)

✅ Synapses (dentro de cada Base):
  Colunas: Título, Descrição, Status
  Ações: Editar, Remover (com confirmação "confirmo remover synapse"), Publicar/Republicar

✅ Modal "Adicionar/Editar Synapse"
  Campos: Título, Descrição, Imagem (upload), Status (desabilitado)
  Status padrão ao criar: RASCUNHO
```

#### Implementado:
```
❌ HIERARQUIA AUSENTE - Saltamos a camada de bases!

✅ Lista de SYNAPSES diretamente (sem bases)
  Colunas: Título, Descrição, Status, Ações
  ✅ Create/Edit/Delete
  ✅ Toggle is_enabled
  ✅ Status badges

❌ Modal de Base NÃO existe
❌ Tabela aninhada (synapses dentro de base) NÃO existe
❌ Upload de imagem NÃO existe
⚠️ Confirmação de exclusão (tem AlertDialog, mas sem input "confirmo...")
```

#### Gaps Críticos:
1. **Arquitetura ERRADA** - Implementamos CRUD de synapses, mas pulamos a camada de bases_conhecimento
2. **Hierarquia ausente** - Usuário não consegue gerenciar bases (apenas synapses)
3. **Modal aninhado** - Base → Synapses relacionadas (não existe)

#### Impacto:
- 🔴 **CRÍTICO** - Arquitetura diverge do MVP descrito
- ⚠️ Backend já existe (tabela `base_conhecimentos`), mas não usamos na UI

#### Prioridade:
- **MÉDIA-ALTA** - Precisa refatorar, mas não bloqueia Neurocore

---

### 4. Personalização NeuroCore (/cliente/personalizacao-neurocore)

#### MVP Descrito:
```
✅ Cards de Agents (filtrados por tenant.neurocoreId)
✅ Destaque visual para isIntentAgent
✅ Modal "Personalizar Agente" (com Tabs)
  Tab 1: Configurações Gerais
  Tab 2: Persona
  Tab 3: Comportamento
  Tab 4-7: Instruções, Limitações, Roteiro, Outras (Kanban)

✅ Interface Kanban:
  Cards com Título, Descrição
  Ações: Editar, Excluir, Mover, Ativar/Desativar
```

#### Implementado:
```
❌ Nada implementado
```

#### Gap:
- **100% de gap** - Feature ausente

#### Prioridade:
- **BAIXA** - Configuração avançada, não crítica para MVP

---

### 5. Treinamento NeuroCore (/cliente/treinamento-neurocore)

#### MVP Descrito:
```
✅ Interface de chat
  Header com título
  Área de perguntas/respostas (balões)

✅ Synapses Display (abaixo da resposta)
  Lista de cards de synapses usadas

✅ Interação: Clicar em card de synapse
  Abre Modal "Editar Synapse (no Treinamento)"
  Campos: Título, Descrição, Imagem, Status (desabilitado)
  Botões: "Salvar Synapse", "Publicar Synapse", "Excluir Synapse"
  Confirmação de exclusão: "confirmo excluir synapse"

✅ Input de chat
  Enviar pergunta
```

#### Planejado (NEUROCORE_PLAN.md):
```
✅ Interface de chat ✅
✅ Synapses Display ✅
✅ Editar synapse (reutilizar <SynapseDialog>) ✅
✅ Feedback like/dislike ✅
⚠️ Botões "Publicar" e "Excluir" dentro do modal (não mencionado no plano)
⚠️ Confirmação customizada (não detalhado)
```

#### Gap Menor:
- Nosso plano cobriu 90% do MVP descrito
- Falta apenas: botões extras no modal + confirmação customizada

#### Prioridade:
- **ALTA** - Usuário pediu, feature core, diferencial do produto

---

## Gaps Críticos Identificados

### 🔴 GAP CRÍTICO #1: Base de Conhecimento - Hierarquia Ausente

**O que está errado:**
```typescript
// Implementado (ERRADO):
app/(dashboard)/knowledge-base/page.tsx
  → Lista SYNAPSES diretamente

// MVP descrito (CORRETO):
app/(dashboard)/knowledge-base/page.tsx
  → Lista BASES DE CONHECIMENTO
  → Cada base tem modal com synapses relacionadas
```

**Impacto:**
- ❌ Usuário não vê "bases", apenas synapses soltas
- ❌ Não alinha com schema do banco (base_conhecimentos → synapses)
- ❌ UX confusa

**Solução:**
- Refatorar página para listar bases_conhecimento
- Modal de base contém tabela de synapses
- Adicionar queries: `getBaseConhecimentos`, `getSynapsesByBase`

**Complexidade:** ALTA (refactor completo)

---

### ⚠️ GAP CRÍTICO #2: Livechat - Layout Divergente

**O que está errado:**
```
Implementado: 3 colunas
  1. ContactList
  2. ConversationView
  3. CustomerData (planejado, não implementado)

MVP descrito: 4 colunas
  1. Lista de Contatos
  2. Lista de Conversas
  3. Interações da Conversa
  4. Dados do Cliente
```

**Impacto:**
- ⚠️ Layout pode estar incorreto
- ⚠️ Separação de "Conversas" e "Interações" não existe

**Solução:**
- Refatorar layout para 4 colunas
- Separar lista de conversas da área de mensagens

**Complexidade:** MÉDIA

---

### ⚠️ GAP CRÍTICO #3: Feedback de Mensagens (Ausente)

**O que falta:**
```
✅ Feedback da conversa (header com like/dislike) - NÃO implementado
✅ Feedback de mensagem individual (hover thumb-up/down) - NÃO implementado
✅ Modal para feedback textual - NÃO implementado
```

**Impacto:**
- ❌ Feature CORE do produto (treinamento da IA)
- ❌ Tabela `message_feedbacks` existe, mas não usamos

**Solução:**
- Adicionar botões no header da conversa
- Adicionar hover state em balões de mensagem
- Modal de feedback
- Server Action `submitMessageFeedback`

**Complexidade:** MÉDIA

---

### ⚠️ GAP CRÍTICO #4: Respostas Rápidas (Ausente)

**O que falta:**
```
✅ Botão "Respostas Rápidas Frequentes" (lightning-bolt) - NÃO implementado
✅ Popover com 10 mais usadas - NÃO implementado
✅ Comando "/" no input (lista ancorada) - NÃO implementado
✅ Sheet "Gerenciar Respostas Rápidas" - NÃO implementado
✅ Modal "Adicionar/Editar Resposta Rápida" - NÃO implementado
```

**Impacto:**
- ❌ Feature importante para UX de atendentes
- ❌ Tabela `quick_reply_templates` existe, mas não usamos

**Solução:**
- Criar componentes: QuickReplyButton, QuickReplyPopover, QuickReplySheet
- Implementar comando "/" (cmdk ou custom)
- Queries: `getQuickReplies`, CRUD actions

**Complexidade:** ALTA (múltiplos componentes, lógica complexa)

---

## Análise de Prioridades

### Critérios de Priorização:
1. **Pedido do usuário** (explícito)
2. **Valor core do produto** (diferencial)
3. **Bloqueador para MVP** (sem isso não funciona)
4. **Complexidade de implementação** (custo/benefício)
5. **Evitar refactor** (manter momentum)

---

### Opção A: Continuar Treinamento Neurocore Agora (RECOMENDADA)

#### Prós:
- ✅ **Usuário pediu explicitamente** - "vou seguir sua recomendação"
- ✅ **Feature core** - Diferencial do produto (treinar IA)
- ✅ **Momentum** - Já planejamos 400 linhas, está claro
- ✅ **Baixo risco** - Não requer refactor de código existente
- ✅ **Independente** - Não depende de refactor da Base de Conhecimento
- ✅ **80% alinhado** - Nosso plano já cobre 90% do MVP descrito

#### Contras:
- ⚠️ Deixa gaps no Livechat (feedback, quick replies)
- ⚠️ Deixa gap na Base de Conhecimento (hierarquia)
- ⚠️ Pode criar inconsistência temporária

#### Desafios:
1. **Reutilizar SynapseDialog corretamente**
   - Precisa funcionar tanto da Base quanto do Neurocore
   - Adicionar botões: "Publicar Synapse", "Excluir Synapse"

2. **Confirmação de exclusão customizada**
   - Input para digitar "confirmo excluir synapse"
   - Validação antes de deletar

3. **Modal não acoplado**
   - Não depender de pathname ou contexto específico
   - Props genéricos: `synapse`, `onSave`, `onDelete`, `onPublish`

#### Estimativa: 10-13 horas (conforme planejado)

---

### Opção B: Refatorar Base de Conhecimento Primeiro

#### Prós:
- ✅ Alinha com MVP descrito (hierarquia correta)
- ✅ Corrige arquitetura errada
- ✅ Base sólida para Neurocore usar depois

#### Contras:
- ❌ **Não foi pedido agora** - Usuário pediu Neurocore
- ❌ **Refactor grande** - Quebra código existente
- ❌ **Delay no Neurocore** - Atrasa feature pedida
- ❌ **Complexidade alta** - Modal aninhado (base → synapses)
- ❌ **Risco** - Pode quebrar testes, componentes

#### Desafios:
1. **Refactor de todos componentes de synapse**
   - Adicionar filtro por `base_conhecimento_id`
   - Queries: `getSynapsesByBase`

2. **Modal complexo aninhado**
   - Base de conhecimento com tabela de synapses dentro
   - Two-level modal (Base → Synapse)

3. **Migração de dados** (se já tem synapses criadas)
   - Associar synapses existentes a uma base default

#### Estimativa: 12-16 horas

---

### Opção C: Completar Livechat Primeiro (Feedback + Quick Replies)

#### Prós:
- ✅ Livechat é feature principal do produto
- ✅ Feedback é core (treinar IA com dados reais)
- ✅ Quick Replies melhoram UX drasticamente

#### Contras:
- ❌ **Não foi pedido agora** - Usuário pediu Neurocore
- ❌ **Muitas features** - Feedback + Quick Replies + Coluna 4
- ❌ **Complexidade alta** - Múltiplos componentes
- ❌ **Delay no Neurocore**

#### Desafios:
1. **Feedback de mensagens**
   - Hover state em balões
   - Modal de feedback
   - Server Action

2. **Respostas Rápidas**
   - Popover (10 mais usadas)
   - Comando "/" (lista ancorada, filtragem)
   - Sheet de gerenciamento
   - Modal de CRUD

3. **Layout 4 colunas**
   - Separar conversas de interações
   - Adicionar coluna de dados do cliente

#### Estimativa: 16-20 horas

---

### Opção D: Dashboard Primeiro

#### Prós:
- ✅ Visibilidade de métricas

#### Contras:
- ❌ Não é bloqueador
- ❌ Analytics não impacta funcionalidade core
- ❌ Complexidade alta (gráficos, nuvem de palavras)

#### Prioridade: BAIXA

---

## Plano de Ação Recomendado

### 🎯 Decisão: **Opção A - Continuar Treinamento Neurocore Agora**

#### Justificativa (Princípios):

**1. Prioridade do Usuário**
- Usuário disse: "vou seguir sua recomendação" (Neurocore)
- Responder ao pedido explícito mantém confiança

**2. Momentum**
- Já planejamos 400 linhas detalhadas
- Arquitetura clara, componentes definidos
- Perder momentum é custoso

**3. Valor Core**
- Neurocore é **diferencial do produto** (testar IA antes de produção)
- Livechat/Base são importantes, mas Neurocore é único

**4. Baixo Risco**
- Não requer refactor de código existente
- Não quebra nada que já funciona
- Desenvolvimento isolado

**5. Iterativo (SOLID - Open/Closed)**
- Implementar Neurocore não impede ajustar Base/Livechat depois
- Software deve ser aberto para extensão (novas features)
- Fechado para modificação (não refatorar sem necessidade)

**6. YAGNI (You Aren't Gonna Need It)**
- Não sabemos se hierarquia de bases será usada imediatamente
- Implementar apenas o que é necessário agora (Neurocore)

---

### Plano de Execução (Neurocore)

#### Sprint 1: Fundação (2-3h)
- ✅ Types (TrainingQuery, TrainingResponse, SynapseUsed)
- ✅ API route mock (sem n8n)
- ✅ Server Action (submitFeedbackAction)

#### Sprint 2: Componentes Base (3-4h)
- ✅ TrainingQueryInput (form)
- ✅ TrainingResponseCard (markdown)
- ✅ SynapseUsedCard (score + botões)

#### Sprint 3: Feedback e Integração (2-3h)
- ✅ ResponseFeedback (like/dislike + modal)
- ✅ NeurocoreChat (container)
- ✅ Página principal

#### Sprint 4: **Ajustes para MVP Descrito** (2h)
- 🆕 Refatorar SynapseDialog para aceitar props genéricos
- 🆕 Adicionar botões: "Publicar Synapse", "Excluir Synapse"
- 🆕 Confirmação de exclusão customizada (input "confirmo excluir synapse")
- 🆕 Server Actions: `publishSynapseAction`, `deleteSynapseAction`

#### Sprint 5: Testes e Documentação (1h)
- ✅ Type-check + Lint + Build
- ✅ Documentar Decisão #008 (DECISIONS.md)
- ✅ Atualizar PROGRESS.md

**Total:** 10-13 horas (inalterado)

---

### Ajustes no Plano Original (Diferenças do MVP Descrito)

#### 1. Botões Extras no Modal de Synapse

**MVP Descrito:**
```
Modal "Editar Synapse (no Treinamento)":
  Botões: [Salvar] [Publicar Synapse] [Excluir Synapse]
```

**Nosso Plano Original:**
```
Apenas reutilizar <SynapseDialog> da Base de Conhecimento
```

**Ajuste Necessário:**
- Adicionar props ao `<SynapseDialog>`:
  ```typescript
  interface SynapseDialogProps {
    synapse?: Synapse;
    mode: 'create' | 'edit' | 'training'; // NOVO
    onSave: (synapse: Synapse) => void;
    onDelete?: (synapseId: string) => void; // NOVO
    onPublish?: (synapseId: string) => void; // NOVO
    onClose: () => void;
  }
  ```

- Renderizar botões condicionalmente:
  ```typescript
  {mode === 'training' && (
    <>
      <Button onClick={handlePublish}>Publicar Synapse</Button>
      <Button variant="destructive" onClick={handleDelete}>
        Excluir Synapse
      </Button>
    </>
  )}
  ```

**Princípio SOLID:**
- **Open/Closed**: Componente aberto para extensão (novos modos)
- **Single Responsibility**: Dialog só renderiza, callbacks fazem ação

---

#### 2. Confirmação de Exclusão Customizada

**MVP Descrito:**
```
Confirmação que exige digitação de "confirmo excluir synapse"
```

**Nosso Plano Original:**
```
AlertDialog simples (Sim/Não)
```

**Ajuste Necessário:**
- Criar componente `<DeleteSynapseConfirmation>`:
  ```typescript
  interface Props {
    synapseName: string;
    onConfirm: () => void;
    onCancel: () => void;
  }
  ```

- Dialog com input:
  ```typescript
  const [confirmText, setConfirmText] = useState('');
  const isValid = confirmText === 'confirmo excluir synapse';

  <Input
    placeholder="Digite 'confirmo excluir synapse'"
    value={confirmText}
    onChange={(e) => setConfirmText(e.target.value)}
  />

  <Button
    disabled={!isValid}
    onClick={onConfirm}
  >
    Excluir
  </Button>
  ```

**Princípio SOLID:**
- **Single Responsibility**: Componente só valida confirmação
- Não acopla lógica de exclusão

---

#### 3. Server Actions Adicionais

**Necessários:**
```typescript
// app/actions/synapses.ts

export async function publishSynapseAction(
  tenantId: string,
  synapseId: string
): Promise<ActionResult> {
  // 1. UPDATE synapses SET status = 'indexing'
  // 2. Chamar webhook n8n (se não for mock)
  // 3. revalidatePath
}

export async function deleteSynapseFromTrainingAction(
  tenantId: string,
  synapseId: string
): Promise<ActionResult> {
  // 1. Validar auth + tenant
  // 2. DELETE synapse
  // 3. Chamar webhook n8n (remover embeddings)
  // 4. revalidatePath
}
```

**Nota:** Já temos `deleteSynapseAction` na Base de Conhecimento, podemos reutilizar.

---

### Após Neurocore (Próximas Prioridades)

#### Prioridade 1: Refatorar Base de Conhecimento (hierarquia)
- **Quando:** Logo após Neurocore
- **Por quê:** Corrige arquitetura, alinha com MVP
- **Estimativa:** 12-16 horas

#### Prioridade 2: Feedback de Mensagens (Livechat)
- **Quando:** Após Base de Conhecimento
- **Por quê:** Feature core para treinar IA
- **Estimativa:** 6-8 horas

#### Prioridade 3: Respostas Rápidas (Livechat)
- **Quando:** Após Feedback
- **Por quê:** UX importante para atendentes
- **Estimativa:** 10-12 horas

#### Prioridade 4: Dashboard
- **Quando:** Futuro
- **Por quê:** Analytics, não bloqueia
- **Estimativa:** 16-20 horas

---

## Desafios Específicos do Neurocore (Atualizado)

### Desafio 1: Reutilizar SynapseDialog com Novos Botões

**Problema:**
- Dialog atual está acoplado à Base de Conhecimento
- Precisa funcionar no Neurocore com botões diferentes

**Solução (SOLID - Dependency Inversion):**
```typescript
// Antes (acoplado):
<SynapseDialog tenantId={...} baseConhecimentoId={...} />

// Depois (desacoplado):
<SynapseDialog
  synapse={selectedSynapse}
  mode="training" // ou "create" | "edit"
  onSave={handleSave}
  onDelete={handleDelete}
  onPublish={handlePublish}
  onClose={handleClose}
/>
```

**Princípios aplicados:**
- **Dependency Inversion**: Dialog depende de abstração (callbacks), não de implementação
- **Open/Closed**: Aberto para extensão (novo modo), fechado para modificação

---

### Desafio 2: Confirmação de Exclusão com Input

**Problema:**
- MVP exige digitação de "confirmo excluir synapse"
- AlertDialog padrão não tem input

**Solução:**
- Criar `<DeleteSynapseConfirmation>` component
- Dialog customizado com:
  - Input controlado
  - Validação em tempo real
  - Botão desabilitado até validar

**Evitar over-engineering:**
- ❌ NÃO criar sistema genérico de confirmações
- ✅ Component específico para synapse
- ✅ Reutilizável (props: synapseName, onConfirm, onCancel)

---

### Desafio 3: Modo Mock vs n8n Real

**Problema:**
- n8n pode não estar configurado ainda
- Precisa desenvolver frontend independentemente

**Solução (já planejada):**
```typescript
// .env.local
NEUROCORE_MOCK=true

// API route
if (process.env.NEUROCORE_MOCK === 'true') {
  await delay(2000); // simula latência
  return mockResponse;
}
```

**Quando n8n estiver pronto:**
1. Trocar `NEUROCORE_MOCK=false`
2. Configurar `N8N_NEUROCORE_QUERY_WEBHOOK`
3. Testar integração real

---

### Desafio 4: Markdown Sanitization (Segurança)

**Problema:**
- Resposta da IA pode conter markdown malicioso
- XSS risk

**Solução (Padrão de mercado):**
```typescript
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

<ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{
    // Whitelist
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    // Block scripts
    script: () => null,
  }}
>
  {answer}
</ReactMarkdown>
```

**Biblioteca recomendada:**
- `react-markdown` (padrão de mercado, 12M downloads/semana)
- `remark-gfm` (GitHub Flavored Markdown)

**Evitar:**
- ❌ `dangerouslySetInnerHTML` (inseguro)
- ❌ Regex caseiro (propenso a bugs)

---

## Bibliotecas Consideradas (Padrão do Projeto)

### Já usamos (continuar usando):
- ✅ `shadcn/ui` - Componentes
- ✅ `react-hook-form` - Formulários
- ✅ `lucide-react` - Ícones
- ✅ `next` - Framework

### Adicionar para Neurocore:
- ✅ `react-markdown` - Renderizar resposta da IA (padrão de mercado)
- ✅ `remark-gfm` - Suporte a markdown estendido

### Evitar adicionar (over-engineering):
- ❌ `cmdk` - Apenas para comando "/" (não precisamos agora)
- ❌ `react-window` - Virtualização (não precisamos agora, histórico pequeno)
- ❌ `zustand` - Estado global (useState local é suficiente)

---

## Resumo Executivo

### ✅ Continuar Treinamento Neurocore Agora

**Por quê:**
1. **Usuário pediu** - Prioridade explícita
2. **Momentum** - Já planejamos detalhadamente
3. **Valor core** - Diferencial do produto
4. **Baixo risco** - Não quebra código existente
5. **SOLID** - Open/Closed (extensão, não modificação)

**Ajustes ao plano:**
- ✅ Adicionar botões "Publicar" e "Excluir" no modal
- ✅ Confirmação customizada (input "confirmo excluir synapse")
- ✅ Refatorar SynapseDialog para props genéricos

**Estimativa:** 10-13 horas (inalterado)

**Próximos passos após:**
1. Refatorar Base de Conhecimento (hierarquia)
2. Feedback de mensagens (Livechat)
3. Respostas Rápidas (Livechat)
4. Dashboard (futuro)

---

**Pronto para implementar!** 🚀
