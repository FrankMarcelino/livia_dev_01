# Planejamento de Melhorias - Meus Agentes IA

## 📋 Visão Geral

Este documento detalha o planejamento para 4 melhorias na feature "Meus Agentes IA", com análise de impacto, prós, contras e desafios técnicos de cada modificação.

---

## ✅ Validação de Qualidade de Código

**OBRIGATÓRIO:** A cada implementação concluída, execute os seguintes comandos para garantir a qualidade do código:

### 1. ESLint (Linting)
```bash
npm run lint
```
**O que valida:**
- Padrões de código (code style)
- Erros comuns de JavaScript/TypeScript
- Regras específicas do Next.js
- Boas práticas do React

**Expectativa:** Nenhum erro (0 errors). Warnings são aceitáveis mas devem ser revisados.

---

### 2. TypeScript (Type Checking)
```bash
npm run type-check
# ou
npx tsc --noEmit
```
**O que valida:**
- Tipos corretos em todas as variáveis
- Interfaces e tipos bem definidos
- Compatibilidade de props entre componentes
- Erros de tipo em tempo de compilação

**Expectativa:** 0 erros de tipo. Código 100% type-safe.

---

### 3. Build de Produção
```bash
npm run build
```
**O que valida:**
- Código compila sem erros
- Nenhum import circular
- Server Components vs Client Components corretos
- Tamanho do bundle está adequado
- Sem warnings críticos

**Expectativa:** Build concluído com sucesso. Sem erros de compilação.

---

### 4. Execução Local (Smoke Test)
```bash
npm run dev
```
**O que validar manualmente:**
- Aplicação inicia sem crashes
- Página "Meus Agentes" carrega corretamente
- Funcionalidade implementada funciona como esperado
- Não há erros no console do navegador
- Não há erros no terminal do dev server

---

### 📋 Checklist de Validação (Obrigatório após cada melhoria)

Após implementar CADA melhoria, marque:

- [ ] ✅ `npm run lint` - 0 errors
- [ ] ✅ `npm run type-check` - 0 type errors
- [ ] ✅ `npm run build` - Build successful
- [ ] ✅ `npm run dev` - App runs without crashes
- [ ] ✅ Teste manual da funcionalidade - Works as expected
- [ ] ✅ Nenhum erro no console do navegador
- [ ] ✅ Nenhum erro no terminal do servidor

**Se qualquer validação falhar, NÃO prossiga para a próxima melhoria. Corrija os erros primeiro.**

---

## 🎯 Melhorias Propostas

### 1. Toast de Sucesso sem Fechar Painel (Prioridade: Alta, Complexidade: Baixa)
### 2. Campo "Estilo de Comunicação" Multiline (Prioridade: Alta, Complexidade: Baixa)
### 3. Espaçamento Lateral Esquerdo (Prioridade: Média, Complexidade: Baixa)
### 4. Drag and Drop para Prompts (Prioridade: Alta, Complexidade: Alta)

---

## 1️⃣ Toast de Sucesso sem Fechar Painel

### 📝 Descrição do Problema Atual

**Comportamento Atual:**
```typescript
// agent-edit-panel.tsx
const handleSuccess = () => {
  onSuccess?.();  // Chama callback do pai
  onClose();      // ❌ FECHA O PAINEL imediatamente
};
```

**Fluxo Problemático:**
1. Usuário clica em "Salvar Alterações"
2. Toast de sucesso aparece
3. Painel fecha automaticamente
4. Usuário perde o contexto de edição
5. Para continuar editando, precisa:
   - Selecionar o card do agent novamente
   - Navegar para a aba correta
   - Localizar o campo que estava editando

**Impacto no UX:**
- Interrupção constante do fluxo de trabalho
- Frustração ao fazer múltiplas edições
- Perda de produtividade

---

### ✅ Solução Proposta

**Novo Comportamento:**
```typescript
// agent-edit-panel.tsx
const handleSuccess = () => {
  onSuccess?.();  // Refresh dos dados
  // ✅ NÃO fecha mais o painel
  toast.success('Configuração atualizada com sucesso!');
};
```

**Novo Fluxo:**
1. Usuário clica em "Salvar Alterações"
2. Toast de sucesso aparece
3. Painel permanece aberto
4. Dados são atualizados (router.refresh)
5. Usuário pode continuar editando

**Manter Botões de Fechamento Manual:**
- Botão "X" no header (mantém)
- Botão "Cancelar" no footer (mantém)
- Clicar fora do painel (opcional - pode adicionar)

---

### ⚖️ Prós e Contras

#### ✅ PRÓS

1. **Continuidade de Trabalho**
   - Usuário não perde o contexto
   - Pode fazer múltiplas edições sequenciais
   - Reduz cliques necessários

2. **Feedback Claro**
   - Toast confirma que salvou
   - Usuário decide quando fechar
   - Melhor controle do fluxo

3. **Produtividade**
   - Ajustes incrementais mais rápidos
   - Menos navegação repetitiva
   - Melhor experiência em edições longas

4. **Padrão de Mercado**
   - Gmail mantém email aberto após salvar rascunho
   - Notion mantém página aberta após editar
   - Trello mantém card aberto após salvar

#### ❌ CONTRAS

1. **Mudança de Comportamento**
   - Usuários acostumados com o fechamento automático podem estranhar
   - Necessário comunicar a mudança

2. **Memória/Performance (mínimo)**
   - Painel fica aberto ocupando memória
   - Impacto negligenciável em aplicações modernas

3. **Possível Confusão Inicial**
   - Alguns usuários podem não perceber que salvou
   - Mitigado com toast bem visível

---

### 🛠️ Desafios Técnicos

#### Desafio 1: Sincronização de Dados
**Problema:** Após salvar, os dados são revalidados via `router.refresh()`, mas o formulário pode não refletir os novos valores imediatamente.

