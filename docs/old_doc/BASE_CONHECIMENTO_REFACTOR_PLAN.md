# Plano de Refatoração: Base de Conhecimento (Hierarquia)

## Índice
1. [Estado Atual vs Desejado](#estado-atual-vs-desejado)
2. [Opções de Implementação](#opções-de-implementação)
3. [Arquitetura Recomendada](#arquitetura-recomendada)
4. [Principais Desafios](#principais-desafios)
5. [Aplicação de SOLID](#aplicação-de-solid)
6. [Plano de Ação Detalhado](#plano-de-ação-detalhado)

---

## Estado Atual vs Desejado

### 🔴 Estado Atual (Implementado)

```
/knowledge-base
  └── Lista de SYNAPSES (direto)
      ├── Synapse 1 (título, descrição, status)
      ├── Synapse 2
      └── Synapse 3
```

**Problemas:**
- ❌ Sem hierarquia (bases → synapses)
- ❌ `baseConhecimentoId` hardcoded como UUID zerado
- ❌ Não alinha com schema do banco
- ❌ Não alinha com MVP descrito
- ❌ Usuário não pode organizar synapses em bases diferentes

---

### ✅ Estado Desejado (MVP Descrito)

```
/knowledge-base
  └── Lista de BASES DE CONHECIMENTO
      ├── Base 1: "Políticas de Devolução"
      │   ├── Synapse 1: "Prazos de Devolução"
      │   ├── Synapse 2: "Produtos Não Devolúveis"
      │   └── Synapse 3: "Como Iniciar Devolução"
      │
      └── Base 2: "Suporte Técnico"
          ├── Synapse 4: "Reset de Senha"
          └── Synapse 5: "Problemas de Login"
```

**Benefícios:**
- ✅ Organização clara (bases agrupam synapses relacionadas)
- ✅ Alinha com schema do banco (`base_conhecimentos` → `synapses`)
- ✅ Alinha com MVP descrito
- ✅ Escalável (fácil adicionar múltiplas bases)
- ✅ UX melhor (usuário navega hierarquia)

---

## Opções de Implementação

### Opção 1: Modal Aninhado (Recomendada para MVP)

**Estrutura:**
```
Página: Lista de Bases de Conhecimento (DataTable)
  ↓ Usuário clica em "Ver/Editar Base"
Modal: Detalhes da Base
  ├── Form: Nome, Descrição, NeuroCore Associado
  └── Tabela de Synapses Relacionadas (dentro do modal)
      ├── Synapse 1
      ├── Synapse 2
      └── [Botão: Adicionar Synapse] → Abre sub-modal
```

**Pros:**
✅ Mantém contexto (usuário vê base + synapses juntos)
✅ Menos navegação (tudo em um lugar)
✅ Alinha com MVP descrito
✅ Menor refactor (reutiliza componentes existentes)
✅ UX compacta (ideal para desktop)

**Contras:**
⚠️ Modal dentro de modal (complexidade UI)
⚠️ Pode ficar pesado se base tem muitas synapses (>20)
⚠️ Scroll dentro de modal (UX não ideal em mobile)

**Complexidade:** MÉDIA (5-7 horas)

---

### Opção 2: Navegação com Subrotas

**Estrutura:**
```
/knowledge-base
  └── Lista de Bases

/knowledge-base/[baseId]
  └── Detalhes da Base + Lista de Synapses
```

**Pros:**
✅ UX mais clean (cada nível em uma página)
✅ Escalável (suporta muitas synapses sem scroll infinito)
✅ URLs sharáveis (`/knowledge-base/uuid-da-base`)
✅ Breadcrumbs para navegação

**Contras:**
⚠️ Mais navegação (usuário precisa ir e voltar)
⚠️ Refactor maior (criar nova rota)
⚠️ Perde contexto ao navegar entre páginas
⚠️ Mais código (2 páginas ao invés de 1)

**Complexidade:** ALTA (10-14 horas)

---

### Opção 3: Accordion/Expansível (Alternativa Simples)

**Estrutura:**
```
Página: Lista de Bases (Accordion)
  ├── [Expandir] Base 1: Políticas
  │   └── Tabela de Synapses
  ├── [Expandir] Base 2: Suporte
  │   └── Tabela de Synapses
```

**Pros:**
✅ Simplicidade máxima
✅ Tudo em uma página (sem modals/rotas)
✅ Boa para poucos itens

**Contras:**
⚠️ Não alinha com MVP descrito (pede modal)
⚠️ Difícil editar base (form dentro de accordion?)
⚠️ UX confusa para CRUD de synapses
⚠️ Não escalável (muitas bases = scroll gigante)

**Complexidade:** BAIXA (3-5 horas) mas **NÃO recomendada** (diverge do MVP)

---

## Arquitetura Recomendada

### ✅ Opção 1: Modal Aninhado

**Razões:**
1. **Alinha com MVP descrito** - MVP pede modal com tabela interna
2. **Menor refactor** - Reutiliza componentes existentes (SynapseDialog, SynapsesTable)
3. **Contexto preservado** - Usuário vê base + synapses juntos
4. **Desktop-first** - Projeto foca em desktop (MVP descrito)

---

### Estrutura de Componentes (Hierarquia)

```
app/(dashboard)/knowledge-base/page.tsx (Server Component)
  └── <BaseConhecimentoTable> (Client Component)
      ├── Lista de bases (DataTable)
      ├── [Botão: Adicionar Base]
      └── <BaseConhecimentoDialog> (Modal principal)
          ├── Form: Nome, Descrição, NeuroCore (Select disabled)
          ├── <SynapsesTable> (Tabela aninhada - REUTILIZADA)
          │   ├── Lista de synapses da base
          │   └── [Botão: Adicionar Synapse]
          └── <SynapseDialog> (Sub-modal - REUTILIZADA)
              └── Form: Título, Conteúdo, Descrição, Status
```

**Reutilização:**
- ✅ `<SynapsesTable>` - Já existe, apenas filtra por `baseConhecimentoId`
- ✅ `<SynapseDialog>` - Já existe, funciona igual
- 🆕 `<BaseConhecimentoTable>` - Novo (lista de bases)
- 🆕 `<BaseConhecimentoDialog>` - Novo (modal de base com tabela interna)

---

## Principais Desafios

### Desafio 1: Modal Aninhado (Modal dentro de Modal)

**Problema:**
```
BaseConhecimentoDialog (z-index: 50)
  └── SynapseDialog (z-index: 50) ← Conflito!
```

**Solução:**
```typescript
// BaseConhecimentoDialog
<Dialog modal={true}>...</Dialog>

// SynapseDialog (quando aberto dentro de BaseConhecimentoDialog)
<Dialog
  modal={false} // Não cria backdrop duplo
  className="z-[60]" // z-index maior
>
  ...
</Dialog>
```

**Princípio SOLID:** Open/Closed
- `SynapseDialog` aberto para extensão (aceita prop `zIndex` ou `nested`)
- Fechado para modificação (não alterar comportamento padrão)

---

### Desafio 2: Estado Sincronizado (Base + Synapses)

**Problema:**
```
Usuário cria synapse → Precisa atualizar lista dentro do modal
Usuário deleta synapse → Precisa recarregar dados da base
```

**Opção A: Server Actions + Revalidação**
```typescript
// Após criar/editar/deletar synapse
await createSynapseAction(...);
router.refresh(); // Recarrega Server Component
// ❌ Fecha modal (perde contexto)
```

**Opção B: Estado Local + Callback**
```typescript
const [synapses, setSynapses] = useState(initialSynapses);

const handleSynapseCreated = (newSynapse: Synapse) => {
  setSynapses(prev => [...prev, newSynapse]);
};

// ✅ Não fecha modal, atualiza localmente
```

**Opção C: React Query / SWR (Over-engineering para MVP)**

**Recomendação:** **Opção B** (estado local + callback)
- Simplicidade (sem bibliotecas extras)
- UX melhor (não fecha modal)
- Alinhado com MVP (não over-engineer)

**Princípio SOLID:** Dependency Inversion
- `SynapseDialog` não depende de implementação específica
- Aceita callback genérico `onSynapseCreated(synapse: Synapse)`

---

### Desafio 3: Queries Complexas (Bases com Contagem de Synapses)

**Problema:**
Exibir na tabela de bases: "Quantidade de Synapses"

**Opção A: Query com JOIN (N+1 resolvido)**
```typescript
const { data } = await supabase
  .from('base_conhecimentos')
  .select(`
    *,
    synapses(count)
  `)
  .eq('tenant_id', tenantId);

// Resultado:
// { id: '...', name: 'Políticas', synapses: [{ count: 5 }] }
```

**Opção B: Duas queries separadas**
```typescript
const bases = await getBaseConhecimentos(tenantId);
const counts = await Promise.all(
  bases.map(base => getSynapsesCount(base.id))
);
// ❌ N+1 problem
```

**Recomendação:** **Opção A** (JOIN com count)
- Performance (1 query vs N queries)
- Supabase suporta nativamente

**Princípio SOLID:** Single Responsibility
- Query retorna dados completos
- Componente apenas renderiza

---

### Desafio 4: BaseConhecimentoId Hardcoded

**Estado Atual:**
```typescript
// app/(dashboard)/knowledge-base/page.tsx
const baseConhecimentoId = '00000000-0000-0000-0000-000000000000'; // ❌
```

**Problema:**
- Todas synapses criadas vão para base "zerada"
- Migração de dados necessária

**Solução 1: Migração de Dados (Recomendada)**
```sql
-- 1. Criar base default para cada tenant
INSERT INTO base_conhecimentos (id, tenant_id, name, neurocore_id, is_active)
SELECT
  gen_random_uuid(),
  id,
  'Base Padrão',
  neurocore_id,
  true
FROM tenants;

-- 2. Atualizar synapses existentes
UPDATE synapses s
SET base_conhecimento_id = (
  SELECT bc.id
  FROM base_conhecimentos bc
  WHERE bc.tenant_id = s.tenant_id
  LIMIT 1
)
WHERE base_conhecimento_id = '00000000-0000-0000-0000-000000000000';
```

**Solução 2: Criar Base On-the-Fly (Temporária)**
```typescript
// Se tenant não tem base, cria automaticamente
if (bases.length === 0) {
  const defaultBase = await createBaseConhecimento({
    name: 'Base Padrão',
    tenantId,
    neurocoreId: tenant.neurocore_id
  });
}
```

**Recomendação:** **Solução 1** (migração SQL)
- Dados consistentes
- Não cria bases duplicadas

---

### Desafio 5: NeuroCore Associado (Select Desabilitado)

**MVP Descrito:**
```
Campo "NeuroCore Associado" (Select) desabilitado
(exibir o nome do NeuroCore)
```

**Problema:**
- Base de conhecimento pertence a um NeuroCore
- Tenant tem um `neurocore_id` (relação 1:1)
- Select deve mostrar nome, mas não permitir edição

**Query:**
```typescript
const { data: base } = await supabase
  .from('base_conhecimentos')
  .select(`
    *,
    neurocores(id, name)
  `)
  .eq('id', baseId)
  .single();

// Resultado:
// {
//   id: '...',
//   name: 'Políticas',
//   neurocores: { id: '...', name: 'NeuroCore Principal' }
// }
```

**UI:**
```typescript
<Select disabled value={base.neurocore_id}>
  <SelectItem value={base.neurocore_id}>
    {base.neurocores.name}
  </SelectItem>
</Select>
```

**Princípio SOLID:** Interface Segregation
- Componente `Select` não força prop `onChange` quando disabled
- Aceita `value` + `disabled` sem callback

---

## Aplicação de SOLID

### 1. Single Responsibility Principle (SRP)

**Separação de Responsabilidades:**

✅ **BaseConhecimentoTable**
- Responsabilidade: Renderizar lista de bases
- NÃO gerencia: CRUD de synapses (delegado)

✅ **BaseConhecimentoDialog**
- Responsabilidade: Form de base + exibir synapses relacionadas
- NÃO gerencia: CRUD individual de synapse (delegado para SynapseDialog)

✅ **SynapsesTable** (reutilizada)
- Responsabilidade: Renderizar lista de synapses
- NÃO gerencia: Dados de base (recebe via props)

✅ **SynapseDialog** (reutilizada)
- Responsabilidade: CRUD de synapse individual
- NÃO gerencia: Contexto de base (recebe `baseConhecimentoId` via prop)

---

### 2. Open/Closed Principle (OCP)

**Componentes Abertos para Extensão:**

✅ **SynapseDialog**
```typescript
interface SynapseDialogProps {
  synapse?: Synapse;
  tenantId: string;
  baseConhecimentoId: string;
  mode?: 'create' | 'edit' | 'training'; // 🆕 Extensível
  onSuccess?: (synapse: Synapse) => void; // 🆕 Callback genérico
  // ...
}
```

- **Aberto:** Aceita novos modos (training, view-only)
- **Fechado:** Lógica interna não muda

✅ **SynapsesTable**
```typescript
interface SynapsesTableProps {
  synapses: Synapse[];
  tenantId: string;
  baseConhecimentoId: string;
  onSynapseChange?: () => void; // 🆕 Callback para refresh
  readOnly?: boolean; // 🆕 Modo leitura
}
```

- **Aberto:** Aceita callback de mudança, modo read-only
- **Fechado:** Renderização não muda

---

### 3. Liskov Substitution Principle (LSP)

**Componentes Substituíveis:**

✅ **SynapsesTable pode ser usada em múltiplos contextos:**
```typescript
// Contexto 1: Dentro de BaseConhecimentoDialog
<SynapsesTable synapses={baseSynapses} {...props} />

// Contexto 2: Standalone (página antiga - compatibilidade)
<SynapsesTable synapses={allSynapses} {...props} />

// Contexto 3: Neurocore (futuro)
<SynapsesTable synapses={synapsesUsed} readOnly {...props} />
```

- Comportamento consistente independente do contexto

---

### 4. Interface Segregation Principle (ISP)

**Interfaces Específicas (não forçar props desnecessários):**

❌ **Ruim:**
```typescript
interface BaseConhecimentoDialogProps {
  // Força props que podem não ser usados
  onDelete: () => void; // E se modo for "view-only"?
  onPublish: () => void; // E se não tiver permissão?
}
```

✅ **Bom:**
```typescript
interface BaseConhecimentoDialogProps {
  base?: BaseConhecimento;
  tenantId: string;
  onSuccess?: (base: BaseConhecimento) => void; // Callback genérico
  mode?: 'create' | 'edit' | 'view'; // Define comportamento
}

// Componente decide internamente se mostra botões delete/publish
```

---

### 5. Dependency Inversion Principle (DIP)

**Depender de Abstrações, Não de Implementações:**

✅ **Queries abstraídas em módulo separado:**
```typescript
// lib/queries/knowledge-base.ts
export async function getBaseConhecimentos(tenantId: string) { ... }
export async function getSynapsesByBase(baseId: string) { ... }

// Componente depende da abstração (função), não da implementação (Supabase)
```

✅ **Callbacks genéricos:**
```typescript
// ❌ Ruim: Componente depende de router.refresh()
const handleSave = () => {
  router.refresh(); // Acoplado ao Next.js
};

// ✅ Bom: Componente aceita callback genérico
const handleSave = (synapse: Synapse) => {
  onSuccess?.(synapse); // Quem usa decide o que fazer
};
```

---

## Plano de Ação Detalhado

### Sprint 1: Fundação (3-4h)

#### Task 1.1: Criar Types e Interfaces
- [ ] Type `BaseConhecimento` em `types/knowledge-base.ts`
- [ ] Type `BaseConhecimentoWithSynapses` (base + contagem)
- [ ] Atualizar `SynapseDialogProps` para aceitar callback `onSuccess`

#### Task 1.2: Criar Queries
- [ ] `lib/queries/knowledge-base.ts`:
  - `getBaseConhecimentos(tenantId)` - Lista bases com contagem
  - `getBaseConhecimento(baseId)` - Base individual com synapses
  - `createBaseConhecimento(data)` - Criar base
  - `updateBaseConhecimento(baseId, data)` - Atualizar base
  - `deleteBaseConhecimento(baseId)` - Deletar base

#### Task 1.3: Criar Server Actions
- [ ] `app/actions/base-conhecimento.ts`:
  - `createBaseConhecimentoAction`
  - `updateBaseConhecimentoAction`
  - `deleteBaseConhecimentoAction`

---

### Sprint 2: Componentes Principais (4-5h)

#### Task 2.1: BaseConhecimentoTable
- [ ] Criar `components/knowledge-base/base-conhecimento-table.tsx`
- [ ] DataTable com colunas: Nome, Descrição, NeuroCore, Qtd Synapses, Status
- [ ] Botões: "Adicionar Base", "Ver/Editar", "Inativar"
- [ ] Empty state

#### Task 2.2: BaseConhecimentoDialog
- [ ] Criar `components/knowledge-base/base-conhecimento-dialog.tsx`
- [ ] Form: Nome, Descrição
- [ ] Select NeuroCore (disabled, mostra nome)
- [ ] Seção: "Synapses Relacionadas" (tabela aninhada)
- [ ] Reutilizar `<SynapsesTable>` (filtrada por baseId)

#### Task 2.3: Refatorar SynapsesTable
- [ ] Adicionar prop `onSynapseChange?: () => void`
- [ ] Adicionar prop `readOnly?: boolean`
- [ ] Manter compatibilidade com uso atual

---

### Sprint 3: Integração (2-3h)

#### Task 3.1: Atualizar Página Principal
- [ ] Refatorar `app/(dashboard)/knowledge-base/page.tsx`
- [ ] Buscar bases ao invés de synapses
- [ ] Renderizar `<BaseConhecimentoTable>`

#### Task 3.2: Migração de Dados
- [ ] Criar SQL script para migrar synapses existentes
- [ ] Criar base default para cada tenant
- [ ] Atualizar `baseConhecimentoId` de synapses órfãs

#### Task 3.3: Modal Aninhado (z-index)
- [ ] Ajustar z-index de `SynapseDialog` quando nested
- [ ] Testar abertura/fechamento de modals

---

### Sprint 4: Refinamento (2h)

#### Task 4.1: Validações
- [ ] Não permitir deletar base com synapses ativas
- [ ] Confirmação de exclusão (input "confirmo deletar base")
- [ ] Validação: nome obrigatório (min 3 chars)

#### Task 4.2: UX
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Confirmações

---

### Sprint 5: Testes e Documentação (1h)

#### Task 5.1: Testes
- [ ] TypeScript type-check
- [ ] Build production
- [ ] Testes manuais (criar/editar/deletar base + synapses)

#### Task 5.2: Documentação
- [ ] Atualizar DECISIONS.md (Decisão #009)
- [ ] Atualizar PROGRESS.md

---

## Resumo: Pros e Contras por Abordagem

| Abordagem | Complexidade | Tempo | Alinha MVP | SOLID | Recomendada |
|-----------|--------------|-------|------------|-------|-------------|
| **Modal Aninhado** | Média | 12-15h | ✅ Sim | ✅ Sim | ✅ **SIM** |
| **Subrotas** | Alta | 16-20h | ⚠️ Parcial | ✅ Sim | ⚠️ Over-engineering |
| **Accordion** | Baixa | 6-8h | ❌ Não | ⚠️ Parcial | ❌ Não |

---

## Checklist de Validação (Antes de Começar)

- [ ] Confirmar que schema do banco tem `base_conhecimentos` (✅ tem)
- [ ] Confirmar relação `synapses.base_conhecimento_id → base_conhecimentos.id` (✅ tem)
- [ ] Confirmar que usuário aprova abordagem "Modal Aninhado"
- [ ] Confirmar que migração SQL é aceitável
- [ ] Confirmar prioridade vs outras features (Livechat, etc.)

---

**Pronto para implementar!** 🚀

Estimativa Total: **12-15 horas** (4 sprints)
