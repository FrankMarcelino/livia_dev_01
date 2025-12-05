# Plano de Refatoração: Meus Agentes IA - Dialog → Tabs (Master-Detail)

**Data:** 2025-12-05
**Objetivo:** Migrar interface de edição de agents de Dialog modal para Tabs (master-detail) na mesma página
**Escolha:** Opção A - Master-Detail com Tabs (shadcn/ui)

---

## 📋 Índice

1. [Análise da Situação Atual](#análise-da-situação-atual)
2. [Arquitetura Proposta](#arquitetura-proposta)
3. [Princípios SOLID Aplicados](#princípios-solid-aplicados)
4. [Plano de Execução (Sprints)](#plano-de-execução-sprints)
5. [Checklist de Implementação](#checklist-de-implementação)
6. [Testes](#testes)

---

## 🔍 Análise da Situação Atual

### Estrutura Atual (Dialog Modal)

```
app/(dashboard)/meus-agentes/page.tsx          ← Server Component (lista agents)
  └─> AgentsList                                ← Client Component wrapper
       └─> AgentCard                            ← Card individual
            └─> AgentEditDialog                 ← DIALOG MODAL (a remover)
                 └─> AgentEditForm              ← Form com React Hook Form
                      ├─> PersonalitySection    ← ❌ NÃO EXISTE (a criar)
                      ├─> LimitationsSection    ← ✅ Existe (215 linhas)
                      ├─> InstructionsSection   ← ✅ Existe (215 linhas)
                      ├─> RulesSection          ← ✅ Existe (215 linhas)
                      └─> OthersInstructionsSection ← ✅ Existe (215 linhas)
```

**Problema:**
- Dialog modal força scroll longo (todas sections empilhadas verticalmente)
- Pouca organização visual (difícil navegar entre seções)
- UX não ideal para formulário complexo com muitos campos

### Arquivos Atuais

**Componentes:**
- `components/agents/agents-list.tsx` - Wrapper client para lista
- `components/agents/agent-card.tsx` - Card com botão "Editar Configuração"
- `components/agents/agent-edit-dialog.tsx` - **DIALOG (a substituir)**
- `components/agents/agent-edit-form.tsx` - Form com React Hook Form

**Form Sections (Existentes):**
- `components/agents/form-sections/limitations-section.tsx` ✅
- `components/agents/form-sections/instructions-section.tsx` ✅
- `components/agents/form-sections/rules-section.tsx` ✅
- `components/agents/form-sections/others-instructions-section.tsx` ✅
- `components/agents/form-sections/personality-section.tsx` ❌ (a criar)

**Types e Validações:**
- `types/agents.ts` - Types completos (AgentWithPrompt, GuidelineStep, etc.) ✅
- `lib/validations/agentPromptValidation.ts` - Zod schemas completos ✅

---

## 🏗️ Arquitetura Proposta

### Nova Estrutura (Master-Detail com Tabs)

```
app/(dashboard)/meus-agentes/page.tsx          ← Server Component (lista agents)
  └─> AgentsList                                ← Client Component wrapper
       ├─> AgentCard[]                          ← Cards (clicar = selecionar)
       └─> AgentEditPanel                       ← 🆕 MASTER-DETAIL PANEL
            ├─> AgentEditHeader                 ← 🆕 Header com info + [× Fechar]
            └─> AgentEditTabs                   ← 🆕 Tabs Navigation
                 └─> AgentEditForm              ← Form com React Hook Form
                      ├─> PersonalitySection    ← 🆕 A criar
                      ├─> LimitationsSection    ← ✅ Reutilizar
                      ├─> InstructionsSection   ← ✅ Reutilizar
                      ├─> RulesSection          ← ✅ Reutilizar
                      └─> OthersInstructionsSection ← ✅ Reutilizar
```

### Layout Visual

```
┌───────────────────────────────────────────────────────────────────┐
│ Meus Agentes IA                                                   │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                         │
│  │Agent1│  │Agent2│  │Agent3│  │Agent4│  ← Scroll horizontal     │
│  │ATIVO │  │ATIVO │  │      │  │      │     (opcional)          │
│  └──────┘  └──────┘  └──────┘  └──────┘                         │
│     ↑ SELECIONADO                                                 │
│  ════════════════════════════════════════════════════════════    │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ 🤖 Agent Recepcionista                   [× Fechar Edição] │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │ Tabs: [Personalidade] [Limitações] [Instruções] ...        │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                                                              │ │
│  │  [Conteúdo da Tab Ativa]                                    │ │
│  │                                                              │ │
│  ├─────────────────────────────────────────────────────────────┤ │
│  │                           [Cancelar]  [Salvar Alterações]  │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

---

## ⚙️ Princípios SOLID Aplicados

### 1. Single Responsibility Principle (SRP)

**Cada componente tem UMA responsabilidade:**

| Componente | Responsabilidade Única |
|------------|----------------------|
| `AgentsList` | Orquestrar estado de seleção + renderizar lista e painel |
| `AgentCard` | Renderizar card + callback onClick para selecionar |
| `AgentEditPanel` | Container do painel de edição (layout + visibilidade) |
| `AgentEditHeader` | Header com título, badges, botão fechar |
| `AgentEditTabs` | Navegação de tabs + renderizar form |
| `AgentEditForm` | Gerenciar React Hook Form + integrar sections |
| `PersonalitySection` | Apenas campos de personalidade |
| `LimitationsSection` | Apenas campos de limitações |

**Anti-pattern evitado:**
❌ Um componente gigante que faz tudo (card + edição + tabs + form + validação)

### 2. Open/Closed Principle (OCP)

**Componentes abertos para extensão, fechados para modificação:**

```typescript
// AgentsList aceita callback para selecionar agent
<AgentsList
  agents={agents}
  onAgentSelect={(agent) => setSelectedAgent(agent)}
/>

// AgentEditPanel fechado para modificação, mas extensível via props
<AgentEditPanel
  agent={selectedAgent}
  onClose={() => setSelectedAgent(null)}
  onSave={(data) => handleSave(data)}
/>

// Se precisar adicionar novo tab no futuro:
// 1. Criar novo form-section component
// 2. Adicionar ao array de tabs
// 3. Não precisa modificar AgentEditPanel
```

### 3. Liskov Substitution Principle (LSP)

**Form sections são substituíveis:**

```typescript
// Todas as form sections seguem mesmo contrato:
interface FormSectionProps {
  form: UseFormReturn<AgentPromptFormData>;
}

// Qualquer section pode ser substituída por outra
// sem quebrar o funcionamento do AgentEditForm
```

### 4. Interface Segregation Principle (ISP)

**Props específicas por componente:**

```typescript
// AgentCard não precisa saber sobre edição
interface AgentCardProps {
  agent: AgentWithPrompt;
  isSelected?: boolean;
  onSelect: (agent: AgentWithPrompt) => void;
}

// AgentEditPanel não precisa saber sobre lista
interface AgentEditPanelProps {
  agent: AgentWithPrompt;
  onClose: () => void;
  onSave: (data: AgentPromptFormData) => void;
}
```

### 5. Dependency Inversion Principle (DIP)

**Componentes dependem de abstrações (callbacks), não de implementações:**

```typescript
// AgentCard não depende de "como" a seleção é gerenciada
// Apenas chama callback abstrato
<AgentCard
  agent={agent}
  onSelect={onAgentSelect} // ← Abstração
/>

// AgentEditPanel não depende de "como" os dados são salvos
// Apenas chama callback abstrato
<AgentEditPanel
  agent={agent}
  onSave={onSaveAgent} // ← Abstração
/>
```

---

## 🚀 Plano de Execução (Sprints)

### Sprint 1: Preparação e PersonalitySection (2h)

**Objetivo:** Criar PersonalitySection e instalar dependências

**Tarefas:**

1. **Instalar Tabs component do shadcn/ui**
   ```bash
   npx shadcn@latest add tabs
   ```

2. **Criar PersonalitySection**
   - Arquivo: `components/agents/form-sections/personality-section.tsx`
   - Campos:
     - `name` (Input)
     - `age` (Input)
     - `gender` (Select: male, female, neutral, other)
     - `objective` (Textarea)
     - `comunication` (Input)
     - `personality` (Textarea)
   - Props: `{ form: UseFormReturn<AgentPromptFormData> }`
   - Validação: Usar schema Zod existente
   - Padrão: Similar aos outros form-sections (labels, espaçamento, etc)

3. **Exportar PersonalitySection**
   - Atualizar `components/agents/form-sections/index.ts`

**Arquivos a criar:**
- `components/agents/form-sections/personality-section.tsx` (~100 linhas)

**Arquivos a modificar:**
- `components/agents/form-sections/index.ts` (adicionar export)

---

### Sprint 2: Criar Componentes Master-Detail (2h)

**Objetivo:** Criar AgentEditPanel, AgentEditHeader, AgentEditTabs

**Tarefas:**

1. **Criar AgentEditHeader**
   - Arquivo: `components/agents/agent-edit-header.tsx`
   - Props:
     ```typescript
     interface AgentEditHeaderProps {
       agent: AgentWithPrompt;
       onClose: () => void;
     }
     ```
   - Renderizar:
     - Título: "🤖 {agent.name}"
     - Badge: Template de origem (se houver)
     - Badge: Status (Ativo/Inativo)
     - Badge: Modo (Reativo/Proativo)
     - Botão: [× Fechar Edição]
   - Responsabilidade: Apenas header visual

2. **Criar AgentEditTabs**
   - Arquivo: `components/agents/agent-edit-tabs.tsx`
   - Props:
     ```typescript
     interface AgentEditTabsProps {
       agent: AgentWithPrompt;
       onSave: (data: AgentPromptFormData) => Promise<void>;
       onCancel: () => void;
     }
     ```
   - Integrar:
     - Tabs component do shadcn/ui
     - 6 tabs: Personalidade, Limitações, Instruções, Regras, Outras Instruções, Guideline
     - AgentEditForm dentro de TabsContent
     - Botões [Cancelar] [Salvar] no footer
   - Responsabilidade: Navegação de tabs + integrar form

3. **Criar AgentEditPanel**
   - Arquivo: `components/agents/agent-edit-panel.tsx`
   - Props:
     ```typescript
     interface AgentEditPanelProps {
       agent: AgentWithPrompt | null;
       onClose: () => void;
       onSave: (data: AgentPromptFormData) => Promise<void>;
     }
     ```
   - Renderizar:
     - Container com border, shadow
     - AgentEditHeader
     - AgentEditTabs
     - Animação de entrada/saída (opcional)
   - Responsabilidade: Container do painel (layout + visibilidade)

**Arquivos a criar:**
- `components/agents/agent-edit-header.tsx` (~80 linhas)
- `components/agents/agent-edit-tabs.tsx` (~150 linhas)
- `components/agents/agent-edit-panel.tsx` (~60 linhas)

---

### Sprint 3: Refatorar AgentCard e AgentsList (1h)

**Objetivo:** Adaptar AgentCard para seleção + AgentsList para master-detail

**Tarefas:**

1. **Refatorar AgentCard**
   - Modificar props:
     ```typescript
     interface AgentCardProps {
       agent: AgentWithPrompt;
       isSelected?: boolean;
       onSelect: (agent: AgentWithPrompt) => void;
     }
     ```
   - Remover estado interno `isEditOpen`
   - Remover `<AgentEditDialog>`
   - Substituir botão por callback:
     ```tsx
     <Button onClick={() => onSelect(agent)}>
       <Settings2 /> Editar Configuração
     </Button>
     ```
   - Adicionar visual de seleção:
     ```tsx
     <Card className={cn(
       "hover:shadow-md transition-shadow",
       isSelected && "ring-2 ring-primary"
     )}>
     ```

2. **Refatorar AgentsList**
   - Adicionar estado de seleção:
     ```typescript
     const [selectedAgent, setSelectedAgent] = useState<AgentWithPrompt | null>(null);
     ```
   - Renderizar:
     - Grid/scroll de AgentCards com callback `onSelect`
     - Separador visual (linha ou espaço)
     - AgentEditPanel (se selectedAgent não for null)
   - Callback de save:
     ```typescript
     const handleSave = async (data: AgentPromptFormData) => {
       // Chamar server action
       await updateAgentPromptAction(selectedAgent.id, data);
       // Fechar painel
       setSelectedAgent(null);
       // Refresh (router.refresh() ou revalidate)
     };
     ```

3. **Deletar AgentEditDialog**
   - Remover arquivo: `components/agents/agent-edit-dialog.tsx`
   - Remover import em `agent-card.tsx`

**Arquivos a modificar:**
- `components/agents/agent-card.tsx` (simplificar)
- `components/agents/agents-list.tsx` (adicionar estado de seleção)

**Arquivos a deletar:**
- `components/agents/agent-edit-dialog.tsx`

---

### Sprint 4: Atualizar AgentEditForm (1h)

**Objetivo:** Integrar PersonalitySection no form existente

**Tarefas:**

1. **Modificar AgentEditForm**
   - Arquivo: `components/agents/agent-edit-form.tsx`
   - Adicionar import:
     ```typescript
     import { PersonalitySection } from './form-sections/personality-section';
     ```
   - Props: Aceitar `activeTab` para condicional de renderização (opcional)
   - Remover lógica de scroll (tabs já gerenciam visibilidade)

2. **Atualizar AgentEditTabs para usar form**
   - Renderizar cada tab com form section específica:
     ```tsx
     <Tabs defaultValue="personality">
       <TabsList>
         <TabsTrigger value="personality">Personalidade</TabsTrigger>
         <TabsTrigger value="limitations">Limitações</TabsTrigger>
         {/* ... */}
       </TabsList>

       <TabsContent value="personality">
         <PersonalitySection form={form} />
       </TabsContent>

       <TabsContent value="limitations">
         <LimitationsSection form={form} />
       </TabsContent>

       {/* ... */}
     </Tabs>
     ```

**Arquivos a modificar:**
- `components/agents/agent-edit-form.tsx` (simplificar)
- `components/agents/agent-edit-tabs.tsx` (integrar form sections)

---

### Sprint 5: Testes e Ajustes Finais (1h)

**Objetivo:** Testar build, type-check, e ajustes de UX

**Tarefas:**

1. **Type-check**
   ```bash
   npm run type-check
   ```
   - Corrigir erros de tipos (se houver)

2. **Build de produção**
   ```bash
   npm run build
   ```
   - Corrigir erros de build (se houver)

3. **Testes manuais (se ambiente dev disponível)**
   - Clicar em "Editar Configuração" → Painel abre
   - Navegar entre tabs → Conteúdo muda
   - Preencher campos → Validação funciona
   - Clicar "Cancelar" → Painel fecha sem salvar
   - Clicar "Salvar" → Dados salvos + painel fecha
   - Clicar "× Fechar" → Painel fecha sem salvar

4. **Ajustes de espaçamento e layout**
   - Verificar responsividade (mobile/tablet/desktop)
   - Ajustar padding/margin se necessário
   - Verificar overflow/scroll

**Checklist:**
- [ ] Type-check passa sem erros
- [ ] Build passa sem erros
- [ ] Navegação entre tabs funciona
- [ ] Formulário valida corretamente
- [ ] Save persiste dados no banco
- [ ] Cancel descarta alterações
- [ ] Fechar painel funciona

---

## ✅ Checklist de Implementação

### Fase 1: Preparação
- [ ] Instalar Tabs component (`npx shadcn@latest add tabs`)
- [ ] Criar PersonalitySection (~100 linhas)
- [ ] Exportar PersonalitySection em index.ts

### Fase 2: Componentes Master-Detail
- [ ] Criar AgentEditHeader (~80 linhas)
- [ ] Criar AgentEditTabs (~150 linhas)
- [ ] Criar AgentEditPanel (~60 linhas)

### Fase 3: Refatoração
- [ ] Refatorar AgentCard (remover dialog, adicionar callback)
- [ ] Refatorar AgentsList (adicionar estado de seleção + painel)
- [ ] Deletar AgentEditDialog

### Fase 4: Integração
- [ ] Atualizar AgentEditForm (adicionar PersonalitySection)
- [ ] Integrar form sections nas tabs

### Fase 5: Testes
- [ ] Type-check (`npm run type-check`)
- [ ] Build (`npm run build`)
- [ ] Testes manuais (se ambiente disponível)
- [ ] Ajustes finais de UX

---

## 🧪 Testes

### Type-check
```bash
npm run type-check
```
**Expectativa:** Zero erros

### Build
```bash
npm run build
```
**Expectativa:** Build passa sem erros, rota `/meus-agentes` compilada com sucesso

### Testes Manuais (Opcional)

**Cenário 1: Abrir painel de edição**
1. Acessar `/meus-agentes`
2. Clicar em "Editar Configuração" em qualquer agent card
3. ✅ Painel abre abaixo dos cards
4. ✅ Header mostra nome do agent + badges
5. ✅ Tab "Personalidade" está ativa por padrão

**Cenário 2: Navegar entre tabs**
1. Com painel aberto, clicar em tab "Limitações"
2. ✅ Conteúdo muda para LimitationsSection
3. ✅ Scroll reseta para topo do conteúdo
4. Clicar em outras tabs
5. ✅ Todas tabs funcionam corretamente

**Cenário 3: Salvar alterações**
1. Editar campo "Nome" na tab Personalidade
2. Clicar em "Salvar Alterações"
3. ✅ Loading state aparece
4. ✅ Dados salvos no banco
5. ✅ Painel fecha
6. ✅ Card atualiza com novos dados

**Cenário 4: Cancelar alterações**
1. Editar qualquer campo
2. Clicar em "Cancelar"
3. ✅ Painel fecha sem salvar
4. ✅ Dados não foram alterados

**Cenário 5: Fechar painel**
1. Editar qualquer campo
2. Clicar em "× Fechar Edição"
3. ✅ Painel fecha sem salvar
4. ✅ Dados não foram alterados

---

## 📊 Métricas Estimadas

| Métrica | Antes | Depois |
|---------|-------|--------|
| **Componentes** | 5 (Dialog + Form + 4 sections) | 8 (Panel + Header + Tabs + Form + 5 sections) |
| **Linhas de código (novos)** | - | ~490 linhas |
| **Arquivos criados** | - | 4 arquivos |
| **Arquivos modificados** | - | 3 arquivos |
| **Arquivos deletados** | - | 1 arquivo |
| **Tempo estimado** | - | 6-7 horas |
| **UX de navegação** | ⚠️ Scroll longo | ✅ Tabs organizadas |
| **Espaço vertical** | ⚠️ Muitas sections empilhadas | ✅ Uma tab por vez |
| **Context switching** | ❌ Abre modal (perde contexto) | ✅ Expande painel (mantém contexto) |

---

## 🚧 Considerações de Implementação

### Over-engineering (O que NÃO fazer)

❌ **Não fazer:**
- Sistema de navegação com history/back/forward entre tabs
- Animações complexas de transição
- Virtualization de tabs
- Lazy loading de form sections
- Estado global (Redux/Zustand) para formulário
- Websockets para real-time sync
- Undo/redo system

✅ **Fazer:**
- Estado local simples com `useState`
- React Hook Form para formulário
- Callbacks para comunicação entre componentes
- Tabs padrão do shadcn/ui (sem customização excessiva)
- Validação com Zod (já existente)

### Padrão do Projeto

**Manter consistência com:**
- Base de Conhecimento (master-detail similar)
- Livechat (layout de painéis)
- shadcn/ui components (sem customizações pesadas)
- React Hook Form (padrão de formulários)
- Server Actions (padrão de mutations)

---

## 📝 Decisão Arquitetural

**Decisão:** Migrar de Dialog modal para Tabs (master-detail) na mesma página

**Motivo:**
- UX mais fluida (sem reload de página)
- Melhor organização visual (tabs separadas)
- Contexto mantido (vê os cards acima)
- Similar ao layout de Base de Conhecimento
- Menos scroll vertical

**Trade-offs:**
- **Mais complexidade:** +3 componentes novos
- **VS**
- **Melhor UX:** Navegação por tabs, menos scroll
- **Escolha:** UX vence (MVP em 90%, priorizar experiência do usuário)

**Alternativas consideradas:**
1. ❌ Dialog modal (atual) - UX ruim para formulário complexo
2. ✅ **Master-Detail na mesma página** - ESCOLHIDA
3. ❌ Página separada com rota dinâmica - Mais complexo, perde contexto visual

---

## 🎯 Próximos Passos (Pós-Refatoração)

1. **Implementar save functionality** (Server Action já existe?)
2. **Implementar RLS policies** para agents/agent_prompts
3. **Adicionar indicadores de "configuração personalizada vs base"**
4. **Adicionar botão "Resetar para Padrão"** (copiar da configuração base)
5. **Adicionar confirmação antes de fechar com alterações não salvas**

---

**Criado por:** Claude Code
**Data:** 2025-12-05
**Status:** ✅ Pronto para implementação
