# Melhorias no Filtro de Data Personalizado

## Status Atual

### ✅ Implementado
- Frontend: Calendário duplo com seleção de data início e fim
- Hooks: Suporte para customStartDate e customEndDate
- API Routes: Parse de startDate e endDate
- Query Layer: Passagem de parâmetros p_start_date e p_end_date

### ⚠️ Pendente - Backend (SQL)
**IMPORTANTE**: As funções PostgreSQL ainda NÃO foram atualizadas para aceitar os novos parâmetros de data personalizada.

**Funções que precisam ser atualizadas**:
1. `get_dashboard_data` (sql/dashboard/02_function_dashboard.sql)
2. `get_funil_data` (sql/dashboard/03_function_funil.sql)
3. `get_tags_data` (sql/dashboard/04_function_tags.sql)

**Alterações necessárias em cada função**:
```sql
-- Adicionar parâmetros opcionais
p_start_date TIMESTAMP DEFAULT NULL,
p_end_date TIMESTAMP DEFAULT NULL,

-- Lógica condicional para usar date range OU days_ago
-- Se p_start_date e p_end_date forem fornecidos, usar eles
-- Caso contrário, usar p_days_ago (comportamento atual)
```

## Problemas de UX Identificados

### 1. Calendário em Inglês
**Problema**: Os nomes dos meses e dias da semana estão em inglês, mas o app usa português.

**Impacto**: Inconsistência de idioma prejudica a experiência do usuário brasileiro.

**Solução Necessária**: Configurar locale pt-BR no react-day-picker.

---

### 2. Ausência de Tratamento de Erros
**Problema**: Usuário pode tentar selecionar datas inválidas sem receber feedback.

**Cenários problemáticos**:
- Selecionar data fim antes da data início
- Selecionar datas futuras
- Tentar aplicar com apenas uma data selecionada
- Range muito grande (pode sobrecarregar banco)

**Impacto**: Frustração do usuário e possíveis erros na API.

**Soluções Necessárias**:
- Mensagens de erro claras e visíveis
- Validação em tempo real
- Desabilitar botão "Aplicar" quando inválido
- Toast/Alert para erros específicos

---

### 3. Falta de Feedback Visual de Seleção
**Problema**: Após clicar na data, não há indicação visual clara de que foi selecionada.

**Comportamento atual**:
- Usuário clica na data início → sem feedback claro
- Usuário clica na data fim → sem feedback claro
- Usuário não tem certeza se as datas foram selecionadas

**Impacto**: Usuário fica confuso, pode clicar múltiplas vezes.

**Solução Necessária**:
- Data selecionada deve ficar destacada com cor diferente
- Range entre data início e fim deve ser visualmente preenchido
- Mostrar label com as datas selecionadas antes de aplicar

---

## Planejamento de Melhorias

### Melhoria 1: Internacionalização (i18n) - pt-BR

**Objetivo**: Exibir calendário em português brasileiro.

**Implementação**:
1. Importar `ptBR` do `date-fns/locale`
2. Passar `locale={ptBR}` para ambos os componentes Calendar
3. Verificar se labels personalizados são necessários

**Arquivos afetados**:
- `components/dashboard/dashboard-header.tsx`
- `components/ui/calendar.tsx` (pode precisar de customização)

**Estimativa**: Simples (já temos date-fns importado)

**Exemplo**:
```tsx
<Calendar
  mode="single"
  selected={startDate}
  onSelect={setStartDate}
  locale={ptBR}
  // ...
/>
```

---

### Melhoria 2: Validação e Tratamento de Erros

**Objetivo**: Validar entradas e mostrar mensagens de erro claras.

**Validações necessárias**:

1. **Data Fim < Data Início**
   - Quando: Ao selecionar data fim
   - Ação: Mostrar mensagem "Data fim deve ser posterior à data início"
   - UI: Toast ou texto de erro vermelho

2. **Datas Futuras**
   - Quando: Ao tentar selecionar data futura
   - Ação: Desabilitar automaticamente (já implementado via `disabled`)
   - UI: Dias futuros em cinza com cursor not-allowed

3. **Apenas Uma Data Selecionada**
   - Quando: Tentar aplicar com start OU end undefined
   - Ação: Botão "Aplicar" desabilitado (já implementado)
   - UI: Mensagem "Selecione ambas as datas"

4. **Range Muito Grande (opcional)**
   - Quando: Diferença > 365 dias
   - Ação: Mostrar warning "Período muito longo pode afetar performance"
   - UI: Toast amarelo de aviso

**Implementação**:
1. Criar função de validação `validateDateRange(start, end)`
2. Adicionar state para mensagens de erro
3. Instalar/usar componente Toast (Sonner ou shadcn Toast)
4. Atualizar handlers onSelect para validar em tempo real

**Arquivos afetados**:
- `components/dashboard/dashboard-header.tsx`
- Possível novo arquivo: `lib/utils/date-validation.ts`

**Estimativa**: Moderada

---

### Melhoria 3: Feedback Visual de Seleção (Range Picker)