**Solução:**
```typescript
async function onSubmit(data: AgentPromptFormData) {
  setIsSubmitting(true);

  try {
    const result = await updateAgentPromptAction(agent.id, data);

    if (result.success) {
      toast.success('Configuração atualizada com sucesso!');
      onSuccess?.(); // Refresh dos dados

      // ✅ Reset do form com novos valores
      form.reset(data); // Marca como "pristine" mas mantém valores
    } else {
      toast.error(result.error || 'Erro ao atualizar configuração');
    }
  } catch (error) {
    toast.error('Erro inesperado ao atualizar');
  } finally {
    setIsSubmitting(false);
  }
}
```

#### Desafio 2: Estado de "Não Salvo"
**Problema:** Como indicar que há mudanças não salvas?

**Solução:**
- React Hook Form já controla `isDirty` e `isValid`
- Pode adicionar badge "Não salvo" no header quando `isDirty`
- Confirmação antes de fechar se houver mudanças não salvas

```typescript
const handleClose = () => {
  if (form.formState.isDirty) {
    if (confirm('Há alterações não salvas. Deseja realmente fechar?')) {
      onClose();
    }
  } else {
    onClose();
  }
};
```

#### Desafio 3: Refresh Otimista vs Real
**Problema:** `router.refresh()` pode demorar, causando inconsistência visual.

**Solução:**
- Usar Optimistic Updates (atualizar UI antes da resposta)
- Ou manter loading state até refresh completar
- React 19/Next.js 15 tem suporte nativo para transitions

---

### 📦 Arquivos Afetados

```
components/agents/
├── agent-edit-panel.tsx       ⚠️ MODIFICAR
├── agent-edit-tabs.tsx        ⚠️ MODIFICAR
├── agents-list.tsx            ⚠️ MODIFICAR (opcional)
└── agent-edit-header.tsx      ⚠️ MODIFICAR (adicionar badge "Não salvo")
```

---

### 🎬 Implementação Passo a Passo

1. **Remover `onClose()` do `handleSuccess`**
   - Arquivo: `agent-edit-panel.tsx`
   - Manter apenas `onSuccess?.()`

2. **Adicionar `form.reset(data)` após salvar**
   - Arquivo: `agent-edit-tabs.tsx`
   - Marcar form como pristine sem perder valores

3. **Adicionar confirmação ao fechar com mudanças não salvas**
   - Arquivo: `agent-edit-panel.tsx`
   - Usar `form.formState.isDirty`

4. **(Opcional) Badge "Não salvo" no header**
   - Arquivo: `agent-edit-header.tsx`
   - Mostrar quando `isDirty === true`

5. **Testar fluxo completo**
   - Editar → Salvar → Continuar editando
   - Editar → Cancelar → Confirmar descarte
   - Editar → Fechar (X) → Confirmar descarte

6. **Validar qualidade de código**
   ```bash
   npm run lint          # Verificar code style
   npm run type-check    # Verificar tipos TypeScript
   npm run build         # Verificar build de produção
   ```

---

## 2️⃣ Campo "Estilo de Comunicação" Multiline

### 📝 Descrição do Problema Atual

**Implementação Atual:**
```tsx
// personality-section.tsx
<Input
  id="comunication"
  placeholder="Ex: Amigável, formal, descontraído"
  {...form.register('comunication')}
/>
```

**Limitações:**
- Input de uma única linha
- Não aceita quebras de linha
- Espaço insuficiente para descrições detalhadas
- Dificulta descrever estilos de comunicação complexos

**Exemplo de Caso Real:**
```
❌ Input atual (trunca):
"Tom amigável e profissional, usa emojis moderadamente, evita jargões..."

✅ Textarea ideal:
"Tom amigável e profissional
- Usa emojis moderadamente
- Evita jargões técnicos
- Adapta linguagem ao contexto
- Formal em situações de reclamação"
```

---

### ✅ Solução Proposta

**Nova Implementação:**
```tsx
// personality-section.tsx
<Textarea
  id="comunication"
  placeholder="Ex: Amigável, formal, descontraído"
  rows={4}
  {...form.register('comunication')}
  className="resize-y min-h-[100px]"
/>
```

**Características:**
- 4 linhas visíveis por padrão
- Redimensionável verticalmente (`resize-y`)
- Altura mínima de 100px
- Aceita quebras de linha
- Mesma API do Input (compatível com React Hook Form)

---

### ⚖️ Prós e Contras

#### ✅ PRÓS

1. **Mais Espaço para Descrição**
   - Permite descrições detalhadas
   - Suporta listas e formatação visual
   - Melhor legibilidade

2. **Flexibilidade**
   - Usuário pode redimensionar conforme necessidade
   - Adapta-se a diferentes níveis de detalhe

3. **Consistência com Outros Campos**
   - "Objetivo" já usa Textarea (3 linhas)
   - "Traços de Personalidade" já usa Textarea (3 linhas)
   - Mantém padrão visual da seção

4. **UX Melhorada**
   - Indica visualmente que aceita mais texto
   - Não precisa scroll horizontal
   - Fácil revisão do conteúdo

#### ❌ CONTRAS

1. **Ocupa Mais Espaço Vertical**
   - Pode aumentar scroll da página
   - Mitigado: é apenas 1 campo de vários

2. **Possível Sobre-Engenharia**
   - Talvez usuários não precisem de tanto espaço
   - Contra-argumento: Melhor sobrar espaço que faltar

3. **Mudança Visual**
   - Layout da seção fica ligeiramente diferente
   - Impacto: mínimo, melhora consistência

---

### 🛠️ Desafios Técnicos

#### Desafio 1: Validação de Tamanho
**Problema:** Textarea permite texto ilimitado, pode quebrar layout ou banco de dados.

**Solução:**
```typescript
// validation/agent-prompt-schema.ts
comunication: z.string()
  .max(500, 'Estilo de comunicação muito longo (máx. 500 caracteres)')
  .nullable()
  .optional()
```

**Adicionar contador de caracteres:**
```tsx
<div className="space-y-2 md:col-span-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="comunication">Estilo de Comunicação</Label>
    <span className="text-xs text-muted-foreground">
      {form.watch('comunication')?.length || 0}/500
    </span>
  </div>
  <Textarea
    id="comunication"
    placeholder="Descreva o estilo de comunicação do agent..."
    rows={4}
    maxLength={500}
    {...form.register('comunication')}
    className="resize-y min-h-[100px]"
  />
</div>
```

