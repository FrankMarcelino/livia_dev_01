# Plano: Refatoração Layout Master-Detail - Base de Conhecimento

**Data:** 2025-11-19
**Status:** Em Planejamento
**Estimativa:** 8-10 horas

---

## Índice
1. [Mudanças no Layout](#mudanças-no-layout)
2. [Componentes](#componentes)
3. [Webhooks N8N](#webhooks-n8n)
4. [Regras de Negócio](#regras-de-negócio)
5. [Aplicação de SOLID](#aplicação-de-solid)
6. [Pros e Contras](#pros-e-contras)
7. [Desafios e Soluções](#desafios-e-soluções)
8. [Plano de Implementação](#plano-de-implementação)
9. [Testes](#testes)

---

## Mudanças no Layout

### ❌ ANTES (Modal Aninhado)
```
Grid de Cards → Click card → Modal Base (com synapses aninhadas)
                              └─> Click ADD SYNAPSE → Sub-modal Synapse
```

**Problemas:**
- Modal dentro de modal (z-index complexo)
- Muito conteúdo em modal (pode ficar pesado)
- Não alinha 100% com wireframe do usuário

### ✅ DEPOIS (Master-Detail)
```
Scroll Horizontal de Cards (Master)
  ↓ Click card seleciona
Tabela de Synapses abaixo (Detail)
  ↓ Click ADD SYNAPSE
Modal Synapse (apenas form, não aninhado)
```

**Benefícios:**
- Visual mais clean (sem modal grande)
- Alinha perfeitamente com wireframe
- Menos z-index complexity
- Melhor UX (master-detail pattern conhecido)

---

## Componentes

### 🆕 A CRIAR

#### 1. `BaseConhecimentoCard.tsx`
**Responsabilidade:** Renderizar card individual de base
**Props:**
```typescript
interface BaseConhecimentoCardProps {
  base: BaseConhecimentoWithCount;
  isSelected: boolean;
  onSelect: (baseId: string) => void;
  onToggleActive: (baseId: string, isActive: boolean) => void;
}
```

**Features:**
- Visual highlight quando selecionado (border, shadow, bg)
- Badge com quantidade de synapses
- Toggle Ativa/Desativa
- Tooltip com descrição (se houver)
- Click seleciona a base

**SOLID:**
- **SRP**: Apenas renderiza card
- **OCP**: Aceita callbacks, não depende de implementação
- **DIP**: Callbacks abstratos

---

#### 2. `BaseConhecimentoCarousel.tsx`
**Responsabilidade:** Scroll horizontal de cards
**Props:**
```typescript
interface BaseConhecimentoCarouselProps {
  bases: BaseConhecimentoWithCount[];
  selectedBaseId: string | null;
  onSelectBase: (baseId: string) => void;
  onToggleActive: (baseId: string, isActive: boolean) => void;
  onOpenCreateDialog: () => void;
}
```

**Features:**
- Scroll horizontal com overflow-x-auto
- Botão [+ ADD BASE] no final
- Renderiza lista de BaseConhecimentoCard
- Passa baseId selecionado para highlight

**SOLID:**
- **SRP**: Apenas layout de scroll horizontal
- **OCP**: Extensível via callbacks
- **LSP**: Cards substituíveis

---

#### 3. `BaseConhecimentoFormDialog.tsx`
**Responsabilidade:** Modal SIMPLES para criar/editar base (SEM synapses aninhadas)
**Props:**
```typescript
interface BaseConhecimentoFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
  base?: BaseConhecimento; // Se fornecido, está editando
  onSuccess: () => void;
}
```

**Features:**
- Form: Nome, Descrição, NeuroCore (disabled)
- Validação: nome min 3 chars
- Create/Update via Server Action
- onSuccess callback para refresh

**SOLID:**
- **SRP**: Apenas form de base
- **OCP**: Callback onSuccess
- **DIP**: Não depende de router.refresh

---

#### 4. `KnowledgeBaseMasterDetail.tsx`
**Responsabilidade:** Layout completo master-detail
**Props:**
```typescript
interface KnowledgeBaseMasterDetailProps {
  bases: BaseConhecimentoWithCount[];
  tenantId: string;
  neurocoreId: string;
  neurocoreName: string;
}
```

**Estado Local:**
```typescript
const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
const [synapses, setSynapses] = useState<Synapse[]>([]);
const [loadingSynapses, setLoadingSynapses] = useState(false);
const [baseDialogOpen, setBaseDialogOpen] = useState(false);
const [synapseDialogOpen, setSynapseDialogOpen] = useState(false);
```

**Features:**
- Gerencia estado da base selecionada
- Carrega synapses via API quando base é selecionada
- Renderiza BaseConhecimentoCarousel (master)
- Renderiza SynapsesTable (detail) quando base selecionada
- Renderiza BaseConhecimentoFormDialog
- Renderiza SynapseDialog

**SOLID:**
- **SRP**: Orquestra master-detail, não renderiza diretamente
- **OCP**: Componentes filhos extensíveis
- **DIP**: Usa API route abstrata

---

### ❌ A REMOVER

1. **`BaseConhecimentoDialog.tsx`** - Era modal grande com synapses aninhadas (não serve mais)
2. **`BaseConhecimentoTable.tsx`** - Era DataTable, agora é carousel de cards
3. **`KnowledgeBaseContainer.tsx`** - Substituído por KnowledgeBaseMasterDetail

---

### ✅ A REUTILIZAR (SEM MODIFICAR)

1. **`SynapsesTable.tsx`** - ✅ Perfeito, já tem callback
2. **`SynapseDialog.tsx`** - ✅ Perfeito, já tem callback
3. **`DeleteSynapseDialog.tsx`** - ✅ Perfeito
4. **`SynapseActions.tsx`** - ✅ Perfeito

---

## Webhooks N8N

### Webhooks a ADICIONAR

Baseado nas respostas do usuário:

#### 1. **Sync Synapse (Create/Update)**
**Quando:** Criar ou editar synapse
**Endpoint:** `/webhook/livia/sync-synapse`
**Payload:**
```typescript
{
  synapseId: string;
  baseConhecimentoId: string;
  tenantId: string;
  operation: 'create' | 'update';
  content: string;
  title: string;
}
```

**Server Action:** `createSynapseAction`, `updateSynapseAction`

---

#### 2. **Delete Synapse Embeddings**
**Quando:** Deletar synapse
**Endpoint:** `/webhook/livia/delete-synapse-embeddings`
**Payload:**
```typescript
{
  synapseId: string;
  tenantId: string;
}
```

**Server Action:** `deleteSynapseAction`

---

#### 3. **Toggle Synapse Embeddings**
**Quando:** Desativar synapse (is_enabled = false)
**Endpoint:** `/webhook/livia/toggle-synapse-embeddings`
**Payload:**
```typescript
{
  synapseId: string;
  tenantId: string;
  isEnabled: boolean; // Se false, remove embeddings
}
```

**Server Action:** `toggleSynapseEnabledAction`

**Regra:** Quando desativa (false), n8n remove embeddings. Quando ativa (true), n8n cria embeddings.

---

#### 4. **Inactivate Base**
**Quando:** Desativar base (is_active = false)
**Endpoint:** `/webhook/livia/inactivate-base`
**Payload:**
```typescript
{
  baseConhecimentoId: string;
  tenantId: string;
  isActive: boolean;
}
```

**Server Action:** `toggleBaseConhecimentoActive`

**Regra:** Quando base inativa, todas synapses dela ficam inacessíveis (n8n ignora embeddings dessa base).

---

### Configuração N8N

**Variáveis de Ambiente (.env.local):**
```bash
# N8N Base URL
N8N_BASE_URL=http://localhost:5678

# Webhooks
N8N_SYNC_SYNAPSE_WEBHOOK=/webhook/livia/sync-synapse
N8N_DELETE_SYNAPSE_EMBEDDINGS_WEBHOOK=/webhook/livia/delete-synapse-embeddings
N8N_TOGGLE_SYNAPSE_EMBEDDINGS_WEBHOOK=/webhook/livia/toggle-synapse-embeddings
N8N_INACTIVATE_BASE_WEBHOOK=/webhook/livia/inactivate-base
```

---

## Regras de Negócio

### Base Inativa
**Pergunta:** Quando base está inativa, a IA ainda pode usar synapses dela?
**Resposta:** ❌ Não. Synapses ficam inacessíveis.

**Implementação:**
- Frontend: Toggle `is_active` no card
- Backend: UPDATE `base_conhecimentos.is_active`
- Webhook: N8N remove/ignora embeddings dessa base
- UI: Visual (opacidade, badge "Inativa")

---

### Synapse Desativada
**Pergunta:** Webhook precisa remover embeddings ou apenas marcar como inactive?
**Resposta:** ✅ Remove embeddings.

**Implementação:**
- Frontend: Toggle `is_enabled` na tabela
- Backend: UPDATE `synapses.is_enabled`
- Webhook: N8N remove embeddings quando `isEnabled = false`
- Webhook: N8N cria embeddings quando `isEnabled = true`

---

### Feedback de Processamento
**Pergunta:** Como usuário sabe que n8n terminou de processar?
**Resposta:** Status muda (draft → indexing → publishing). Pode demorar ~1 minuto.

**Implementação:**
- N8N atualiza campo `status` via Supabase
- Frontend usa Realtime para atualizar badge em tempo real
- Badges visuais coloridos (draft 🔵, indexing 🟡, publishing 🟢, error 🔴)

---

### Delete de Base
**Pergunta:** Posso deletar base que tem synapses?
**Resposta:** ⚠️ Perigoso. Melhor fazer **soft delete** (marcar como inativa).

**Implementação:**
- Não implementar botão "Deletar Base" no MVP
- Apenas toggle Ativa/Desativa
- Se necessário deletar, backend valida FK constraint (falhará se tiver synapses)

---

### Batch Operations
**Pergunta:** Precisa ativar/desativar múltiplas synapses de uma vez?
**Resposta:** ❌ Não. N8N já trata de forma assíncrona.

**Implementação:**
- Não implementar seleção múltipla
- Cada toggle é individual

---

## Aplicação de SOLID

### 1. Single Responsibility Principle (SRP)

**BaseConhecimentoCard:** Apenas renderiza card
**BaseConhecimentoCarousel:** Apenas layout de scroll
**BaseConhecimentoFormDialog:** Apenas form de base
**KnowledgeBaseMasterDetail:** Apenas orquestra estado master-detail
**SynapsesTable:** Apenas renderiza tabela de synapses

✅ Cada componente tem responsabilidade única.

---

### 2. Open/Closed Principle (OCP)

**Callbacks em todos os componentes:**
- `onSelect`, `onToggleActive`, `onSuccess`, `onSynapseChange`
- Componentes **abertos para extensão** (novos callbacks)
- **Fechados para modificação** (lógica interna não muda)

✅ Extensível sem modificar código existente.

---

### 3. Liskov Substitution Principle (LSP)

**SynapsesTable reutilizável:**
- Funciona em KnowledgeBaseMasterDetail
- Funcionaria em modal (se necessário)
- Funcionaria em Neurocore (view-only)

✅ Componentes substituíveis em diferentes contextos.

---

### 4. Interface Segregation Principle (ISP)

**Props específicas:**
- BaseConhecimentoCard não recebe props de synapses
- SynapsesTable não recebe props de base
- Callbacks opcionais (não forçados)

✅ Interfaces mínimas, sem props desnecessários.

---

### 5. Dependency Inversion Principle (DIP)

**Abstrações:**
- Componentes dependem de callbacks (abstrações)
- Não dependem de router.refresh (implementação)
- Não dependem de queries diretas (usam API routes)

✅ Depende de abstrações, não de implementações.

---

## Pros e Contras

### ✅ Pros

| Vantagem | Descrição |
|----------|-----------|
| **Alinha 100% com wireframe** | Layout master-detail exatamente como usuário desenhou |
| **Menos z-index complexity** | Sem modal aninhado (dialog dentro de dialog) |
| **Melhor performance** | Renderiza apenas synapses da base selecionada |
| **UX conhecida** | Master-detail é pattern estabelecido (Gmail, Slack, etc) |
| **Scroll horizontal** | Suporta muitas bases sem poluir verticalmente |
| **Reutilização máxima** | SynapsesTable, SynapseDialog já prontos |
| **Webhooks N8N** | Integração real com vetorização |

---

### ⚠️ Contras

| Desvantagem | Descrição | Mitigação |
|-------------|-----------|-----------|
| **Scroll horizontal pode esconder bases** | Usuário pode não ver todas bases se passar da tela | Indicador visual de scroll (setas ◄ ►) |
| **Estado local de synapses** | Precisa refetch ao trocar base | Loading state + cache local simples |
| **Mais componentes** | 4 novos componentes vs refactor existente | Componentes pequenos, SOLID aplicado |
| **Webhooks podem falhar** | N8N offline bloqueia vetorização | Error handling + toast notificando usuário |

---

## Desafios e Soluções

### Desafio 1: Scroll Horizontal em Mobile

**Problema:** Touch scroll pode ser difícil em mobile.

**Solução:**
- CSS `overflow-x-auto` com `-webkit-overflow-scrolling: touch`
- Indicadores visuais de scroll (◄ ► ou dots)
- Future: Considerar grid 2 colunas em mobile (media query)

---

### Desafio 2: Estado de Synapses ao Trocar Base

**Problema:** Usuário seleciona Base A (carrega synapses) → seleciona Base B → volta para Base A (recarrega?)

**Solução:**
- **Opção A (MVP):** Sempre refetch ao selecionar (simples, sempre atualizado)
- **Opção B (Otimização):** Cache local Map<baseId, Synapse[]> (mais complexo)

**Decisão:** Opção A para MVP (simplicidade).

---

### Desafio 3: Feedback de Webhook N8N

**Problema:** Webhook falha (N8N offline, timeout, etc). Como avisar usuário?

**Solução:**
- Try/catch em todos Server Actions
- Se webhook falha: Log erro + continua (não bloqueia CRUD)
- Toast de aviso: "Synapse salva, mas processamento pode demorar"
- N8N tem polling de fallback para processar synapses orphan

---

### Desafio 4: Base Inativa vs Synapse Inativa

**Problema:** Se base inativa, synapses ficam acessíveis? E se synapse inativa mas base ativa?

**Regras (confirmadas com usuário):**
- **Base inativa:** TODAS synapses ficam inacessíveis (n8n ignora)
- **Synapse inativa:** Apenas essa synapse fica inacessível
- **Base ativa + Synapse inativa:** Synapse não é usada
- **Base inativa + Synapse ativa:** Synapse não é usada (base prevalece)

**Implementação:**
- Frontend: Visual (opacidade, badge)
- Backend: Webhook informa n8n sobre mudanças
- N8N: Filtra por `base.is_active = true AND synapse.is_enabled = true`

---

### Desafio 5: Performance com Muitas Bases/Synapses

**Problema:** Tenant com 50+ bases e 1000+ synapses.

**Solução:**
- Scroll horizontal suporta muitas bases (não afeta performance)
- Renderiza apenas synapses da base selecionada (não todas)
- Future: Paginação na tabela de synapses (se base tiver >100)

---

## Plano de Implementação

### Sprint 1: Remover Componentes Antigos (30min)

- [ ] Deletar `components/knowledge-base/base-conhecimento-dialog.tsx`
- [ ] Deletar `components/knowledge-base/base-conhecimento-table.tsx`
- [ ] Deletar `components/knowledge-base/knowledge-base-container.tsx`
- [ ] Atualizar `components/knowledge-base/index.ts` (remover exports)

---

### Sprint 2: Criar Componentes Novos (3-4h)

#### Task 2.1: BaseConhecimentoCard
- [ ] Criar arquivo `base-conhecimento-card.tsx`
- [ ] Props: base, isSelected, onSelect, onToggleActive
- [ ] Visual highlight quando selected (border-primary, shadow-lg)
- [ ] Badge com synapses_count
- [ ] Toggle Ativa/Desativa
- [ ] Click seleciona base

#### Task 2.2: BaseConhecimentoCarousel
- [ ] Criar arquivo `base-conhecimento-carousel.tsx`
- [ ] Scroll horizontal (overflow-x-auto, flex gap-4)
- [ ] Renderiza lista de BaseConhecimentoCard
- [ ] Botão [+ ADD BASE] no final
- [ ] Indicadores de scroll (opcional)

#### Task 2.3: BaseConhecimentoFormDialog
- [ ] Criar arquivo `base-conhecimento-form-dialog.tsx`
- [ ] Form simples: Nome, Descrição, NeuroCore (disabled)
- [ ] Validação: nome min 3 chars
- [ ] Modo create/edit
- [ ] Callback onSuccess

#### Task 2.4: KnowledgeBaseMasterDetail
- [ ] Criar arquivo `knowledge-base-master-detail.tsx`
- [ ] Estado: selectedBaseId, synapses, loading, dialogs
- [ ] Fetch synapses via `/api/bases/[baseId]/synapses`
- [ ] Renderiza BaseConhecimentoCarousel (master)
- [ ] Renderiza SynapsesTable (detail) quando base selecionada
- [ ] Renderiza BaseConhecimentoFormDialog
- [ ] Renderiza SynapseDialog

---

### Sprint 3: Adicionar Webhooks N8N (2-3h)

#### Task 3.1: Configurar Variáveis de Ambiente
- [ ] Atualizar `.env.local.example` com N8N webhooks
- [ ] Documentar cada webhook

#### Task 3.2: Criar Função Helper para Webhooks
- [ ] `lib/utils/n8n-webhooks.ts`
- [ ] Função `callN8nWebhook(endpoint, payload)`
- [ ] Try/catch com error handling
- [ ] Timeout 10s
- [ ] Log erros (não bloqueia CRUD)

#### Task 3.3: Atualizar Server Actions
- [ ] `createSynapseAction` → chamar `callN8nWebhook('/sync-synapse')`
- [ ] `updateSynapseAction` → chamar `callN8nWebhook('/sync-synapse')`
- [ ] `deleteSynapseAction` → chamar `callN8nWebhook('/delete-synapse-embeddings')`
- [ ] `toggleSynapseEnabledAction` → chamar `callN8nWebhook('/toggle-synapse-embeddings')`
- [ ] `toggleBaseConhecimentoActive` → chamar `callN8nWebhook('/inactivate-base')`

---

### Sprint 4: Atualizar Página Principal (1h)

- [ ] Refatorar `app/(dashboard)/knowledge-base/page.tsx`
- [ ] Usar `KnowledgeBaseMasterDetail` ao invés de `KnowledgeBaseContainer`
- [ ] Passar props corretos (bases, tenantId, neurocoreId, neurocoreName)

---

### Sprint 5: Testes (1-2h)

- [ ] TypeScript type-check
- [ ] ESLint
- [ ] Build production
- [ ] Testes manuais:
  - [ ] Selecionar base → carrega synapses
  - [ ] Trocar base → carrega novas synapses
  - [ ] Criar base → adiciona no carousel + seleciona
  - [ ] Toggle base → webhook chamado (mock OK se N8N offline)
  - [ ] Criar synapse → webhook chamado
  - [ ] Editar synapse → webhook chamado
  - [ ] Deletar synapse → webhook chamado
  - [ ] Toggle synapse → webhook chamado

---

### Sprint 6: Documentação (30min)

- [ ] Atualizar `DECISIONS.md` com Decisão #010
- [ ] Atualizar `PROGRESS.md` com sessão refactor
- [ ] Adicionar screenshots/wireframes (se possível)

---

## Testes

### Testes Unitários (Não implementar agora, documentar)

```typescript
// BaseConhecimentoCard.test.tsx
describe('BaseConhecimentoCard', () => {
  it('should highlight when selected', () => {});
  it('should call onSelect when clicked', () => {});
  it('should call onToggleActive when toggle clicked', () => {});
  it('should show badge with synapse count', () => {});
});
```

---

### Testes de Integração

**Cenário 1: Criar Base e Selecionar**
```
1. Usuário clica [+ ADD BASE]
2. Preenche nome "Políticas RH"
3. Clica "Criar Base"
4. THEN: Base aparece no carousel
5. THEN: Base é selecionada automaticamente
6. THEN: Mostra empty state de synapses abaixo
```

**Cenário 2: Trocar Base Selecionada**
```
1. DADO que tenho 3 bases (A, B, C)
2. E base A está selecionada (mostra synapses de A)
3. QUANDO clico em base B
4. THEN: Base B fica highlighted
5. THEN: Loading state aparece
6. THEN: Synapses de B aparecem na tabela
```

**Cenário 3: Webhook N8N Offline**
```
1. N8N está offline (timeout)
2. Usuário cria synapse
3. THEN: Synapse salva no banco ✅
4. THEN: Toast: "Synapse salva, mas processamento pode demorar"
5. THEN: Tabela atualiza com nova synapse
6. THEN: Status fica "draft" (n8n não processou)
```

---

### Checklist de Aceitação

- [ ] ✅ Layout master-detail exatamente como wireframe
- [ ] ✅ Scroll horizontal de cards funciona
- [ ] ✅ Card selecionado tem highlight visual
- [ ] ✅ Synapses aparecem abaixo quando base selecionada
- [ ] ✅ Empty state quando base sem synapses
- [ ] ✅ Criar base adiciona no carousel e seleciona
- [ ] ✅ Toggle base ativa/inativa funciona
- [ ] ✅ Criar/Editar/Deletar synapse funciona
- [ ] ✅ Toggle synapse ativa/desativa funciona
- [ ] ✅ Webhooks N8N são chamados (mock OK se offline)
- [ ] ✅ Error handling (toast quando webhook falha)
- [ ] ✅ TypeScript zero erros
- [ ] ✅ ESLint zero erros
- [ ] ✅ Build production passa

---

## Mock de Dados N8N

**Durante desenvolvimento, se N8N offline:**

Criar flag `N8N_MOCK=true` (similar ao `NEUROCORE_MOCK`):

```typescript
// lib/utils/n8n-webhooks.ts

const N8N_MOCK = process.env.N8N_MOCK === 'true';

export async function callN8nWebhook(endpoint: string, payload: any) {
  if (N8N_MOCK) {
    console.log('[N8N MOCK] Webhook chamado:', endpoint, payload);
    return { success: true, mock: true };
  }

  try {
    const response = await fetch(`${N8N_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    if (!response.ok) throw new Error(`N8N error: ${response.status}`);

    return { success: true };
  } catch (error) {
    console.error('[N8N ERROR]', endpoint, error);
    // NÃO lançar erro (não bloqueia CRUD)
    return { success: false, error };
  }
}
```

**Vantagens:**
- ✅ Desenvolvimento não depende de N8N
- ✅ Logs claros no console
- ✅ Fácil trocar para produção (uma variável)
- ✅ Não bloqueia CRUD se N8N falha

---

## Próximos Passos Após Implementação

1. **Executar Migração SQL** (se ainda não foi)
   - `migrations/base-conhecimento-hierarchy.sql`

2. **Configurar N8N Webhooks**
   - Criar workflows para cada endpoint
   - Testar com Postman/Insomnia
   - Trocar `N8N_MOCK=false`

3. **Supabase Realtime** (Future)
   - Atualizar badges de status em tempo real
   - Atualizar contador de synapses quando n8n processa

4. **Melhorias UX** (Future)
   - Indicadores de scroll no carousel (◄ ►)
   - Animações de transição ao trocar base
   - Skeleton loading ao invés de spinner
   - Drag & Drop para reordenar cards

---

## Referências

- [Wireframes ASCII](../../ASCII_WIREFRAMES.md)
- [DECISIONS.md](../../DECISIONS.md)
- [BASE_CONHECIMENTO_REFACTOR_PLAN.md](./BASE_CONHECIMENTO_REFACTOR_PLAN.md)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
- [Master-Detail Pattern](https://www.nngroup.com/articles/master-detail/)

---

**Pronto para implementar!** 🚀

**Estimativa Total:** 8-10 horas (4-5h componentes + 2-3h webhooks + 1-2h testes + 1h docs)
