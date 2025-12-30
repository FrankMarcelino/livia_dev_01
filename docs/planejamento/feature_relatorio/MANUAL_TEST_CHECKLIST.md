# ✅ Checklist de Testes Manuais - Date Range Personalizado

**Data**: 20/12/2025  
**Versão**: 1.0.0  
**URL**: http://localhost:3000/dashboard

---

## 🎯 Objetivo

Validar todas as funcionalidades implementadas do filtro de data personalizado antes de considerar a feature completa.

---

## 📋 Testes de Funcionalidade Básica

### 1. Abrir o Calendário

- [ ] 1.1. Acessar `/dashboard`
- [ ] 1.2. Selecionar "Personalizado" no dropdown de período
- [ ] 1.3. Clicar no botão com ícone de calendário
- [ ] 1.4. ✅ **Esperado**: Popover abre com calendário duplo

---

### 2. Idioma e Localização

- [ ] 2.1. Verificar nomes dos meses no calendário
- [ ] 2.2. ✅ **Esperado**: Meses em português (Janeiro, Fevereiro, etc.)
- [ ] 2.3. Verificar dias da semana
- [ ] 2.4. ✅ **Esperado**: Dom, Seg, Ter, Qua, Qui, Sex, Sáb

---

### 3. Seleção de Range Visual

- [ ] 3.1. Clicar em uma data de início (ex: dia 10)
- [ ] 3.2. ✅ **Esperado**: Data fica destacada em azul
- [ ] 3.3. Clicar em uma data de fim (ex: dia 20)
- [ ] 3.4. ✅ **Esperado**: 
  - Data de início com fundo azul escuro
  - Data de fim com fundo azul escuro
  - Dias intermediários com fundo azul claro
  - Efeito visual de "bloco contínuo"

---

### 4. Resumo do Período

- [ ] 4.1. Após selecionar início e fim
- [ ] 4.2. ✅ **Esperado**: Exibir card com:
  ```
  Período selecionado:
  De [DD de MMMM de YYYY]
  até [DD de MMMM de YYYY]
  Total: X dias
  ```
- [ ] 4.3. Verificar formato de data em português
- [ ] 4.4. Verificar contagem correta de dias

---

## 🚨 Testes de Validação de Erros

### 5. Data Fim Antes da Data Início

- [ ] 5.1. Selecionar data início: dia 20
- [ ] 5.2. Selecionar data fim: dia 10
- [ ] 5.3. ✅ **Esperado**:
  - Card de erro vermelho aparece
  - Mensagem: "Data fim deve ser posterior à data início"
  - Botão "Aplicar" está desabilitado

---

### 6. Range Maior que 365 Dias

- [ ] 6.1. Selecionar data início: 01/01/2024
- [ ] 6.2. Selecionar data fim: 01/02/2025
- [ ] 6.3. ✅ **Esperado**:
  - Card de erro vermelho aparece
  - Mensagem: "Período máximo permitido é de 365 dias"
  - Botão "Aplicar" está desabilitado

---

### 7. Apenas Uma Data Selecionada

- [ ] 7.1. Selecionar apenas data início (não selecionar fim)
- [ ] 7.2. ✅ **Esperado**:
  - Card de erro vermelho aparece
  - Mensagem: "Selecione ambas as datas (início e fim)"
  - Botão "Aplicar" está desabilitado

---

### 8. Datas Futuras Bloqueadas

- [ ] 8.1. Tentar clicar em uma data futura
- [ ] 8.2. ✅ **Esperado**:
  - Dia futuro está em cinza
  - Cursor mostra "not-allowed"
  - Não é possível selecionar

---

## ⚠️ Testes de Warning

### 9. Range Entre 90 e 365 Dias

- [ ] 9.1. Selecionar data início: 01/10/2024
- [ ] 9.2. Selecionar data fim: 20/12/2024 (80+ dias)
- [ ] 9.3. ✅ **Esperado**:
  - Card de warning amarelo aparece
  - Mensagem: "⚠️ Período longo (X dias) pode afetar a performance"
  - Botão "Aplicar" está **HABILITADO** (warning não bloqueia)

---

## 🔔 Testes de Notificações (Toast)

### 10. Toast de Sucesso (Range Curto < 90 dias)

- [ ] 10.1. Selecionar range de 30 dias
- [ ] 10.2. Clicar em "Aplicar"
- [ ] 10.3. ✅ **Esperado**:
  - Toast verde aparece no canto
  - Título: "✓ Período personalizado aplicado"
  - Descrição: "Exibindo dados de 30 dias"
  - Toast desaparece após alguns segundos