#### Desafio 2: Compatibilidade com Banco de Dados
**Problema:** Banco aceita `\n` (quebras de linha)?

**Solução:**
- PostgreSQL/Supabase aceita normalmente `\n` em campos TEXT
- Já testado em outros campos (objetivo, traços)
- Nenhum problema esperado

#### Desafio 3: Renderização no Prompt Final
**Problema:** Como as quebras de linha são renderizadas quando enviadas para a IA?

**Solução:**
- Quebras de linha são preservadas em strings
- IA processa normalmente (GPT, Claude, etc.)
- Se necessário formatar, fazer no momento de montar o prompt:
  ```typescript
  const formattedStyle = comunication.replace(/\n/g, ' ');
  ```

---

### 📦 Arquivos Afetados

```
components/agents/form-sections/
└── personality-section.tsx    ⚠️ MODIFICAR

lib/validation/
└── agent-prompt-schema.ts     ⚠️ MODIFICAR (adicionar maxLength)

components/ui/
└── textarea.tsx               ✅ JÁ EXISTE (shadcn)
```

---

### 🎬 Implementação Passo a Passo

1. **Substituir `<Input>` por `<Textarea>`**
   - Arquivo: `personality-section.tsx`
   - Adicionar `rows={4}` e `className="resize-y min-h-[100px]"`

2. **Adicionar contador de caracteres**
   - Usar `form.watch('comunication')`
   - Mostrar "X/500" no canto superior direito

3. **Atualizar validação Zod**
   - Arquivo: `agent-prompt-schema.ts`
   - Adicionar `.max(500)`

4. **Atualizar placeholder**
   - Texto mais descritivo para indicar possibilidade de múltiplas linhas
   - Ex: "Descreva o estilo de comunicação do agent (pode usar múltiplas linhas)"

5. **Testar com dados longos**
   - Texto com quebras de linha
   - Texto próximo ao limite (500 chars)
   - Salvar e verificar persistência

6. **Validar qualidade de código**
   ```bash
   npm run lint          # Verificar code style
   npm run type-check    # Verificar tipos TypeScript
   npm run build         # Verificar build de produção
   ```

---

## 3️⃣ Espaçamento Lateral Esquerdo

### 📝 Descrição do Problema Atual

**Situação Atual:**
```tsx
// app/(dashboard)/meus-agentes/page.tsx
<div className="container mx-auto py-6 space-y-6">
  {/* Conteúdo cola no sidebar */}
</div>
```

**Problema Visual:**
- Conteúdo da página encosta no sidebar
- Falta "respiro" visual
- Layout claustrofóbico
- Dificulta leitura e navegação

**Análise de Espaçamento Atual:**
- Sidebar largura: `16rem` (256px) expandido, `3rem` (48px) colapsado
- Conteúdo: `container mx-auto` (centralizado)
- Gap: Nenhum padding explícito entre sidebar e conteúdo

---

### ✅ Solução Proposta

**Opção 1: Adicionar padding no SidebarInset (Recomendada)**
```tsx
// app/(dashboard)/layout.tsx
<SidebarInset className="flex flex-col w-full h-screen overflow-x-hidden pl-4 md:pl-6">
  {/* Conteúdo com respiro */}
</SidebarInset>
```

**Opção 2: Adicionar padding no container das páginas**
```tsx
// app/(dashboard)/meus-agentes/page.tsx
<div className="container mx-auto py-6 px-4 md:px-6 space-y-6">
  {/* Conteúdo com respiro */}
</div>
```

**Opção 3: Ajustar gap no SidebarProvider**
```tsx
// app/(dashboard)/layout.tsx
<SidebarProvider>
  <div className="flex h-screen w-full gap-4"> {/* Adicionar gap */}
    <AppSidebar />
    <SidebarInset>...</SidebarInset>
  </div>
</SidebarProvider>
```

---

### ⚖️ Prós e Contras de Cada Opção

#### OPÇÃO 1: Padding no SidebarInset

##### ✅ PRÓS
- Afeta TODAS as páginas do dashboard uniformemente
- Solução centralizada (um único lugar)
- Responsivo (`pl-4 md:pl-6`)
- Não quebra nenhum layout existente

##### ❌ CONTRAS
- Pode afetar páginas que não precisam do padding
- Menos flexibilidade por página

---

#### OPÇÃO 2: Padding no container de cada página

##### ✅ PRÓS
- Flexibilidade total por página
- Não afeta outras páginas
- Controle granular

##### ❌ CONTRAS
- Precisa aplicar em TODAS as páginas manualmente
- Inconsistência se esquecer em alguma página
- Manutenção descentralizada

---

#### OPÇÃO 3: Gap no container do Sidebar

##### ✅ PRÓS
- Solução mais "correta" semanticamente (gap entre elementos)
- Afeta uniformemente
- Fácil de ajustar

##### ❌ CONTRAS
- Pode afetar estrutura do shadcn/ui sidebar
- Menos controle responsivo
- Gap afeta ambos os lados (direita também)

---

### 🏆 Recomendação: **OPÇÃO 1** (Padding no SidebarInset)

**Justificativa:**
- Centralizado e uniforme
- Responsivo nativo
- Não quebra outras páginas
- Fácil de ajustar se necessário
- Segue princípio DRY

---

### 🛠️ Desafios Técnicos

#### Desafio 1: Responsividade
**Problema:** Sidebar colapsa em mobile, padding pode sobrar espaço.

**Solução:**
```tsx
<SidebarInset className="
  flex flex-col w-full h-screen overflow-x-hidden
  pl-2 sm:pl-4 md:pl-6 lg:pl-8
">
```

**Breakpoints:**
- Mobile (< 640px): `pl-2` (8px)
- Tablet (640-768px): `pl-4` (16px)
- Desktop (768-1024px): `pl-6` (24px)
- Large (> 1024px): `pl-8` (32px)

#### Desafio 2: Sidebar Colapsado
**Problema:** Quando sidebar está colapsado (3rem), padding pode ser excessivo.

**Solução:**
- Manter padding fixo independente do estado
- Sidebar colapsado já deixa mais espaço horizontal
- Padding de 16-24px é padrão de mercado

