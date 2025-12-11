# Diagnóstico: Erros de Validação nos Formulários de Agentes

**Data:** 2025-12-11
**Status:** ✅ PROBLEMA IDENTIFICADO
**Prioridade:** 🔴 CRÍTICA

---

## 🔍 Problema Identificado

### Sintoma
- ✅ Formulário vazio → salva normalmente
- ❌ Formulário com dados existentes → erro ao salvar
- ❌ Toast genérico: _"Existem erros no formulário. Verifique os campos em vermelho nas abas"_
- ❌ **Campos nunca ficam vermelhos** (erro invisível)

### Causa Raiz

**Dados legados no banco excedem os limites definidos no schema Zod.**

Os campos JSONB (`limitations`, `instructions`, `guide_line`, `rules`, `others_instructions`) contêm **sub-instruções com conteúdo maior que 500 caracteres**, mas o schema Zod define:

```typescript
export const guidelineSubInstructionSchema = z.object({
  content: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .max(500, 'Máximo 500 caracteres'), // ⚠️ LIMITE RÍGIDO
  active: z.boolean(),
});
```

---

## 📊 Dados da Investigação

### Registros Afetados

**Total de registros no banco:** 10
**Registros com violações:** 3 (30%)
**Total de violações:** 5 campos

#### Detalhamento das Violações

| ID  | Agent ID | Tenant ID | Campo Violado | Atual | Limite | Excesso |
|-----|----------|-----------|---------------|-------|--------|---------|
| 7   | 2770190f... | 31701213... | `guide_line[2].sub[0].content` | 511 | 500 | +11 |
| 8   | 2ab55858... | 31701213... | `instructions[1].sub[2].content` | 554 | 500 | +54 |
| 8   | 2ab55858... | 31701213... | `guide_line[1].sub[1].content` | 829 | 500 | +329 |
| 8   | 2ab55858... | 31701213... | `guide_line[1].sub[2].content` | **1317** | 500 | **+817** |
| 9   | def3d26b... | 31701213... | `rules[2].sub[1].content` | 616 | 500 | +116 |

**Maior violação:** 1317 caracteres (163% acima do limite)

---

## 🛠️ Soluções Propostas

### Opção 1: Ajustar Schema Zod (RECOMENDADO ✅)

**Descrição:**
Aumentar o limite de caracteres no schema para acomodar dados existentes.

**Arquivo:** `/lib/validations/agentPromptValidation.ts`

**Mudança:**
```typescript
export const guidelineSubInstructionSchema = z.object({
  content: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .max(2000, 'Máximo 2000 caracteres'), // ⬆️ Aumentado de 500 para 2000
  active: z.boolean(),
});
```

**Justificativa:**
- Limite de 500 caracteres é muito restritivo para instruções complexas
- Dados reais mostram que usuários precisam de até 1317 caracteres
- Aumentar para 2000 dá margem de segurança sem comprometer performance

**Prós:**
- ✅ Fix imediato - resolve o problema sem perda de dados
- ✅ Não requer migração de banco
- ✅ Mantém dados históricos intactos
- ✅ Permite instruções mais detalhadas (melhor para usuários)
- ✅ Implementação em < 5 minutos

**Contras:**
- ❌ Permite textos muito longos (mas textarea já limita visualmente)
- ❌ Aumenta levemente o tamanho do JSONB (insignificante)

**Estimativa:** 5 minutos

---

### Opção 2: Migração de Dados (Truncar)

**Descrição:**
Truncar conteúdos existentes para 500 caracteres.

**Implementação:**
```sql
-- Script de migração (CUIDADO: PERDA DE DADOS)
UPDATE agent_prompts
SET
  limitations = truncate_jsonb_content(limitations, 500),
  instructions = truncate_jsonb_content(instructions, 500),
  guide_line = truncate_jsonb_content(guide_line, 500),
  rules = truncate_jsonb_content(rules, 500),
  others_instructions = truncate_jsonb_content(others_instructions, 500)
WHERE id_tenant IS NOT NULL;
```

**Prós:**
- ✅ Mantém limite conservador de 500 caracteres
- ✅ Garante consistência futura

**Contras:**
- ❌ **PERDA DE DADOS** - instruções serão cortadas
- ❌ Pode quebrar contexto de instruções importantes
- ❌ Usuários podem reclamar de conteúdo perdido
- ❌ Requer função PL/pgSQL customizada
- ❌ Irreversível sem backup

**Estimativa:** 2-3 horas (desenvolvimento + testes + backup)

**Veredito:** ❌ NÃO RECOMENDADO (risco de perda de dados)

---

### Opção 3: Remover Limites Completamente

**Descrição:**
Remover validação de `max()` do schema.

**Mudança:**
```typescript
export const guidelineSubInstructionSchema = z.object({
  content: z.string().min(1, 'Conteúdo é obrigatório'), // Sem .max()
  active: z.boolean(),
});
```

**Prós:**
- ✅ Nunca mais haverá erro de limite
- ✅ Flexibilidade total para usuários