---

### 11. Toast de Warning (Range Longo 90-365 dias)

- [ ] 11.1. Selecionar range de 120 dias
- [ ] 11.2. Clicar em "Aplicar"
- [ ] 11.3. ✅ **Esperado**:
  - Toast amarelo aparece
  - Título: "⚠ Período longo selecionado"
  - Descrição: "Carregando 120 dias de dados. Isso pode levar alguns segundos..."
  - Toast fica visível por 5 segundos

---

### 12. Toast de Erro (Validação Falhou)

- [ ] 12.1. Selecionar data fim antes da data início
- [ ] 12.2. Forçar clique no botão "Aplicar" (se possível via devtools)
- [ ] 12.3. ✅ **Esperado**:
  - Toast vermelho aparece
  - Título: "✗ Erro ao aplicar período"
  - Descrição: "Data fim deve ser posterior à data início"

---

## ⏳ Testes de Loading State

### 13. Loading ao Aplicar

- [ ] 13.1. Selecionar range válido
- [ ] 13.2. Clicar em "Aplicar"
- [ ] 13.3. ✅ **Esperado** (observar rapidamente):
  - Botão mostra spinner animado (⟳)
  - Texto muda para "Aplicando..."
  - Botão fica desabilitado
  - Após processamento, popover fecha

---

## 🔄 Testes de Interação

### 14. Botão Limpar

- [ ] 14.1. Selecionar range qualquer
- [ ] 14.2. Clicar em "Limpar"
- [ ] 14.3. ✅ **Esperado**:
  - Ambas as datas são desmarcadas
  - Resumo do período desaparece
  - Erros/warnings são limpos
  - Popover fecha

---

### 15. Mudança de Mês no Calendário

- [ ] 15.1. Clicar na seta "→" para avançar mês
- [ ] 15.2. ✅ **Esperado**: Calendários avançam 1 mês
- [ ] 15.3. Clicar na seta "←" para voltar
- [ ] 15.4. ✅ **Esperado**: Calendários voltam 1 mês

---

### 16. Transição Entre Filtros

- [ ] 16.1. Aplicar filtro "Últimos 7 dias"
- [ ] 16.2. Observar dados carregados
- [ ] 16.3. Mudar para "Personalizado"
- [ ] 16.4. Selecionar e aplicar range de 30 dias
- [ ] 16.5. ✅ **Esperado**:
  - Dados recarregam automaticamente
  - Loading state é exibido
  - Dashboard atualiza com novo período

---

## 🎨 Testes Visuais

### 17. Responsividade

- [ ] 17.1. Abrir DevTools (F12)
- [ ] 17.2. Ativar modo responsivo (Ctrl+Shift+M)
- [ ] 17.3. Testar em mobile (375px)
- [ ] 17.4. ✅ **Esperado**:
  - Calendários se adaptam (podem empilhar verticalmente)
  - Scroll funciona se necessário
  - Botões são clicáveis
  - Popover não sai da tela

---

### 18. Dark Mode

- [ ] 18.1. Mudar para tema escuro (se disponível)
- [ ] 18.2. ✅ **Esperado**:
  - Calendário adapta cores
  - Erros/warnings legíveis
  - Contraste adequado
  - Range visual destaca corretamente

---

## 🧪 Testes de Integração (Backend)

### 19. Dados Retornados com Custom Range

⚠️ **NOTA**: Este teste depende do backend atualizado

- [ ] 19.1. Abrir DevTools → Network
- [ ] 19.2. Aplicar range personalizado de 15 dias
- [ ] 19.3. Observar requisição para `/api/dashboard`
- [ ] 19.4. ✅ **Esperado** (request):
  ```json
  {
    "startDate": "2024-12-01T00:00:00.000Z",
    "endDate": "2024-12-15T23:59:59.999Z"
  }
  ```
- [ ] 19.5. ✅ **Esperado** (response):
  - Status 200
  - Dados filtrados pelo período
  - KPIs corretos para o range

---

### 20. Consistência Entre Dashboard e Relatórios

⚠️ **NOTA**: Requer funções SQL atualizadas

- [ ] 20.1. Aplicar range de 30 dias no dashboard
- [ ] 20.2. Anotar valor do KPI "Total de Conversas": ___
- [ ] 20.3. Ir para relatório de Funil
- [ ] 20.4. ✅ **Esperado**: Mesmo período aplicado
- [ ] 20.5. ✅ **Esperado**: Total de conversas consistente
- [ ] 20.6. Ir para relatório de Tags
- [ ] 20.7. ✅ **Esperado**: Mesmo período aplicado
- [ ] 20.8. ✅ **Esperado**: Total de conversas consistente

