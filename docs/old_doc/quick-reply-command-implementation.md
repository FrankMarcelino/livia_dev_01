# Implementação: Atalho "/" para Respostas Rápidas

## 📋 Resumo

Implementação do **Command Palette Pattern** para ativação de respostas rápidas através de atalhos de teclado, similar ao WhatsApp Web.

### Triggers Implementados

- **`/`** → Abre command palette com **todas as respostas rápidas**
- **`//`** → Abre command palette com as **5 respostas mais populares**

---

## 🏗️ Arquitetura

### Princípios SOLID Aplicados

✅ **SRP (Single Responsibility Principle)**
- `useQuickReplyCommand`: Apenas detecção de triggers e gerenciamento de estado
- `QuickReplyCommand`: Apenas renderização do command palette
- `MessageInput`: Orquestração dos componentes

✅ **OCP (Open/Closed Principle)**
- Sistema extensível para novos triggers (@ para menções, # para hashtags)
- Modo `QuickReplyMode` pode ser estendido facilmente

✅ **DIP (Dependency Inversion Principle)**
- Hook usa callbacks abstratos (`onRemoveText`, `onShouldOpen`)
- Componente não depende de implementações concretas de state

---

## 📁 Arquivos Criados/Modificados

### 1. Hook Customizado
**Arquivo:** [`hooks/use-quick-reply-command.ts`](/home/frank/projeto/hooks/use-quick-reply-command.ts)

**Responsabilidades:**
- Detectar "/" e "//" em contexto válido (início ou após espaço/quebra)
- Gerenciar timeout de 300ms para distinção entre "/" e "//"
- Controlar estado do command (aberto/fechado, modo, posição)
- Fornecer callbacks para remoção de texto

**Interface:**
```typescript
interface UseQuickReplyCommandReturn {
  isOpen: boolean;
  mode: QuickReplyMode; // 'all' | 'popular'
  triggerPosition: number;
  openCommand: (mode, position) => void;
  closeCommand: () => void;
  handleTextareaInput: (value, selectionStart) => void;
}
```

**Algoritmo de Detecção:**
```
1. Usuário digita "/" em contexto válido
   └─> Inicia timeout de 300ms

2a. Se timeout completa sem segunda "/"
    ├─> Remove "/" do textarea
    └─> Abre command em modo "all"

2b. Se segunda "/" é digitada antes do timeout
    ├─> Cancela timeout
    ├─> Remove ambos "//" do textarea
    └─> Abre command em modo "popular"
```

---

### 2. Componente Command Palette
**Arquivo:** [`components/livechat/quick-reply-command.tsx`](/home/frank/projeto/components/livechat/quick-reply-command.tsx)

**Responsabilidades:**
- Renderizar CommandDialog com busca integrada
- Carregar respostas rápidas (todas ou populares) via API
- Processar variáveis `{nome_cliente}`, `{protocolo}`, `{data}`, `{hora}`
- Incrementar contador de uso ao selecionar
- Navegação por teclado (↑↓ Enter Esc)

**Props:**
```typescript
interface QuickReplyCommandProps {
  isOpen: boolean;
  onClose: () => void;
  mode: QuickReplyMode;
  tenantId: string;
  contactName: string;
  conversationId: string;
  onSelect: (content: string, quickReplyId: string) => void;
}
```

**Features:**
- ✅ Busca fuzzy integrada (via cmdk)
- ✅ Renderização de emoji customizado
- ✅ Contador de uso (modo popular)
- ✅ Preview truncado do conteúdo
- ✅ Loading state
- ✅ Empty state

---

### 3. Integração no MessageInput
**Arquivo:** [`components/livechat/message-input.tsx`](/home/frank/projeto/components/livechat/message-input.tsx)

**Mudanças:**
```typescript
// 1. Adicionado ref para manipular cursor
const textareaRef = useRef<HTMLTextAreaElement>(null);

// 2. Hook de command palette
const quickReplyCommand = useQuickReplyCommand({
  onRemoveText: (start, length) => {
    // Remove "/" ou "//" do content
    // Atualiza cursor para posição correta
  }
});

// 3. Novo handler para onChange
const handleContentChange = (e) => {
  setContent(e.target.value);
  quickReplyCommand.handleTextareaInput(
    e.target.value,
    e.target.selectionStart
  );
};

// 4. Handler de seleção do command
const handleQuickReplyCommandSelect = (content, id) => {
  // Insere texto na posição do trigger
  // Move cursor para final do texto inserido
};
```

---

### 4. Correção no Textarea Component
**Arquivo:** [`components/ui/textarea.tsx`](/home/frank/projeto/components/ui/textarea.tsx)

**Mudança:**
```typescript
// ANTES: Não suportava ref
function Textarea({ className, ...props }) { ... }

// DEPOIS: Suporta ref via forwardRef
const Textarea = React.forwardRef<HTMLTextAreaElement, ...>(
  ({ className, ...props }, ref) => {
    return <textarea ref={ref} ... />
  }
);
```

---

## 🔄 Fluxo de Execução

### Cenário 1: Usuário digita "/"

```
1. Usuário digita "/" no textarea
   ↓
2. onChange dispara → handleContentChange
   ↓
3. content atualizado com "/"
   ↓
4. quickReplyCommand.handleTextareaInput detecta "/"
   ↓
5. Contexto válido? (início ou após espaço)
   ├─ NÃO → Ignora, "/" permanece no texto
   └─ SIM → Inicia timeout de 300ms
   ↓
6. Após 300ms (se não houver segunda "/")
   ↓
7. onRemoveText chamado → remove "/" do content
   ↓
8. openCommand('all', position) → abre command
   ↓
9. CommandDialog renderiza com todas as respostas
   ↓
10. Usuário seleciona resposta
    ↓
11. handleQuickReplyCommandSelect insere texto
    ↓
12. Cursor movido para final do texto inserido
```

### Cenário 2: Usuário digita "//"

```
1. Usuário digita primeiro "/"
   ↓
2. handleTextareaInput detecta → inicia timeout
   ↓
3. Usuário digita segundo "/" (antes de 300ms)
   ↓
4. handleTextareaInput detecta segunda "/"
   ↓
5. Verifica se está adjacente à primeira?
   └─ SIM → Cancela timeout
   ↓
6. onRemoveText chamado → remove ambos "//"
   ↓
7. openCommand('popular', position)
   ↓
8. CommandDialog renderiza com top 5 populares
   ↓
9. Usuário seleciona resposta...
```

---

## ⌨️ Navegação e UX

### Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `/` | Abre todas as respostas (após 300ms) |
| `//` | Abre respostas populares (imediato) |
| `↑` `↓` | Navega entre opções |
| `Enter` | Seleciona resposta |
| `Esc` | Fecha command |
| Digitar | Filtra respostas (busca fuzzy) |

### Contexto Válido para "/"

O trigger só é ativado quando "/" é digitado:
- ✅ No início do textarea (posição 0)
- ✅ Após espaço ` /`
- ✅ Após quebra de linha `\n/`
- ❌ No meio de palavra `teste/algo`
- ❌ Em URLs `https://exemplo.com`

---

## 🎨 UI/UX Features

### Command Dialog

**Layout:**
```
┌─────────────────────────────────────┐
│ Respostas Rápidas              [×]  │ ← Header
├─────────────────────────────────────┤
│ 🔍 [Buscar resposta rápida...    ] │ ← Search
├─────────────────────────────────────┤
│ Todas as Respostas                  │ ← Group heading
│                                     │
│ 👋 Saudação                     5x  │ ← Item (emoji + title + count)
│    Olá! Como posso ajudar?          │ ← Preview
│                                     │
│ 📞 Horário de Atendimento      12x  │
│    Nosso horário é de segunda...    │
│                                     │
│ ...                                 │
└─────────────────────────────────────┘
```

**Modo Popular:**
- Título: "Respostas Rápidas Populares"
- Heading: "⚡ Mais Utilizadas"
- Limitado a 5 respostas
- Exibe contador de uso ao lado do título

**Modo All:**
- Título: "Respostas Rápidas"
- Heading: "Todas as Respostas"
- Exibe todas as respostas ativas do tenant

---

## 🧪 Testes Recomendados

### Casos de Teste

#### 1. Detecção de Trigger
- [ ] "/" no início do textarea abre modo "all"
- [ ] "/" após espaço abre modo "all"
- [ ] "/" após quebra de linha abre modo "all"
- [ ] "/" no meio de palavra não abre command
- [ ] "//" abre modo "popular"
- [ ] "//" com mais de 300ms entre barras abre modo "all" duas vezes

#### 2. Inserção de Texto
- [ ] Selecionar resposta insere no local do trigger
- [ ] Cursor move para final do texto inserido
- [ ] Texto antes do trigger é preservado
- [ ] Texto depois do trigger é preservado
- [ ] Variáveis são substituídas corretamente

#### 3. Navegação
- [ ] Esc fecha o command
- [ ] Arrow keys navegam entre opções
- [ ] Enter seleciona resposta
- [ ] Busca filtra corretamente
- [ ] Click fora fecha o command

#### 4. Edge Cases
- [ ] Textarea vazio com "/" funciona
- [ ] "/" no final de texto longo funciona
- [ ] Múltiplos "/" espaçados funcionam independentemente
- [ ] Command fecha ao selecionar resposta
- [ ] Loading state durante fetch de respostas

---

## 📊 Performance

### Métricas Esperadas

- **Detecção de trigger:** < 10ms (síncrono)
- **Timeout para "/":** 300ms (configurável)
- **Abertura do command:** < 50ms (React render)
- **Fetch de respostas:** < 500ms (API call)
- **Inserção de texto:** < 20ms (state update)

### Otimizações Aplicadas

1. **Fire-and-forget para uso**
   - `incrementUsage` não bloqueia UI
   - Erro não afeta experiência do usuário

2. **Refs para manipulação de cursor**
   - Evita re-renders desnecessários
   - Manipulação direta do DOM quando necessário

3. **Cleanup de timers**
   - `useEffect` cleanup previne memory leaks
   - Timers cancelados ao desmontar componente

---

## 🔧 Configuração e Extensibilidade

### Adicionar Novo Trigger

Para adicionar um novo trigger (ex: "@" para menções):

```typescript
// 1. Estender QuickReplyMode
export type QuickReplyMode = 'all' | 'popular' | 'mentions';

// 2. Adicionar detecção no hook
if (value[cursorPos - 1] === '@') {
  // Lógica similar ao "/"
  openCommand('mentions', cursorPos - 1);
}

// 3. Adicionar handler no QuickReplyCommand
if (mode === 'mentions') {
  // Carregar lista de menções (usuários, etc)
}
```

### Ajustar Timeout

```typescript
// No hook, linha 104
setTimeout(() => { ... }, 300); // ← Mudar valor aqui
```

### Customizar Busca

O componente Command usa `cmdk` internamente. A busca fuzzy é automática, mas pode ser customizada via prop `filter`:

```typescript
<Command filter={(value, search) => {
  // Custom filter logic
}}>
```

---

## 🐛 Troubleshooting

### Command não abre ao digitar "/"

**Possíveis causas:**
1. "/" não está em contexto válido (após letra/número)
2. Timeout foi cancelado por outra interação
3. `handleTextareaInput` não está sendo chamado no onChange

**Debug:**
```typescript
// Adicionar console.log no hook
console.log('Slash detected at position:', cursorPos);
```

### Texto não é inserido na posição correta

**Possíveis causas:**
1. `triggerPosition` não foi atualizado corretamente
2. Content mudou entre abertura e seleção

**Debug:**
```typescript
// No handleQuickReplyCommandSelect
console.log('Trigger position:', quickReplyCommand.triggerPosition);
console.log('Current content:', content);
```

### Cursor não move após inserção

**Possíveis causas:**
1. Ref não está conectado ao textarea
2. setTimeout de 0ms não executou

**Solução:**
```typescript
// Aumentar timeout ou usar queueMicrotask
queueMicrotask(() => {
  if (textareaRef.current) {
    textareaRef.current.focus();
  }
});
```

---

## 📈 Próximos Passos (Future Enhancements)

### Melhorias Sugeridas

1. **Histórico de Comandos**
   - Mostrar últimas 3 respostas usadas
   - Atalho `//` para histórico ao invés de populares

2. **Preview Expandido**
   - Tooltip com conteúdo completo ao hover
   - Preview de variáveis substituídas

3. **Categorias**
   - `/categoria` abre respostas de uma categoria específica
   - Ex: `/vendas`, `/suporte`, `/financeiro`

4. **Snippets com Placeholders**
   - Inserir resposta com `{|cursor|}` placeholder
   - Cursor posicionado no placeholder após inserção

5. **Analytics**
   - Tracking de uso de atalhos vs botão manual
   - Métricas de eficiência (tempo economizado)

6. **Customização por Usuário**
   - Favoritos pessoais
   - Atalhos customizados (`/meu-atalho`)

---

## 📝 Checklist de Implementação

- [x] Criar hook `useQuickReplyCommand`
- [x] Criar componente `QuickReplyCommand`
- [x] Integrar no `MessageInput`
- [x] Adicionar ref ao `Textarea`
- [x] Implementar detecção de "/" e "//"
- [x] Implementar remoção de triggers
- [x] Implementar inserção na posição correta
- [x] Carregar respostas (all vs popular)
- [x] Processar variáveis
- [x] Incrementar uso
- [x] Testes de tipo TypeScript
- [ ] Testes unitários (hook)
- [ ] Testes de integração (componente)
- [ ] Testes E2E (user flow)
- [ ] Documentação de uso para usuários finais

---

## 🎓 Referências

- [cmdk (Command Palette Library)](https://cmdk.paco.me/)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [WhatsApp Web Quick Replies](https://faq.whatsapp.com/general/chats/how-to-use-quick-replies)
- [VS Code Command Palette](https://code.visualstudio.com/docs/getstarted/userinterface#_command-palette)

---

## 👥 Manutenção

**Responsável:** Equipe LIVIA MVP
**Data de Implementação:** 2025-11-27
**Última Atualização:** 2025-11-27
**Status:** ✅ Implementado e testado (type-check)
