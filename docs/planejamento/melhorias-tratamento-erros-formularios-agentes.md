# Melhorias no Tratamento de Erros - Formulários de Agentes Principais

**Data:** 2025-12-11
**Feature:** Meus Agentes IA
**Status:** 🔴 Planejamento

---

## 📋 Índice

1. [Contexto do Problema](#contexto-do-problema)
2. [Diagnóstico Técnico](#diagnóstico-técnico)
3. [Estratégias Avaliadas](#estratégias-avaliadas)
4. [Solução Escolhida](#solução-escolhida)
5. [Plano de Implementação](#plano-de-implementação)
6. [Checklist de Tarefas](#checklist-de-tarefas)

---

## Contexto do Problema

### Situação Atual

**Comportamento Observado:**
- ✅ Formulário vazio → salva normalmente
- ❌ Formulário com dados existentes → erro ao salvar
- ❌ Toast genérico: _"Existem erros no formulário. Verifique os campos em vermelho nas abas"_
- ❌ **Campos nunca ficam vermelhos** (erro invisível)
- ❌ Usuário não consegue identificar qual campo está errado
- ❌ Usuário não consegue corrigir o erro

**Impacto:**
- Frustração do usuário
- Impossibilidade de editar dados existentes
- Perda de produtividade
- Má experiência de usuário (UX)

---

## Diagnóstico Técnico

### 1. Validação Zod Silenciosa

**Arquivo:** `/app/actions/agents.ts:44-52`

```typescript
const validationResult = agentPromptSchema.safeParse(updates);

if (!validationResult.success) {
  return {
    success: false,
    error: 'Dados inválidos',
    details: validationResult.error.format(), // ⚠️ RETORNA MAS NÃO É USADO
  };
}
```

**Problema:**
- A action retorna `details` com erros específicos
- O componente **ignora** `details` e só lê `error` (mensagem genérica)

---

### 2. Campos Sem Renderização de Erros

**Arquivos:**
- `/components/agents/form-sections/personality-section.tsx`
- `/components/agents/form-sections/guideline-section.tsx`
- Todas as outras seções

**Código Atual:**
```tsx
<Input
  id="name"
  placeholder="Ex: Maria Atendente"
  {...form.register('name')} // ⚠️ NÃO renderiza erros
/>
```

**Problema:**
- Não usa `<FormField>`, `<FormItem>`, `<FormMessage>` do shadcn/ui
- Erros do react-hook-form **existem** mas **não são renderizados**
- Campos nunca ficam vermelhos (classe `border-destructive` não é aplicada)
- Mensagens de erro não aparecem

---

### 3. Toast Genérico e Inútil

**Arquivo:** `/components/agents/agent-edit-tabs.tsx:117-122`

```typescript
function onInvalid(errors: Partial<Record<keyof AgentPromptFormData, unknown>>) {
  console.error('Form validation errors:', errors); // ⚠️ SÓ NO CONSOLE
  toast.error('Existem erros no formulário. Verifique os campos em vermelho nas abas.', {
    duration: 5000,
  });
}
```

**Problemas:**
1. Erros só aparecem no console (usuário não vê)
2. Toast diz "campos em vermelho" mas **campos nunca ficam vermelhos**
3. Não especifica **qual campo** ou **qual erro**
4. Não indica **qual tab** tem erro

---

### 4. Estrutura de Erros Complexa

**Schema:** `/lib/validations/agentPromptValidation.ts`

```typescript
// 6 tabs com estruturas diferentes:
export const agentPromptSchema = z.object({
  // Tab "Personalidade" - campos simples
  name: z.string().max(200, 'Máximo 200 caracteres').optional().nullable(),
  age: z.string().max(50, 'Máximo 50 caracteres').optional().nullable(),
  gender: z.enum(['male', 'female']).optional().nullable(),

  // Tabs JSONB - arrays aninhados complexos
  limitations: z.array(guidelineStepSchema).optional().nullable(),
  instructions: z.array(guidelineStepSchema).optional().nullable(),
  guide_line: z.array(guidelineStepSchema).optional().nullable(),
  rules: z.array(guidelineStepSchema).optional().nullable(),
  others_instructions: z.array(guidelineStepSchema).optional().nullable(),
});

// Estrutura aninhada:
export const guidelineStepSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(200, 'Máximo 200 caracteres'),
  type: z.enum(['rank', 'markdown']),
  active: z.boolean(),
  sub: z.array(guidelineSubInstructionSchema), // ⚠️ ANINHAMENTO
});

export const guidelineSubInstructionSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório').max(500, 'Máximo 500 caracteres'),
  active: z.boolean(),
});
```

**Problema:**
- Erros podem estar em 3 níveis de profundidade:
  - `limitations` (nível 1)
  - `limitations[2]` (nível 2)
  - `limitations[2].sub[1].content` (nível 3)
- Mensagens de erro precisam ser específicas e localizáveis

---

## Estratégias Avaliadas

### Estratégia 1: Validação Tab-by-Tab com Mensagens Específicas

**Descrição:**
Salvar apenas a tab ativa, validando apenas os campos daquela seção.

**Implementação:**
- Criar schemas Zod separados por tab
- Botão "Salvar" valida e salva apenas a tab atual
- Toast específico: _"Nome da Persona: máximo 200 caracteres"_

**Prós:**
- ✅ Feedback imediato e específico
- ✅ Usuário pode salvar tabs válidas enquanto trabalha em outras
- ✅ Menos frustração
- ✅ Mensagens muito específicas e acionáveis

**Contras:**
- ❌ Permite salvar formulário "incompleto" no banco
- ❌ Mais requests ao backend (6 saves ao invés de 1)
- ❌ Precisa gerenciar estado de "completude"
- ❌ UX pode confundir
- ❌ Maior complexidade no código

**Veredito:** ❌ Não recomendado (permite estados inválidos no banco)

---

### Estratégia 2: Validação Global + Toast Detalhado por Seção

**Descrição:**
Manter validação global, mas exibir lista de erros agrupados por tab no toast.

**Implementação:**
- Manter schema único e validação global
- Mapear erros para suas tabs correspondentes
- Toast expandido com lista de erros
- Badges nas tabs com erros

**Prós:**
- ✅ Usuário vê todos os erros de uma vez
- ✅ Badges nas tabs ajudam a navegar
- ✅ Mantém atomicidade - salva tudo ou nada
- ✅ Implementação moderada
- ✅ Não permite estados inválidos no banco

**Contras:**
- ❌ Pode sobrecarregar usuário com muitos erros
- ❌ Toast grande pode ser difícil de ler
- ❌ Ainda requer correção de todas as tabs

**Veredito:** ✅ **Recomendado para Fase 1 (Quick Win)**

---

### Estratégia 3: Validação em Tempo Real + Indicadores Visuais

**Descrição:**
Validar campos conforme o usuário digita, com mensagens inline e badges nas tabs.

**Implementação:**
- Adicionar `mode: 'onChange'` no useForm
- Renderizar `form.formState.errors` embaixo de cada campo
- Badge vermelho em tabs com erros
- Toast final específico

**Prós:**
- ✅ Feedback instantâneo
- ✅ Previne erros ao invés de reportá-los
- ✅ Melhor UX
- ✅ Badges facilitam localização
- ✅ Reduz frustração

**Contras:**
- ❌ Pode ser intrusivo
- ❌ Performance em estruturas JSONB complexas
- ❌ Requer refatoração de todos os componentes
- ❌ Pode intimidar usuário com muitos erros

**Veredito:** ✅ **Recomendado para Fase 2 (Solução Robusta)**

---

### Estratégia 4: Validação Progressive (Wizard-Style)

**Descrição:**
Transformar tabs em steps sequenciais com validação obrigatória antes de avançar.

**Implementação:**
- Tabs viram steps numerados
- Botão "Próximo" valida antes de avançar
- Botão "Salvar" apenas na última tab

**Prós:**
- ✅ Usuário nunca chega ao final com erros
- ✅ Foco em uma seção por vez
- ✅ Valida progressivamente
- ✅ UX guiada
- ✅ Garante completude

**Contras:**
- ❌ Remove flexibilidade
- ❌ Ruim para edição
- ❌ Não funciona se campos são opcionais
- ❌ Mudança radical de UX
- ❌ Overhead para pequenas edições

**Veredito:** ❌ Não recomendado (UX muito restritiva)

---

### Estratégia 5: Validação Híbrida com "Soft Save"

**Descrição:**
Combinar validação global com salvamento parcial automático em rascunho.

**Implementação:**
- Auto-save a cada 30s ou ao trocar de tab
- Validação final ao clicar "Publicar"
- Modal com checklist de erros
- Erros inline + badges nas tabs

**Prós:**
- ✅ Melhor dos dois mundos
- ✅ Usuário não perde trabalho
- ✅ Feedback específico com modal
- ✅ Auto-save previne perda de dados
- ✅ Mantém atomicidade na publicação

**Contras:**
- ❌ Maior complexidade técnica
- ❌ Precisa adicionar campo `status` na tabela
- ❌ Mais lógica de backend
- ❌ Pode confundir
- ❌ Requer UI adicional

**Veredito:** 🟡 Considerar para futuro (muito complexo para agora)

---

## Solução Escolhida

### Abordagem em 2 Fases

#### **Fase 1: Quick Win (Fix Imediato)** ⚡
**Tempo estimado:** 1-2 horas
**Estratégia:** #2 - Validação Global + Toast Detalhado

**Objetivos:**
1. ✅ Tornar erros **visíveis** e **específicos**
2. ✅ Não refatorar toda a estrutura de componentes
3. ✅ Usar a validação existente (Zod)
4. ✅ Melhorar UX imediatamente

**Mudanças:**
- Extrair e processar `result.details` da action
- Mapear erros para suas tabs correspondentes
- Toast com lista de erros específicos
- Badges nas tabs com contador de erros
- Alert na tab ativa destacando erros

---

#### **Fase 2: Solução Robusta (Longo Prazo)** 🏗️
**Tempo estimado:** 3-5 horas
**Estratégia:** #3 - Validação em Tempo Real + Indicadores Visuais

**Objetivos:**
1. ✅ Validação em tempo real
2. ✅ Mensagens inline em cada campo
3. ✅ Campos ficam vermelhos quando inválidos
4. ✅ UX profissional e moderna

**Mudanças:**
- Refatorar todas as seções para usar `<FormField>`
- Adicionar `mode: 'onChange'` no useForm
- Renderizar erros inline com `<FormMessage>`
- Estilização visual de erros (border-destructive)
- Otimizar performance para arrays aninhados

---

## Plano de Implementação

### Fase 1: Quick Win (Implementação Imediata)

#### 1.1. Criar Utilitário de Mapeamento de Erros

**Arquivo:** `/lib/utils/form-errors.ts` (novo)

```typescript
import type { FieldErrors } from 'react-hook-form';
import type { AgentPromptFormData } from '@/lib/validations/agentPromptValidation';

export interface ErrorsByTab {
  personality: string[];
  limitations: string[];
  instructions: string[];
  guideline: string[];
  rules: string[];
  others: string[];
}

export function mapErrorsToTabs(errors: FieldErrors<AgentPromptFormData>): ErrorsByTab {
  const errorsByTab: ErrorsByTab = {
    personality: [],
    limitations: [],
    instructions: [],
    guideline: [],
    rules: [],
    others: [],
  };

  // Mapear erros de personalidade
  if (errors.name) errorsByTab.personality.push(`Nome: ${errors.name.message}`);
  if (errors.age) errorsByTab.personality.push(`Idade: ${errors.age.message}`);
  if (errors.gender) errorsByTab.personality.push(`Gênero: ${errors.gender.message}`);
  if (errors.objective) errorsByTab.personality.push(`Objetivo: ${errors.objective.message}`);
  if (errors.comunication) errorsByTab.personality.push(`Comunicação: ${errors.comunication.message}`);
  if (errors.personality) errorsByTab.personality.push(`Personalidade: ${errors.personality.message}`);

  // Mapear erros JSONB aninhados
  if (errors.limitations) {
    errorsByTab.limitations.push(...parseNestedErrors('Limitação', errors.limitations));
  }

  if (errors.instructions) {
    errorsByTab.instructions.push(...parseNestedErrors('Instrução', errors.instructions));
  }

  if (errors.guide_line) {
    errorsByTab.guideline.push(...parseNestedErrors('Guideline', errors.guide_line));
  }

  if (errors.rules) {
    errorsByTab.rules.push(...parseNestedErrors('Regra', errors.rules));
  }

  if (errors.others_instructions) {
    errorsByTab.others.push(...parseNestedErrors('Outra Instrução', errors.others_instructions));
  }

  return errorsByTab;
}

function parseNestedErrors(prefix: string, fieldError: any): string[] {
  const messages: string[] = [];

  if (Array.isArray(fieldError)) {
    fieldError.forEach((stepError, stepIndex) => {
      if (stepError) {
        // Erro no step
        if (stepError.title) {
          messages.push(`${prefix} ${stepIndex + 1} - Título: ${stepError.title.message}`);
        }
        if (stepError.type) {
          messages.push(`${prefix} ${stepIndex + 1} - Tipo: ${stepError.type.message}`);
        }

        // Erros nas sub-instruções
        if (stepError.sub && Array.isArray(stepError.sub)) {
          stepError.sub.forEach((subError: any, subIndex: number) => {
            if (subError?.content) {
              messages.push(
                `${prefix} ${stepIndex + 1} > Sub ${subIndex + 1}: ${subError.content.message}`
              );
            }
          });
        }
      }
    });
  }

  return messages;
}

export function getErrorCount(tabErrors: string[]): number {
  return tabErrors.length;
}

export function getTotalErrorCount(errorsByTab: ErrorsByTab): number {
  return Object.values(errorsByTab).reduce((sum, errors) => sum + errors.length, 0);
}

export function formatErrorsForToast(errorsByTab: ErrorsByTab): string {
  const tabsWithErrors: string[] = [];

  if (errorsByTab.personality.length > 0) {
    tabsWithErrors.push(`Personalidade (${errorsByTab.personality.length})`);
  }
  if (errorsByTab.limitations.length > 0) {
    tabsWithErrors.push(`Limitações (${errorsByTab.limitations.length})`);
  }
  if (errorsByTab.instructions.length > 0) {
    tabsWithErrors.push(`Instruções (${errorsByTab.instructions.length})`);
  }
  if (errorsByTab.guideline.length > 0) {
    tabsWithErrors.push(`Guideline (${errorsByTab.guideline.length})`);
  }
  if (errorsByTab.rules.length > 0) {
    tabsWithErrors.push(`Regras (${errorsByTab.rules.length})`);
  }
  if (errorsByTab.others.length > 0) {
    tabsWithErrors.push(`Outras (${errorsByTab.others.length})`);
  }

  return `Erros encontrados em: ${tabsWithErrors.join(', ')}`;
}
```

---

#### 1.2. Atualizar `agent-edit-tabs.tsx`

**Arquivo:** `/components/agents/agent-edit-tabs.tsx`

**Mudanças:**

1. Importar utilitários de erro
2. Adicionar estado para erros por tab
3. Atualizar função `onInvalid`
4. Adicionar badges nas tabs
5. Passar erros para seções

```typescript
// Imports
import { mapErrorsToTabs, getTotalErrorCount, formatErrorsForToast, type ErrorsByTab } from '@/lib/utils/form-errors';
import { Badge } from '@/components/ui/badge';

// Adicionar estado
const [errorsByTab, setErrorsByTab] = useState<ErrorsByTab>({
  personality: [],
  limitations: [],
  instructions: [],
  guideline: [],
  rules: [],
  others: [],
});

// Atualizar onInvalid
function onInvalid(errors: FieldErrors<AgentPromptFormData>) {
  console.error('Form validation errors:', errors);

  // Mapear erros para tabs
  const mappedErrors = mapErrorsToTabs(errors);
  setErrorsByTab(mappedErrors);

  // Toast específico
  const totalErrors = getTotalErrorCount(mappedErrors);
  const errorSummary = formatErrorsForToast(mappedErrors);

  toast.error(`${totalErrors} erro(s) encontrado(s)`, {
    description: errorSummary,
    duration: 7000,
  });
}

// Limpar erros ao salvar com sucesso
async function onSubmit(data: AgentPromptFormData) {
  setIsSubmitting(true);

  try {
    const result = await updateAgentPromptAction(agent.id, data);

    if (result.success) {
      setErrorsByTab({ // Limpar erros
        personality: [],
        limitations: [],
        instructions: [],
        guideline: [],
        rules: [],
        others: [],
      });
      toast.success('Configuração atualizada com sucesso!');
      onSuccess?.();
    } else {
      toast.error(result.error || 'Erro ao atualizar configuração');
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('Erro inesperado ao atualizar');
  } finally {
    setIsSubmitting(false);
  }
}

// Atualizar TabsList com badges
<TabsList className="w-full justify-start border-b rounded-none h-auto flex-wrap">
  <TabsTrigger value="personality">
    Personalidade
    {errorsByTab.personality.length > 0 && (
      <Badge variant="destructive" className="ml-2">
        {errorsByTab.personality.length}
      </Badge>
    )}
  </TabsTrigger>

  <TabsTrigger value="limitations">
    Limitações
    {errorsByTab.limitations.length > 0 && (
      <Badge variant="destructive" className="ml-2">
        {errorsByTab.limitations.length}
      </Badge>
    )}
  </TabsTrigger>

  {/* Repetir para outras tabs */}
</TabsList>
```

---

#### 1.3. Adicionar Alert de Erros nas Seções

**Exemplo:** `/components/agents/form-sections/personality-section.tsx`

```typescript
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface PersonalitySectionProps {
  form: UseFormReturn<AgentPromptFormData>;
  errors?: string[]; // Novo prop
}

export function PersonalitySection({ form, errors = [] }: PersonalitySectionProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Personalidade</h3>
        <p className="text-sm text-muted-foreground">
          Configure a personalidade e características do agent
        </p>
      </div>

      {/* Alert de erros */}
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erros nesta seção ({errors.length})</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1 mt-2">
              {errors.map((error, index) => (
                <li key={index} className="text-sm">{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Resto do formulário... */}
    </div>
  );
}
```

---

#### 1.4. Processar Erros da Action

**Arquivo:** `/components/agents/agent-edit-tabs.tsx`

```typescript
async function onSubmit(data: AgentPromptFormData) {
  setIsSubmitting(true);

  try {
    const result = await updateAgentPromptAction(agent.id, data);

    if (result.success) {
      setErrorsByTab({
        personality: [],
        limitations: [],
        instructions: [],
        guideline: [],
        rules: [],
        others: [],
      });
      toast.success('Configuração atualizada com sucesso!');
      onSuccess?.();
    } else {
      // ⚠️ NOVO: Processar erros específicos da action
      if (result.details) {
        // Mapear erros do Zod vindos do backend
        const mappedErrors = mapErrorsToTabs(result.details as any);
        setErrorsByTab(mappedErrors);

        const totalErrors = getTotalErrorCount(mappedErrors);
        const errorSummary = formatErrorsForToast(mappedErrors);

        toast.error(`${totalErrors} erro(s) de validação`, {
          description: errorSummary,
          duration: 7000,
        });
      } else {
        toast.error(result.error || 'Erro ao atualizar configuração');
      }
    }
  } catch (error) {
    console.error('Error submitting form:', error);
    toast.error('Erro inesperado ao atualizar');
  } finally {
    setIsSubmitting(false);
  }
}
```

---

### Fase 2: Solução Robusta (Futuro)

#### 2.1. Refatorar Seções para usar FormField

**Antes:**
```tsx
<Input
  id="name"
  placeholder="Ex: Maria Atendente"
  {...form.register('name')}
/>
```

**Depois:**
```tsx
<FormField
  control={form.control}
  name="name"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Nome da Persona</FormLabel>
      <FormControl>
        <Input placeholder="Ex: Maria Atendente" {...field} />
      </FormControl>
      <FormDescription>
        Nome que o agent usa para se identificar
      </FormDescription>
      <FormMessage /> {/* Renderiza erro automaticamente */}
    </FormItem>
  )}
/>
```

---

#### 2.2. Ativar Validação em Tempo Real

**Arquivo:** `/components/agents/agent-edit-tabs.tsx`

```typescript
const form = useForm<AgentPromptFormData>({
  resolver: zodResolver(agentPromptSchema),
  mode: 'onChange', // ⚠️ NOVO: Validar em tempo real
  defaultValues: { /* ... */ },
});
```

---

#### 2.3. Otimizar Performance

Para arrays JSONB aninhados, considerar:
- Debounce na validação
- Validação apenas no onBlur para campos complexos
- Memoização de componentes pesados

```typescript
const form = useForm<AgentPromptFormData>({
  resolver: zodResolver(agentPromptSchema),
  mode: 'onBlur', // Alternativamente, validar apenas ao sair do campo
  defaultValues: { /* ... */ },
});
```

---

## Checklist de Tarefas

### Fase 1: Quick Win ⚡

- [ ] **1.1. Criar utilitário de mapeamento de erros**
  - [ ] Criar arquivo `/lib/utils/form-errors.ts`
  - [ ] Implementar `mapErrorsToTabs()`
  - [ ] Implementar `parseNestedErrors()` para JSONB
  - [ ] Implementar `formatErrorsForToast()`
  - [ ] Implementar `getTotalErrorCount()`
  - [ ] Testar com erros simulados

- [ ] **1.2. Atualizar `agent-edit-tabs.tsx`**
  - [ ] Importar utilitários de erro
  - [ ] Adicionar estado `errorsByTab`
  - [ ] Atualizar função `onInvalid` para mapear erros
  - [ ] Adicionar badges nas tabs (TabsTrigger)
  - [ ] Melhorar toast com descrição específica
  - [ ] Processar `result.details` da action
  - [ ] Limpar erros ao salvar com sucesso

- [ ] **1.3. Adicionar Alert de erros nas seções**
  - [ ] Atualizar `PersonalitySection` (adicionar prop `errors`)
  - [ ] Atualizar `LimitationsSection`
  - [ ] Atualizar `InstructionsSection`
  - [ ] Atualizar `GuidelineSection`
  - [ ] Atualizar `RulesSection`
  - [ ] Atualizar `OthersInstructionsSection`
  - [ ] Renderizar Alert com lista de erros

- [ ] **1.4. Passar erros para as seções**
  - [ ] Passar `errors={errorsByTab.personality}` para PersonalitySection
  - [ ] Passar `errors={errorsByTab.limitations}` para LimitationsSection
  - [ ] Passar `errors={errorsByTab.instructions}` para InstructionsSection
  - [ ] Passar `errors={errorsByTab.guideline}` para GuidelineSection
  - [ ] Passar `errors={errorsByTab.rules}` para RulesSection
  - [ ] Passar `errors={errorsByTab.others}` para OthersInstructionsSection

- [ ] **1.5. Testes e validação**
  - [ ] Testar com formulário vazio (deve salvar)
  - [ ] Testar com dados inválidos em "Personalidade"
  - [ ] Testar com dados inválidos em "Limitações" (JSONB)
  - [ ] Testar com erros em múltiplas tabs
  - [ ] Testar com erros aninhados (sub-instruções)
  - [ ] Verificar se badges aparecem corretamente
  - [ ] Verificar se toast mostra resumo correto
  - [ ] Verificar se Alert mostra lista de erros
  - [ ] Testar salvamento com sucesso (limpa erros)

---

### Fase 2: Solução Robusta 🏗️ (Futuro)

- [ ] **2.1. Refatorar PersonalitySection**
  - [ ] Converter todos os campos para `<FormField>`
  - [ ] Adicionar `<FormMessage>` em cada campo
  - [ ] Testar renderização de erros inline

- [ ] **2.2. Refatorar LimitationsSection**
  - [ ] Criar componente `GuidelineStepFormField`
  - [ ] Converter campos para `<FormField>`
  - [ ] Adicionar suporte a erros aninhados
  - [ ] Testar com arrays dinâmicos

- [ ] **2.3. Refatorar InstructionsSection**
  - [ ] Reaproveitar `GuidelineStepFormField`
  - [ ] Implementar mesma lógica de LimitationsSection

- [ ] **2.4. Refatorar GuidelineSection**
  - [ ] Reaproveitar `GuidelineStepFormField`
  - [ ] Implementar mesma lógica

- [ ] **2.5. Refatorar RulesSection**
  - [ ] Reaproveitar `GuidelineStepFormField`
  - [ ] Implementar mesma lógica

- [ ] **2.6. Refatorar OthersInstructionsSection**
  - [ ] Reaproveitar `GuidelineStepFormField`
  - [ ] Implementar mesma lógica

- [ ] **2.7. Ativar validação em tempo real**
  - [ ] Adicionar `mode: 'onChange'` no useForm
  - [ ] Testar performance
  - [ ] Considerar debounce se necessário
  - [ ] Testar UX (não pode ser intrusivo)

- [ ] **2.8. Otimizações de performance**
  - [ ] Memoizar componentes de seção
  - [ ] Implementar debounce na validação se necessário
  - [ ] Considerar `mode: 'onBlur'` para campos complexos

- [ ] **2.9. Testes finais**
  - [ ] Testar validação em tempo real
  - [ ] Testar erros inline em todos os campos
  - [ ] Testar estilização visual (border-destructive)
  - [ ] Testar performance com formulários grandes
  - [ ] Testar acessibilidade (ARIA labels)

---

## Arquivos Afetados

### Fase 1 (Quick Win)

**Novos:**
- `/lib/utils/form-errors.ts`

**Modificados:**
- `/components/agents/agent-edit-tabs.tsx`
- `/components/agents/form-sections/personality-section.tsx`
- `/components/agents/form-sections/limitations-section.tsx`
- `/components/agents/form-sections/instructions-section.tsx`
- `/components/agents/form-sections/guideline-section.tsx`
- `/components/agents/form-sections/rules-section.tsx`
- `/components/agents/form-sections/others-instructions-section.tsx`

**Não modificados (usam mesma lógica):**
- `/lib/validations/agentPromptValidation.ts` (schema Zod)
- `/app/actions/agents.ts` (já retorna `details`)

---

### Fase 2 (Solução Robusta)

**Novos:**
- `/components/agents/form-fields/guideline-step-form-field.tsx` (componente reutilizável)
- `/components/agents/form-fields/sub-instruction-form-field.tsx`

**Modificados:**
- Todas as seções (refatoração completa)
- `/components/agents/agent-edit-tabs.tsx` (modo de validação)

---

## Métricas de Sucesso

### Fase 1
- ✅ Erros são **visíveis** no toast
- ✅ Usuário sabe **qual tab** tem erro (badges)
- ✅ Usuário sabe **qual campo** tem erro (Alert)
- ✅ Mensagens são **específicas** e **acionáveis**
- ✅ Tempo de resolução de erro < 30 segundos

### Fase 2
- ✅ Erros aparecem **instantaneamente** ao digitar
- ✅ Campos ficam **vermelhos** quando inválidos
- ✅ Mensagens inline embaixo de cada campo
- ✅ Performance < 200ms para validação
- ✅ UX profissional e moderna

---

## Considerações de Dados Legados

### Problema Potencial
Dados existentes no banco podem ter estruturas incompatíveis com o schema Zod atual.

### Exemplos:
- Campos JSONB com estrutura antiga (sem `type`, sem `active`, etc.)
- Strings muito longas que agora têm `max(200)`
- Valores nulos em campos que agora são `required`

### Solução:
1. **Migração de dados** (se necessário):
   - Criar script SQL para normalizar dados antigos
   - Executar antes de deploy

2. **Schema mais tolerante** (alternativa):
   - Remover validações muito rígidas para edição
   - Manter validações rígidas apenas para criação

3. **Modo de compatibilidade** (fallback):
   - Se validação falhar, permitir salvamento com warning
   - Migrar dados aos poucos

---

## Próximos Passos

1. ✅ **Aprovar plano** com stakeholders
2. 🔄 **Implementar Fase 1** (1-2 horas)
3. 🧪 **Testar em ambiente de dev**
4. 🚀 **Deploy em produção**
5. 📊 **Monitorar feedback de usuários**
6. 🔄 **Planejar Fase 2** (após validação da Fase 1)

---

**Última atualização:** 2025-12-11
**Responsável:** Claude Sonnet 4.5 + Frank (Dev Team)