#### Desafio 3: Telas Muito Largas
**Problema:** Em monitores 4K, conteúdo pode ficar muito afastado do sidebar.

**Solução:**
```tsx
<SidebarInset className="
  flex flex-col w-full h-screen overflow-x-hidden
  pl-4 md:pl-6 xl:pl-8
  max-w-[1920px] {/* Limita largura máxima */}
">
```

---

### 📦 Arquivos Afetados

```
app/(dashboard)/
└── layout.tsx                 ⚠️ MODIFICAR (adicionar padding)

components/layout/
└── app-sidebar.tsx            ℹ️ ANALISAR (verificar impacto)
```

---

### 🎬 Implementação Passo a Passo

1. **Adicionar padding responsivo no SidebarInset**
   - Arquivo: `app/(dashboard)/layout.tsx`
   - Adicionar `pl-4 md:pl-6` ao className

2. **Testar em diferentes resoluções**
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1440px)
   - Large (1920px)

3. **Testar com sidebar expandido e colapsado**
   - Verificar espaçamento em ambos os estados
   - Ajustar se necessário

4. **Validar em todas as páginas do dashboard**
   - /meus-agentes
   - /contacts
   - /conversations
   - Outras páginas

5. **Ajustar se houver quebras de layout**
   - Verificar se alguma página específica precisa de ajuste
   - Adicionar override com `-ml-X` se necessário

6. **Validar qualidade de código**
   ```bash
   npm run lint          # Verificar code style
   npm run type-check    # Verificar tipos TypeScript
   npm run build         # Verificar build de produção
   ```

---

## 4️⃣ Drag and Drop para Prompts e Sub_prompts

### 📝 Descrição do Problema Atual

**Estrutura Atual:**
```typescript
type GuidelineStep = {
  title: string;
  type: 'rank' | 'markdown';
  active: boolean;
  sub: GuidelineSubInstruction[];
};

type GuidelineSubInstruction = {
  content: string;
  active: boolean;
};
```

**5 Campos JSONB que usam essa estrutura:**
1. `limitations` - Limitações
2. `instructions` - Instruções
3. `guide_line` - Guideline/Roteiro
4. `rules` - Regras
5. `others_instructions` - Outras Instruções

**Problema:**
- Ordem dos items é fixa (ordem do array)
- Para reordenar, usuário precisa:
  1. Copiar conteúdo do item
  2. Deletar item
  3. Criar novo item na posição desejada
  4. Colar conteúdo
- Processo manual, lento e propenso a erros
- Sem controle visual da hierarquia

---

### ✅ Solução Proposta

**Implementar Drag and Drop com biblioteca especializada**

**Biblioteca Recomendada: @dnd-kit** (mais moderna e acessível)

**Características:**
- Drag and Drop para reordenar Steps (prompts principais)
- Drag and Drop para reordenar Sub-instruções dentro de cada Step
- Feedback visual durante arraste
- Acessível (keyboard navigation)
- Performático (virtual lists se necessário)
- Compatível com React 18+

**Fluxo Visual:**
```
┌─────────────────────────────────────┐
│ ⋮⋮ [1] Limitação Principal         │ ← Arraste aqui
│    ▼ Sub-instruções:                │
│    • ⋮⋮ Sub 1                       │ ← Arraste sub-items
│    • ⋮⋮ Sub 2                       │
├─────────────────────────────────────┤
│ ⋮⋮ [2] Outra Limitação              │
│    ▼ Sub-instruções:                │
│    • ⋮⋮ Sub A                       │
│    • ⋮⋮ Sub B                       │
└─────────────────────────────────────┘
```

---

### 🎨 Bibliotecas Comparadas

#### 1. @dnd-kit (RECOMENDADA)

**Prós:**
- ✅ Moderna (criada em 2021, mantida ativamente)
- ✅ Acessível (WCAG 2.1 AA)
- ✅ Performática (usa transform em vez de posição)
- ✅ TypeScript nativo
- ✅ Modular (usa apenas o que precisa)
- ✅ 0 dependências
- ✅ Sortable lists nativos
- ✅ Nested drag and drop
- ✅ Touch support (mobile)
- ✅ 18.5k stars no GitHub

**Contras:**
- ❌ Curva de aprendizado média
- ❌ API mais verbosa que react-beautiful-dnd
- ❌ Precisa configurar sensors manualmente

**Bundle Size:** ~40KB minified

---

#### 2. react-beautiful-dnd (Atlassian)

**Prós:**
- ✅ Muito popular (32k stars)
- ✅ API simples e intuitiva
- ✅ Animações suaves out-of-the-box
- ✅ Boa documentação

**Contras:**
- ❌ NÃO MANTIDO (último release 2021)
- ❌ Problemas com React 18+ Strict Mode
- ❌ Não suporta React 19
- ❌ Bundle maior (~50KB)
- ❌ Não recebe updates de segurança

**Bundle Size:** ~50KB minified

---

#### 3. react-dnd (Backend HTML5)

**Prós:**
- ✅ Muito flexível
- ✅ Suporta múltiplos backends (HTML5, Touch, Test)
- ✅ Granular control

**Contras:**
- ❌ API complexa (HOCs, hooks, decorators)
- ❌ Curva de aprendizado alta
- ❌ Overkill para caso de uso simples
- ❌ Requer mais código boilerplate

**Bundle Size:** ~45KB minified

---

#### 4. Pragmatic Drag and Drop (Atlassian - Novo)

**Prós:**
- ✅ Sucessor oficial do react-beautiful-dnd
- ✅ Framework agnostic
- ✅ Performático
- ✅ Moderna

**Contras:**
- ❌ Muito nova (lançada 2024)
- ❌ Menos exemplos na comunidade
- ❌ Ainda em evolução
- ❌ Documentação menor

**Bundle Size:** ~30KB minified

---

### 🏆 Recomendação: **@dnd-kit**

**Justificativa:**
- Mantida ativamente
- Compatível com React 18/19 e Next.js 15
- Ótima performance
- Acessibilidade nativa
- Suporta nested drag and drop (essencial para sub_prompts)
- Comunidade ativa e crescente
- TypeScript first