**Objetivo**: Mostrar visualmente o range de datas selecionado.

**Comportamento desejado**:
1. **Data Início Selecionada**:
   - Dia fica com fundo azul/primary
   - Borda arredondada à esquerda

2. **Data Fim Selecionada**:
   - Dia fica com fundo azul/primary
   - Borda arredondada à direita

3. **Dias Entre Início e Fim**:
   - Fundo azul claro/accent
   - Sem bordas arredondadas (retangular)
   - Visualmente conectados formando um "bloco"

4. **Label de Resumo**:
   - Acima dos calendários: "De: DD/MM/AAAA até: DD/MM/AAAA"
   - Atualiza em tempo real conforme seleção

**Implementação - Opção A: Mode "range" do react-day-picker**
```tsx
<Calendar
  mode="range"
  selected={{ from: startDate, to: endDate }}
  onSelect={(range) => {
    setStartDate(range?.from);
    setEndDate(range?.to);
  }}
/>
```

**Vantagens**:
- Nativo do react-day-picker
- Feedback visual automático
- Menos código customizado

**Desvantagens**:
- Precisa refatorar lógica atual
- Pode ter conflito com dois calendários separados

**Implementação - Opção B: Customizar classes CSS**
```tsx
// Adicionar classes dinâmicas baseadas no range
const isInRange = (date) => {
  if (!startDate || !endDate) return false;
  return date >= startDate && date <= endDate;
};

classNames={{
  day: (date) => {
    if (isInRange(date)) return "bg-accent";
    if (date === startDate || date === endDate) return "bg-primary";
    return "";
  }
}}
```

**Vantagens**:
- Mais controle sobre estilo
- Mantém estrutura de dois calendários

**Desvantagens**:
- Mais código customizado
- Precisa implementar lógica de range

**Recomendação**: Opção A (mode="range") com refatoração

**Arquivos afetados**:
- `components/dashboard/dashboard-header.tsx`
- `components/ui/calendar.tsx`

**Estimativa**: Moderada a Complexa

---

### Melhoria 4: Label de Confirmação Visual

**Objetivo**: Mostrar resumo das datas selecionadas antes de aplicar.

**Implementação**:
```tsx
{startDate && endDate && (
  <div className="p-3 bg-muted rounded-md text-sm">
    <p className="font-medium">Período selecionado:</p>
    <p className="text-muted-foreground">
      De {format(startDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
      {' '}até{' '}
      {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
    </p>
    <p className="text-xs text-muted-foreground mt-1">
      Total: {differenceInDays(endDate, startDate) + 1} dias
    </p>
  </div>
)}
```

**Posicionamento**: Entre os calendários e os botões Aplicar/Limpar.

**Arquivos afetados**:
- `components/dashboard/dashboard-header.tsx`

**Estimativa**: Simples

---

## Ordem de Implementação Sugerida

### Fase 1: Melhorias Rápidas (Alta prioridade, baixa complexidade)
1. ✅ Internacionalização pt-BR - **CONCLUÍDO** (20/12/2025)
2. ✅ Label de confirmação visual - **CONCLUÍDO** (20/12/2025)
3. ✅ Validação básica (datas vazias, futuras) - **CONCLUÍDO** (20/12/2025)

### Fase 2: UX Avançada (Alta prioridade, média complexidade)
4. ✅ Feedback visual de range (mode="range") - **CONCLUÍDO** (20/12/2025)
5. ✅ Tratamento de erros com Toast - **CONCLUÍDO** (20/12/2025)
6. ✅ Warning para períodos longos (90-365 dias) - **CONCLUÍDO** (20/12/2025)
7. ✅ Loading state ao aplicar datas - **CONCLUÍDO** (20/12/2025)
8. ✅ Tratamento de timezone (UTC) - **CONCLUÍDO** (20/12/2025)

### Fase 3: Backend (BLOQUEANTE para produção)
6. ✅ **get_dashboard_data**: Atualizada com p_start_date e p_end_date - **CONCLUÍDO**
7. ⚠️ **get_funil_data**: Precisa ser atualizada - **PENDENTE**
8. ⚠️ **get_tags_data**: Precisa ser atualizada - **PENDENTE**
9. ⚠️ Testar queries com date ranges customizados - **PENDENTE**
10. ⚠️ Validar performance com ranges grandes - **PENDENTE**

---

## Checklist de Implementação

### Frontend - ✅ **CONCLUÍDO** (20/12/2025)
- [x] Configurar locale pt-BR nos calendários
- [x] Adicionar label de resumo de período
- [x] Implementar validação de datas
- [x] Adicionar mensagens de erro
- [x] Refatorar para mode="range" 
- [x] Adicionar Toast component (Sonner)
- [x] Testar todos os cenários de erro
- [x] Warning para ranges longos (90-365 dias)
- [x] Loading state ao aplicar período
- [x] Tratamento de timezone com utilitários dedicados