---

## 🚀 Testes de Performance

### 21. Range de 1 Dia

- [ ] 21.1. Selecionar apenas hoje
- [ ] 21.2. Aplicar
- [ ] 21.3. ✅ **Esperado**:
  - Carregamento rápido (< 1s)
  - Sem toast de warning

---

### 22. Range de 90 Dias

- [ ] 22.1. Selecionar 90 dias
- [ ] 22.2. Aplicar
- [ ] 22.3. ✅ **Esperado**:
  - Toast de warning aparece
  - Carregamento aceitável (< 5s)
  - Dados corretos

---

### 23. Range de 365 Dias (Máximo)

- [ ] 23.1. Selecionar 365 dias
- [ ] 23.2. Aplicar
- [ ] 23.3. ✅ **Esperado**:
  - Toast de warning aparece
  - Carregamento pode ser lento (< 10s)
  - Sem erros de timeout
  - Gráficos renderizam corretamente

---

## 🐛 Testes de Edge Cases

### 24. Clicar Fora do Popover

- [ ] 24.1. Abrir calendário
- [ ] 24.2. Clicar fora do popover
- [ ] 24.3. ✅ **Esperado**:
  - Popover **NÃO** fecha (onInteractOutside prevented)
  - Datas selecionadas são mantidas

---

### 25. Trocar de Filtro Sem Aplicar

- [ ] 25.1. Abrir calendário
- [ ] 25.2. Selecionar range mas NÃO clicar em Aplicar
- [ ] 25.3. Mudar dropdown para "Últimos 7 dias"
- [ ] 25.4. ✅ **Esperado**:
  - Dashboard usa "Últimos 7 dias"
  - Range personalizado não é aplicado
  - Sem erros no console

---

### 26. Atualizar Página

- [ ] 26.1. Aplicar range personalizado
- [ ] 26.2. F5 (refresh)
- [ ] 26.3. ✅ **Esperado**:
  - Filtro volta para "Últimos 30 dias" (comportamento padrão)
  - Sem erros

---

### 27. Múltiplas Aplicações Seguidas

- [ ] 27.1. Aplicar range de 7 dias → Aguardar
- [ ] 27.2. Aplicar range de 15 dias → Aguardar
- [ ] 27.3. Aplicar range de 30 dias → Aguardar
- [ ] 27.4. ✅ **Esperado**:
  - Cada transição carrega corretamente
  - Cache é invalidado adequadamente
  - Sem toasts duplicados

---

## 📊 Resultados

### Resumo de Testes

| Categoria | Total | Passou | Falhou | Pendente |
|-----------|-------|--------|--------|----------|
| Funcionalidade Básica | 4 | ___ | ___ | ___ |
| Validação de Erros | 4 | ___ | ___ | ___ |
| Warnings | 1 | ___ | ___ | ___ |
| Notificações | 3 | ___ | ___ | ___ |
| Loading State | 1 | ___ | ___ | ___ |
| Interação | 3 | ___ | ___ | ___ |
| Visual | 2 | ___ | ___ | ___ |
| Integração Backend | 2 | ___ | ___ | ⚠️ |
| Performance | 3 | ___ | ___ | ___ |
| Edge Cases | 4 | ___ | ___ | ___ |
| **TOTAL** | **27** | **___** | **___** | **___** |

---

## 🔧 Bugs Encontrados

| ID | Descrição | Severidade | Status |
|----|-----------|------------|--------|
| - | - | - | - |

---

## 📝 Observações

_Espaço para anotações durante os testes..._

---

## ✅ Checklist Final de Aprovação

Antes de considerar a feature completa:

- [ ] Todos os testes funcionais passaram
- [ ] Sem erros no console do navegador
- [ ] Sem erros de linter
- [ ] TypeScript sem erros de tipo
- [ ] Performance aceitável (< 10s para 365 dias)
- [ ] Responsividade validada (mobile + desktop)
- [ ] Dark mode funciona corretamente
- [ ] Documentação atualizada
- [ ] ⚠️ Funções SQL atualizadas (`get_funil_data`, `get_tags_data`)
- [ ] ⚠️ Testes de integração backend passaram

---

## 🚀 Aprovação para Produção

**Testado por**: ___________________  
**Data**: ___/___/______  
**Aprovado**: [ ] Sim [ ] Não [ ] Com ressalvas

**Ressalvas**:
_______________________________________
_______________________________________

---

**Versão**: 1.0.0  
**Última atualização**: 20/12/2025