---

### ⚖️ Prós e Contras da Feature

#### ✅ PRÓS

1. **UX Drasticamente Melhorada**
   - Reordenar com 1 ação em vez de 4+ ações
   - Feedback visual imediato
   - Intuitivo e natural

2. **Produtividade**
   - Reduz tempo de configuração em 80%+
   - Menos erros ao reorganizar
   - Iteração rápida na estrutura dos prompts

3. **Profissionalismo**
   - Feature esperada em ferramentas modernas
   - Competitivo com Notion, Linear, Trello
   - Aumenta percepção de qualidade do produto

4. **Flexibilidade**
   - Fácil experimentar diferentes ordens
   - Ajuste fino da hierarquia
   - Melhor organização lógica dos prompts

#### ❌ CONTRAS

1. **Complexidade de Implementação**
   - Requer biblioteca externa (+40KB bundle)
   - Código mais complexo
   - Testes mais elaborados

2. **Possíveis Bugs**
   - Interação com React Hook Form pode ser delicada
   - Edge cases em nested drag and drop
   - Sincronização de estado

3. **Acessibilidade**
   - Precisa implementar keyboard navigation corretamente
   - Screen readers precisam anunciar mudanças
   - Requer testes de acessibilidade

4. **Performance**
   - Listas grandes (50+ items) podem ter lag
   - Mitigado com virtualization se necessário

---

### 🛠️ Desafios Técnicos (COMPLEXOS)

#### Desafio 1: Integração com React Hook Form

**Problema:**
React Hook Form controla o array via `useFieldArray`. Ao arrastar, precisamos:
1. Atualizar a ordem no array do form
2. Não perder o estado de validação
3. Manter `isDirty` correto
4. Preservar valores de cada field

**Solução:**
```typescript
import { useFieldArray } from 'react-hook-form';
import { useSortable, SortableContext } from '@dnd-kit/sortable';

// No componente pai
const { fields, move } = useFieldArray({
  control: form.control,
  name: 'limitations', // ou instructions, rules, etc.
});

function handleDragEnd(event: DragEndEvent) {
  const { active, over } = event;

  if (over && active.id !== over.id) {
    const oldIndex = fields.findIndex((f) => f.id === active.id);
    const newIndex = fields.findIndex((f) => f.id === over.id);

    move(oldIndex, newIndex); // ✅ React Hook Form cuida do resto
  }
}

return (
  <SortableContext items={fields}>
    {fields.map((field, index) => (
      <SortableItem key={field.id} field={field} index={index} />
    ))}
  </SortableContext>
);
```

**Testes Necessários:**
- Arrastar e verificar se validação persiste
- Salvar após arrastar e verificar ordem no banco
- Cancelar e verificar se volta à ordem original

---

#### Desafio 2: Nested Drag and Drop (Pai e Filhos)

**Problema:**
- Steps podem ser arrastados entre si
- Sub-instruções podem ser arrastadas DENTRO do mesmo Step
- Sub-instruções NÃO podem ser arrastadas entre Steps diferentes (ou podem?)

**Decisão de UX:**
```
OPÇÃO A: Sub-instruções ficam dentro do Step
✅ Simples de entender
✅ Hierarquia clara
❌ Menos flexível

OPÇÃO B: Sub-instruções podem mover entre Steps
✅ Máxima flexibilidade
❌ Complexo de implementar
❌ Pode confundir usuário
```

**Recomendação: OPÇÃO A** (pelo menos na v1)

**Implementação:**
```typescript
// Dois níveis de DndContext

// Nível 1: Steps (pai)
<DndContext onDragEnd={handleStepDragEnd}>
  <SortableContext items={steps}>
    {steps.map((step, stepIndex) => (
      <StepItem key={step.id} step={step}>

        {/* Nível 2: Sub-instruções (filho) */}
        <DndContext onDragEnd={(e) => handleSubDragEnd(e, stepIndex)}>
          <SortableContext items={step.sub}>
            {step.sub.map((sub, subIndex) => (
              <SubItem key={sub.id} sub={sub} />
            ))}
          </SortableContext>
        </DndContext>

      </StepItem>
    ))}
  </SortableContext>
</DndContext>
```

**Desafio:** Prevenir que arraste de sub-instruções interfira com arraste de steps.

**Solução:** Usar `sensors` customizados e `activationConstraint`:
```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // Só ativa após arrastar 8px
    },
  }),
  useSensor(KeyboardSensor),
);
```

---

#### Desafio 3: Feedback Visual Durante Arraste

**Problema:**
Usuário precisa ver:
- Qual item está sendo arrastado
- Onde o item vai ser solto
- Preview do item durante arraste

**Solução:**
```typescript
import { DragOverlay } from '@dnd-kit/core';

<DndContext>
  <SortableContext items={items}>
    {/* Lista de items */}
  </SortableContext>

  <DragOverlay>
    {activeId ? (
      <div className="opacity-80 rotate-2 shadow-2xl">
        {/* Clone do item sendo arrastado */}
        <ItemPreview id={activeId} />
      </div>
    ) : null}
  </DragOverlay>
</DndContext>
```

**Estilos:**
```typescript
// Item sendo arrastado (original fica no lugar)
const sortableItem = useSortable({ id });

<div
  ref={sortableItem.setNodeRef}
  style={{
    transform: CSS.Transform.toString(sortableItem.transform),
    transition: sortableItem.transition,
    opacity: sortableItem.isDragging ? 0.5 : 1, // Fantasma
  }}
  className={cn(
    'border rounded-lg p-4',
    sortableItem.isDragging && 'ring-2 ring-primary',
  )}
>
```

---

#### Desafio 4: Persistência de Ordem

**Problema:**
Após arrastar, a ordem precisa:
1. Atualizar no estado local (React Hook Form)
2. Ser salva no banco de dados
3. Persistir após reload da página