**Contras:**
- ❌ Sem proteção contra abusos (textos gigantes)
- ❌ Pode impactar performance do banco (JSONB muito grande)
- ❌ Má prática de validação (dados ilimitados)
- ❌ UX ruim (textarea sem feedback de limite)

**Veredito:** ❌ NÃO RECOMENDADO

---

## ✅ Solução Escolhida

### Opção 1: Ajustar Schema Zod

**Novos Limites:**
| Campo | Limite Antigo | Limite Novo | Motivo |
|-------|---------------|-------------|--------|
| `guidelineSubInstruction.content` | 500 | **2000** | Acomodar instruções complexas |
| `guidelineStep.title` | 200 | **300** | Margem de segurança |
| `personality fields` (objective, etc.) | 1000 | 1000 | ✅ OK (não precisam ajuste) |

---

## 📝 Plano de Implementação

### Passo 1: Ajustar Schema Zod

**Arquivo:** `/lib/validations/agentPromptValidation.ts`

```typescript
// Linha 8: Aumentar limite de content
export const guidelineSubInstructionSchema = z.object({
  content: z.string()
    .min(1, 'Conteúdo é obrigatório')
    .max(2000, 'Máximo 2000 caracteres'), // ⬆️ 500 → 2000
  active: z.boolean(),
});

// Linha 14: Aumentar limite de title (opcional, margem de segurança)
export const guidelineStepSchema = z.object({
  title: z.string()
    .min(1, 'Título é obrigatório')
    .max(300, 'Máximo 300 caracteres'), // ⬆️ 200 → 300
  type: z.enum(['rank', 'markdown'], {
    message: 'Tipo deve ser "rank" ou "markdown"',
  }),
  active: z.boolean(),
  sub: z.array(guidelineSubInstructionSchema),
});
```

---

### Passo 2: Testar Validação

**Teste 1: Formulário com dados existentes**
```bash
# Abrir formulário do Registro ID 8 (maior violação)
# Tentar salvar sem alterações
# ✅ Deve salvar com sucesso
```

**Teste 2: Formulário novo com limite**
```bash
# Criar nova sub-instrução com exatamente 2000 caracteres
# ✅ Deve aceitar
# Criar com 2001 caracteres
# ❌ Deve rejeitar com erro específico
```

---

### Passo 3: Implementar Melhorias de UX (Fase 1)

Após corrigir o schema, implementar a **Fase 1** do plano de melhorias:
1. Toast com erros específicos
2. Badges nas tabs com contador de erros
3. Alert visual na tab ativa

**Referência:** `/docs/planejamento/melhorias-tratamento-erros-formularios-agentes.md`

---

## 📊 Impacto

### Antes da Correção
- ❌ 30% dos registros não podem ser editados
- ❌ Usuários não conseguem salvar alterações
- ❌ Erro invisível e frustrante

### Depois da Correção
- ✅ 100% dos registros editáveis
- ✅ Validação funciona corretamente
- ✅ Mensagens de erro específicas (após Fase 1)
- ✅ Limite mais realista para instruções complexas

---

## 🧪 Validação da Solução

### Checklist

- [ ] Ajustar `guidelineSubInstructionSchema.content.max(2000)`
- [ ] Ajustar `guidelineStepSchema.title.max(300)` (opcional)
- [ ] Testar formulário com Registro ID 8 (1317 chars)
- [ ] Testar formulário com Registro ID 7 (511 chars)
- [ ] Testar formulário com Registro ID 9 (616 chars)
- [ ] Testar formulário novo (criar sub-instrução com 2000 chars)
- [ ] Verificar que validação rejeita > 2000 chars
- [ ] Commit das mudanças

---

## 📁 Arquivos Afetados

### Modificados
- `/lib/validations/agentPromptValidation.ts` (linhas 8 e 14)

### Não Afetados
- `/app/actions/agents.ts` (já usa o schema corretamente)
- `/components/agents/**` (componentes não mudam)
- Banco de dados (sem migração necessária)

---

## 🎯 Próximos Passos

1. ✅ **Implementar fix do schema** (5 minutos)
2. 🧪 **Testar com todos os registros afetados** (15 minutos)
3. 📝 **Documentar mudança** no CHANGELOG (5 minutos)
4. 🚀 **Deploy em produção** (após testes)
5. 🔄 **Implementar Fase 1 de melhorias de UX** (1-2 horas)

---

## 📚 Referências

### Scripts de Diagnóstico Criados
- `/scripts/verify-agent-schema.js` - Verifica estrutura do banco
- `/scripts/inspect-agent-prompts-data.js` - Inspeção detalhada de dados
- `/scripts/validate-agent-prompts-lengths.js` - Validação de limites

### Documentação Relacionada
- `/docs/planejamento/melhorias-tratamento-erros-formularios-agentes.md`
- `/docs/contexto/fluxo-edicao-prompts-tenant.md`

---

**Última atualização:** 2025-12-11
**Responsável:** Claude Sonnet 4.5 + Frank (Dev Team)
**Status:** ✅ SOLUÇÃO IDENTIFICADA E DOCUMENTADA