### Backend (SQL) - ⚠️ **PARCIALMENTE CONCLUÍDO**
- [x] Atualizar `sql/dashboard/02_function_get_dashboard_data.sql` - ✅ **COMPLETO**
  - [x] Adicionar parâmetros p_start_date e p_end_date
  - [x] Implementar lógica condicional date range vs days_ago
  - [x] Ajustar WHERE clauses para usar BETWEEN quando date range fornecido
  - [x] Testar função com ambos os modos (days_ago e date range)

- [ ] Atualizar `sql/dashboard/03_function_funil.sql` - ⚠️ **PENDENTE**
  - [ ] Adicionar parâmetros p_start_date e p_end_date
  - [ ] Implementar lógica condicional
  - [ ] Ajustar filtros de conversas por data
  - [ ] Testar cálculos de KPIs com date range customizado

- [ ] Atualizar `sql/dashboard/04_function_tags.sql` - ⚠️ **PENDENTE**
  - [ ] Adicionar parâmetros p_start_date e p_end_date
  - [ ] Implementar lógica condicional
  - [ ] Ajustar agregações por data
  - [ ] Testar performance com ranges grandes

- [ ] Testar integração end-to-end
  - [x] Dashboard principal com date range - ✅ Frontend pronto
  - [ ] Relatório Conversas com date range
  - [ ] Relatório Tags com date range
  - [ ] Validar consistência de dados entre relatórios

### Validação - ⚠️ **AGUARDANDO BACKEND**
- [x] Testar com range de 1 dia - Frontend validado
- [x] Testar com range de 30 dias - Frontend validado
- [x] Testar com range de 90+ dias - Frontend com warning
- [x] Testar transição entre filtros (7dias → custom → 30dias)
- [x] Cache invalidation no React Query funcionando
- [ ] Testar em mobile (responsividade dos calendários)
- [ ] Validar dados retornados do backend com custom range

---

## Riscos e Considerações

### 1. Performance com Ranges Grandes
**Risco**: Queries SQL podem ficar lentas com ranges muito longos.

**Mitigação**:
- Adicionar limite máximo (ex: 365 dias)
- Mostrar warning ao usuário
- Implementar paginação se necessário
- Adicionar índices nas colunas de data

### 2. Timezone e Fuso Horário
**Risco**: Diferenças de timezone entre frontend e backend.

**Mitigação**:
- Sempre usar UTC nas APIs
- Converter para timezone local apenas na UI
- Documentar convenção de timezone

### 3. Cache Invalidation
**Risco**: Dados antigos em cache após mudar datas.

**Mitigação**:
- QueryKey já inclui customStartDate e customEndDate
- Testar transições entre filtros
- Adicionar refetch manual se necessário

### 4. UX em Mobile
**Risco**: Dois calendários podem não caber bem em telas pequenas.

**Mitigação**:
- Testar em diferentes resoluções
- Considerar calendário único com mode="range"
- Adicionar scroll se necessário (já implementado: max-h-[600px])

---

## Referências

- [react-day-picker v9 Docs](https://daypicker.dev/)
- [date-fns Locale pt-BR](https://date-fns.org/v2.29.3/docs/Locale)
- [shadcn/ui Calendar](https://ui.shadcn.com/docs/components/calendar)
- [shadcn/ui Toast](https://ui.shadcn.com/docs/components/toast)

---

## Notas de Implementação

### Mode "range" vs Dual Calendars

**Vantagens do mode="range"**:
- Feedback visual nativo
- Menos código
- Melhor UX

**Desvantagens**:
- Precisa refatorar state management
- Pode ser confuso ter único calendário com duas funções

**Decisão**: Avaliar com usuário durante implementação.

---

## Próximos Passos Imediatos

1. ~~**Discutir com stakeholder**~~ - ✅ **CONCLUÍDO**
   - ✅ Escolhido: mode="range" único (implementado)
   - ✅ Limite máximo: 365 dias (implementado)
   - ✅ Prioridade: UX melhorada primeiro (concluída)

2. ~~**Implementar Fase 1 e 2**~~ - ✅ **CONCLUÍDO** (20/12/2025)
   - ✅ pt-BR locale
   - ✅ Label de confirmação
   - ✅ Validação completa com warnings
   - ✅ Sistema de Toast (Sonner)
   - ✅ Loading states
   - ✅ Tratamento de timezone

3. **Agendar trabalho de Backend SQL** - ⚠️ **PENDENTE** (PRÓXIMO PASSO)
   - ⚠️ Atualizar `get_funil_data` 
   - ⚠️ Atualizar `get_tags_data`
   - ⚠️ Precisa acesso ao Supabase/PostgreSQL
   - 📄 Documentação técnica criada: `SQL_FUNCTIONS_STATUS.md`

4. **Testar com usuários reais** - ⏳ **AGUARDANDO BACKEND**
   - Validar se UX atende expectativas
   - Identificar edge cases adicionais
   - Testar performance com ranges grandes em produção

---

## 📋 Documentação Adicional Criada

- ✅ **`SQL_FUNCTIONS_STATUS.md`**: Status detalhado de todas as funções SQL
  - Auditoria completa de cada função
  - Checklist de deploy
  - Comandos úteis para atualização
  - Análise de riscos e mitigações