**Fluxo:**
```typescript
// 1. Usuário arrasta (onDragEnd)
handleDragEnd(event) {
  move(oldIndex, newIndex); // Atualiza form
  // Estado: isDirty = true
}

// 2. Usuário clica em "Salvar"
onSubmit(data) {
  // data.limitations já está com nova ordem
  await updateAgentPromptAction(agentId, data);
  // Salvo no banco como JSONB
}

// 3. Reload da página
// Server Component busca dados
const agent = await getAgentById(id);
// agent.limitations já vem na ordem correta
```

**Garantias:**
- PostgreSQL JSONB preserva ordem dos arrays
- React Hook Form `move()` atualiza índices corretamente
- Não precisa de campo `order` adicional

---

#### Desafio 5: Acessibilidade (Keyboard Navigation)

**Problema:**
Usuários que não usam mouse precisam conseguir reordenar.

**Solução (dnd-kit fornece):**
```typescript
import { KeyboardSensor } from '@dnd-kit/core';

const sensors = useSensors(
  useSensor(PointerSensor),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  }),
);
```

**Fluxo de Teclado:**
1. `Tab` para focar no item
2. `Space` para pegar o item
3. `Arrow Up/Down` para mover
4. `Space` para soltar
5. `Esc` para cancelar

**Anúncios para Screen Readers:**
```typescript
<div
  role="button"
  aria-roledescription="sortable item"
  aria-label={`${step.title}, ${index + 1} of ${fields.length}`}
  {...sortableItem.attributes}
  {...sortableItem.listeners}
>
```

---

#### Desafio 6: Performance com Muitos Items

**Problema:**
Se um agent tiver 100+ limitations com 10 sub cada (1000 elementos), o drag pode travar.

**Soluções:**

**Opção 1: Virtualization**
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: fields.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 100, // Altura estimada de cada item
});

// Renderiza apenas items visíveis no viewport
```

**Opção 2: Pagination**
```typescript
// Mostrar 20 items por vez
const [page, setPage] = useState(1);
const itemsPerPage = 20;
const paginatedFields = fields.slice(
  (page - 1) * itemsPerPage,
  page * itemsPerPage
);
```

**Opção 3: Lazy Loading**
```typescript
// Carregar sub-instruções apenas quando expandir o step
const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

{expandedSteps.has(step.id) && (
  <SubInstructions items={step.sub} />
)}
```

**Recomendação Inicial:**
- Não otimizar prematuramente
- Implementar virtualization apenas se houver lentidão real
- 99% dos casos terão < 50 items

---

### 📦 Arquivos Afetados

```
package.json                                    ⚠️ ADICIONAR @dnd-kit

components/agents/form-sections/
├── limitations-section.tsx                     ⚠️ REFATORAR (adicionar DnD)
├── instructions-section.tsx                    ⚠️ REFATORAR
├── guideline-section.tsx                       ⚠️ REFATORAR
├── rules-section.tsx                           ⚠️ REFATORAR
└── others-instructions-section.tsx             ⚠️ REFATORAR

components/agents/sortable/                     📁 CRIAR
├── sortable-guideline-step.tsx                 ✨ NOVO (item arrastável)
├── sortable-sub-instruction.tsx                ✨ NOVO (sub-item arrastável)
├── dnd-context-provider.tsx                    ✨ NOVO (wrapper)
└── drag-handle.tsx                             ✨ NOVO (ícone de arraste)

