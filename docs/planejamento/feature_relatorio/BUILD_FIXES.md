# 🔧 Build Fixes - Relatório Funil

**Data:** 2025-12-19
**Status:** ✅ RESOLVIDO

---

## ❌ Erros Encontrados

### 1. TypeScript Error - reasons-chart.tsx
```
Type '(value: number, name: string, props: any) => [string, "Quantidade"]' 
is not assignable to type 'Formatter<number, string>'.
```

**Causa:** Recharts Tooltip formatter espera `value` e `name` como opcionais (`undefined`)

**Solução:**
```typescript
// Antes:
formatter={(value: number, name: string, props: any) => { ... }}

// Depois:
formatter={(value, _name, props) => {
  if (value === undefined) return ['0', 'Quantidade'];
  const percentage = props.payload?.percentage ?? 0;
  return [`${value} (${formatPercentage(percentage)})`, 'Quantidade'];
}}
```

---

### 2. Unused Variable - status-funnel-chart.tsx
```
'width' is declared but its value is never read.
```

**Causa:** Variável `width` foi declarada mas não utilizada

**Solução:**
```typescript
// Removido:
const width = `${stage.percentage}%`;

// Mantido apenas:
const maxWidth = 100 - (index * 10);
```

---

### 3. TypeScript Error - time-by-stage-chart.tsx
```
Type '(value: number) => [string, "Tempo"]' is not assignable 
to type 'Formatter<number, "Tempo">'.
```

**Causa:** Mesmo problema com Tooltip formatter + value pode ser array

**Solução:**
```typescript
formatter={(value) => {
  if (value === undefined || value === null) return ['0s', 'Tempo'];
  let numValue: number;
  if (typeof value === 'string') {
    numValue = parseFloat(value);
  } else if (typeof value === 'number') {
    numValue = value;
  } else {
    return ['0s', 'Tempo'];
  }
  return [formatDuration(numValue).display, 'Tempo'];
}}
```

---

### 4. Supabase RPC Type Error - funil.ts
```
Argument of type '"get_funil_data"' is not assignable to parameter of type 
'"get_dashboard_data" | "get_user_tenant_id" | ...'
```

**Causa:** Função `get_funil_data` ainda não existe nos tipos gerados do Supabase

**Solução:**
```typescript
// @ts-expect-error - Function will be created by running sql/dashboard/03_function_funil.sql
const { data, error } = await supabase.rpc('get_funil_data', {
  p_tenant_id: tenantId,
  p_days_ago: daysAgo,
  p_channel_id: channelId,
});
```

---

## ✅ Validação Final

### Build Completo
```bash
npm run build
```

**Resultado:** ✅ Sucesso
```
✓ Compiled successfully in 35.0s
✓ Generating static pages (31/31) in 3.8s
✓ Finalizing page optimization
```

### Rotas Criadas
- ✅ `/api/funil` - API endpoint
- ✅ `/relatorios/funil` - Página do relatório

---

## 📝 Lições Aprendidas

### 1. Recharts Tooltip Formatter
- Sempre permitir `undefined` nos parâmetros
- Valor pode ser `string | number | array`
- Usar type guards para conversão segura

### 2. Supabase RPC com Funções Customizadas
- Adicionar `@ts-expect-error` com comentário explicativo
- Rodar SQL antes para gerar tipos (ideal)
- Ou usar type casting: `await supabase.rpc('fn' as any, ...)`

### 3. TypeScript Strict Mode
- Next.js usa modo strict
- Variáveis não usadas causam erro
- Prefixar com `_` se intencional (ex: `_name`)

---

## 🚀 Próximos Passos

1. ✅ Build passou com sucesso
2. ⏳ Executar SQL no Supabase
3. ⏳ Testar localmente
4. ⏳ Regenerar tipos Supabase (opcional)

---

**✨ Todos os erros resolvidos! Build limpo e pronto para deploy!**