lib/utils/
└── dnd-utils.ts                                ✨ NOVO (helpers)
```

---

### 🎬 Implementação Passo a Passo

#### FASE 1: Setup e Prototipagem (1 campo)

1. **Instalar @dnd-kit**
   ```bash
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
   ```

2. **Criar componente DragHandle**
   ```tsx
   // components/agents/sortable/drag-handle.tsx
   export function DragHandle() {
     return (
       <div className="cursor-grab active:cursor-grabbing">
         <GripVertical className="h-5 w-5 text-muted-foreground" />
       </div>
     );
   }
   ```

3. **Criar SortableGuidelineStep (item arrastável)**
   ```tsx
   // components/agents/sortable/sortable-guideline-step.tsx
   import { useSortable } from '@dnd-kit/sortable';
   import { CSS } from '@dnd-kit/utilities';

   export function SortableGuidelineStep({ field, index, ... }) {
     const sortable = useSortable({ id: field.id });

     return (
       <div
         ref={sortable.setNodeRef}
         style={{
           transform: CSS.Transform.toString(sortable.transform),
           transition: sortable.transition,
         }}
         className={cn(
           'border rounded-lg p-4',
           sortable.isDragging && 'opacity-50',
         )}
       >
         <div className="flex items-start gap-3">
           <div {...sortable.attributes} {...sortable.listeners}>
             <DragHandle />
           </div>

           {/* Conteúdo do field (título, tipo, active, etc) */}
           <div className="flex-1">
             {/* Campos do formulário */}
           </div>
         </div>
       </div>
     );
   }
   ```

4. **Refatorar 1 seção (limitations) para usar DnD**
   ```tsx
   // components/agents/form-sections/limitations-section.tsx
   import { DndContext, closestCenter } from '@dnd-kit/core';
   import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

   export function LimitationsSection({ form }) {
     const { fields, move, append, remove } = useFieldArray({
       control: form.control,
       name: 'limitations',
     });

     function handleDragEnd(event) {
       const { active, over } = event;
       if (over && active.id !== over.id) {
         const oldIndex = fields.findIndex((f) => f.id === active.id);
         const newIndex = fields.findIndex((f) => f.id === over.id);
         move(oldIndex, newIndex);
       }
     }

     return (
       <DndContext
         collisionDetection={closestCenter}
         onDragEnd={handleDragEnd}
       >
         <SortableContext
           items={fields}
           strategy={verticalListSortingStrategy}
         >
           {fields.map((field, index) => (
             <SortableGuidelineStep
               key={field.id}
               field={field}
               index={index}
               onRemove={() => remove(index)}
             />
           ))}
         </SortableContext>
       </DndContext>
     );
   }
   ```

5. **Testar arraste de Steps (sem sub ainda)**
   - Criar 3-4 limitations
   - Arrastar e soltar
   - Verificar se ordem atualiza
   - Salvar e verificar se persiste

6. **Validar qualidade de código (FASE 1)**
   ```bash
   npm run lint          # Verificar code style
   npm run type-check    # Verificar tipos TypeScript
   npm run build         # Verificar build de produção
   ```

---

#### FASE 2: Nested Drag and Drop (Sub-instruções)

6. **Criar SortableSubInstruction**
   ```tsx
   // Similar ao SortableGuidelineStep mas menor
   export function SortableSubInstruction({ sub, index, stepIndex, ... }) {
     const sortable = useSortable({ id: sub.id });

     return (
       <div className="flex items-start gap-2 ml-8">
         <div {...sortable.attributes} {...sortable.listeners}>
           <DragHandle />
         </div>
         <Textarea {...} />
         <Switch {...} />
       </div>
     );
   }
   ```

7. **Adicionar DnD de sub-instruções dentro de cada Step**
   ```tsx
   // Dentro de SortableGuidelineStep
   const subFields = useFieldArray({
     control: form.control,
     name: `limitations.${index}.sub`,
   });

   function handleSubDragEnd(event) {
     // Similar ao handleDragEnd, mas para sub
   }

   return (
     <div>
       {/* Título, tipo, etc */}

       {expanded && (
         <DndContext onDragEnd={handleSubDragEnd}>
           <SortableContext items={subFields.fields}>
             {subFields.fields.map((sub, subIndex) => (
               <SortableSubInstruction ... />
             ))}
           </SortableContext>
         </DndContext>
       )}
     </div>
   );
   ```

8. **Testar arraste de sub-instruções**
   - Criar step com 3-4 subs
   - Arrastar subs dentro do step
   - Verificar que não afeta steps
   - Salvar e verificar ordem

9. **Validar qualidade de código (FASE 2)**
   ```bash
   npm run lint          # Verificar code style
   npm run type-check    # Verificar tipos TypeScript
   npm run build         # Verificar build de produção
   ```

---

#### FASE 3: Replicar para Todos os Campos

10. **Aplicar em instructions-section**
11. **Aplicar em guideline-section**
12. **Aplicar em rules-section**
13. **Aplicar em others-instructions-section**

14. **Validar qualidade de código (FASE 3)**
    ```bash
    npm run lint          # Verificar code style
    npm run type-check    # Verificar tipos TypeScript
    npm run build         # Verificar build de produção
    ```

---

#### FASE 4: Polimento e Acessibilidade

15. **Adicionar DragOverlay para preview**
    ```tsx
    const [activeId, setActiveId] = useState(null);

    <DndContext
      onDragStart={(e) => setActiveId(e.active.id)}
      onDragEnd={(e) => {
        handleDragEnd(e);
        setActiveId(null);
      }}
    >
      {/* ... */}

      <DragOverlay>
        {activeId ? <StepPreview id={activeId} /> : null}
      </DragOverlay>
    </DndContext>
    ```

16. **Configurar keyboard sensors**
    ```tsx
    import { KeyboardSensor, PointerSensor, useSensors } from '@dnd-kit/core';

    const sensors = useSensors(
      useSensor(PointerSensor, {
        activationConstraint: { distance: 8 },
      }),
      useSensor(KeyboardSensor),
    );

    <DndContext sensors={sensors}>
    ```

17. **Adicionar aria-labels e roles**
18. **Testar com keyboard navigation**
19. **Testar com screen reader**

20. **Validar qualidade de código (FASE 4)**
    ```bash
    npm run lint          # Verificar code style
    npm run type-check    # Verificar tipos TypeScript
    npm run build         # Verificar build de produção
    ```

---

#### FASE 5: Testes e Validação

21. **Testes de integração**
    - Arrastar → Salvar → Reload → Verificar ordem
    - Arrastar → Cancelar → Verificar ordem original
    - Editar conteúdo → Arrastar → Salvar → Verificar conteúdo

22. **Testes de edge cases**
    - Array vazio (0 items)
    - Array com 1 item (não pode arrastar)
    - Array com 100+ items (performance)
    - Arrastar primeiro para último
    - Arrastar último para primeiro
    - Arrastar e soltar no mesmo lugar

23. **Testes de acessibilidade**
    - Navegação por teclado funciona
    - Screen reader anuncia mudanças
    - Contraste de cores adequado
    - Focus visível

24. **Validação de qualidade de código FINAL (FASE 5)**
    ```bash
    npm run lint          # Verificar code style
    npm run type-check    # Verificar tipos TypeScript
    npm run build         # Verificar build de produção
    npm run dev          # Smoke test - app deve iniciar sem erros
    ```

25. **Testes manuais finais**
    - Testar todas as 5 seções com DnD
    - Verificar performance geral
    - Confirmar que nenhuma funcionalidade quebrou
    - Verificar console do browser (0 erros)
    - Verificar terminal do dev server (0 erros)

---

### 🚨 Riscos e Mitigações

#### Risco 1: Complexidade Excessiva
**Probabilidade:** Média | **Impacto:** Alto

**Mitigação:**
- Implementar em fases (1 campo → nested → todos)
- Testar cada fase antes de avançar
- Ter rollback plan (remover biblioteca e voltar ao manual)

---

#### Risco 2: Performance em Listas Grandes
**Probabilidade:** Baixa | **Impacto:** Médio

**Mitigação:**
- Monitorar performance com React DevTools
- Implementar virtualization se necessário
- Limitar número de items renderizados (pagination)

---

#### Risco 3: Bugs em Produção
**Probabilidade:** Média | **Impacto:** Médio

**Mitigação:**
- Testes extensivos antes do deploy
- Feature flag para ativar/desativar DnD
- Manter opção manual como fallback

---

#### Risco 4: Conflito com React Hook Form
**Probabilidade:** Baixa | **Impacto:** Alto

**Mitigação:**
- Usar `move()` do useFieldArray (API oficial)
- Testar validação após arrastar
- Verificar `isDirty` e `isValid` states

---

### 📊 Métricas de Sucesso

**Objetivas:**
- Tempo para reordenar 5 items: < 10 segundos (vs 60+ segundos manual)
- Taxa de erro ao reordenar: < 1%
- Performance: 60fps durante arraste
- Acessibilidade: WCAG 2.1 AA

**Subjetivas:**
- Feedback positivo de usuários
- Redução de tickets relacionados a reordenação
- Aumento no uso da feature de agents customizados

---

## 📅 Cronograma Sugerido

### Implementação Sequencial (Recomendado)

**Semana 1:**
- Melhoria #1: Toast sem fechar (1-2 dias)
- Melhoria #2: Textarea multiline (1 dia)
- Melhoria #3: Espaçamento lateral (0.5 dia)

**Semana 2-3:**
- Melhoria #4: Drag and Drop
  - Setup e prototipagem (2 dias)
  - Nested DnD (2-3 dias)
  - Replicar para todos campos (2 dias)
  - Polimento (1 dia)
  - Testes (1-2 dias)

**Total:** ~2-3 semanas de desenvolvimento

---

### Implementação Paralela (Se houver múltiplos devs)

**Dev 1:**
- Melhorias #1, #2, #3 (2-3 dias)

**Dev 2:**
- Melhoria #4: Drag and Drop (7-10 dias)

**Total:** ~2 semanas com 2 devs

---

## 🎯 Priorização Final

### Prioridade ALTA (Implementar Primeiro)
1. **Toast sem fechar** - ROI imediato, baixo risco
2. **Textarea multiline** - ROI imediato, zero risco

### Prioridade MÉDIA (Implementar em Seguida)
3. **Espaçamento lateral** - Melhoria visual, zero risco

### Prioridade ALTA (Implementar com Cuidado)
4. **Drag and Drop** - Alto ROI, mas alto risco e complexidade

---

## 🔄 Estratégia de Rollout

### Fase 1: Melhorias Simples (Semana 1)
- Deploy de #1, #2, #3 juntas
- Baixo risco, pode ir direto para produção
- Monitorar feedback de usuários

### Fase 2: Drag and Drop Beta (Semana 2)
- Feature flag para ativar DnD
- Disponibilizar para 10% dos usuários (beta testers)
- Coletar feedback e métricas

### Fase 3: Drag and Drop GA (Semana 3)
- Se beta for bem-sucedida, rollout para 100%
- Monitorar erros e performance
- Manter fallback manual disponível

---

## 📝 Checklist de Conclusão

### Melhoria #1: Toast sem Fechar
- [ ] Remover `onClose()` do `handleSuccess`
- [ ] Adicionar confirmação ao fechar com mudanças não salvas
- [ ] Testar fluxo completo
- [ ] **Validação de Qualidade:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
  - [ ] `npm run dev` - App runs without crashes
- [ ] Atualizar documentação

### Melhoria #2: Textarea Multiline
- [ ] Substituir Input por Textarea
- [ ] Adicionar contador de caracteres
- [ ] Atualizar validação Zod (maxLength: 500)
- [ ] Testar salvamento com quebras de linha
- [ ] **Validação de Qualidade:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
  - [ ] `npm run dev` - App runs without crashes
- [ ] Atualizar documentação

### Melhoria #3: Espaçamento Lateral
- [ ] Adicionar padding no SidebarInset
- [ ] Testar em diferentes resoluções
- [ ] Validar em todas as páginas do dashboard
- [ ] **Validação de Qualidade:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
  - [ ] `npm run dev` - App runs without crashes
- [ ] Atualizar documentação

### Melhoria #4: Drag and Drop
- [ ] Instalar @dnd-kit
- [ ] Criar componentes Sortable
- [ ] Implementar DnD em 1 campo (prototipo)
- [ ] **Validação FASE 1:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
- [ ] Adicionar nested DnD para sub-instruções
- [ ] **Validação FASE 2:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
- [ ] Replicar para todos os 5 campos JSONB
- [ ] **Validação FASE 3:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
- [ ] Adicionar DragOverlay e feedback visual
- [ ] Configurar keyboard navigation
- [ ] Testes de acessibilidade
- [ ] **Validação FASE 4:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
- [ ] Testes de performance
- [ ] Testes de integração
- [ ] **Validação FINAL:**
  - [ ] `npm run lint` - 0 errors
  - [ ] `npm run type-check` - 0 type errors
  - [ ] `npm run build` - Build successful
  - [ ] `npm run dev` - App runs without crashes
  - [ ] Console browser - 0 errors
  - [ ] Terminal server - 0 errors
- [ ] Feature flag para rollout gradual
- [ ] Atualizar documentação

---

## 🔗 Referências

### Documentação Oficial
- [@dnd-kit](https://docs.dndkit.com/)
- [React Hook Form - useFieldArray](https://react-hook-form.com/docs/usefieldarray)
- [Next.js 15 - Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [WCAG 2.1 - Drag and Drop](https://www.w3.org/WAI/WCAG21/Understanding/dragging-movements.html)

### Exemplos de Implementação
- [dnd-kit + React Hook Form](https://github.com/clauderic/dnd-kit/tree/master/stories/2%20-%20Presets/Sortable)
- [Nested Sortable Lists](https://master--5fc05e08a4a65d0021ae0bf2.chromatic.com/?path=/story/presets-sortable-multiple-containers--basic-setup)

### Inspiração de UX
- [Notion - Drag and Drop](https://www.notion.so)
- [Linear - Issue Ordering](https://linear.app)
- [Trello - Card Drag](https://trello.com)

---

## 💡 Próximos Passos

1. **Revisão do Planejamento**
   - Apresentar para stakeholders
   - Validar prioridades
   - Confirmar cronograma

2. **Setup de Desenvolvimento**
   - Criar branch feature/meus-agentes-improvements
   - Configurar ambiente de testes
   - Preparar dados de teste

3. **Implementação**
   - Seguir fases definidas no cronograma
   - Daily standup para acompanhar progresso
   - Code review contínuo

4. **QA e Testes**
   - Testes manuais em staging
   - Testes automatizados (se aplicável)
   - UAT com usuários beta

5. **Deploy e Monitoramento**
   - Rollout gradual conforme estratégia
   - Monitorar métricas de sucesso
   - Coletar feedback contínuo

---

**Criado em:** 2025-12-13
**Autor:** Claude Code (Skill LIVIA MVP)
**Versão:** 1.0
