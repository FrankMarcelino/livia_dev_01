# Decisões Arquiteturais - LIVIA MVP

## Índice de Decisões
1. [Não usar MCP no MVP](#decisão-001-não-usar-mcp-no-mvp)
2. [Estrutura Híbrida de Skills](#decisão-002-estrutura-híbrida-de-skills)
3. [Base Vetorial Gerenciada pelo n8n](#decisão-003-base-vetorial-gerenciada-pelo-n8n)
4. [Aceitar Type Assertions `any` para Queries Supabase](#decisão-004-aceitar-type-assertions-any-para-queries-supabase)

---

## Decisão #001: Não usar MCP no MVP

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Durante o planejamento do projeto LIVIA, surgiu a questão sobre usar Model Context Protocol (MCP) para integração com Supabase e n8n. MCP permitiria ao Claude acessar diretamente o banco de dados e testar webhooks durante o desenvolvimento.

### Opções Consideradas

1. **MCP Completo**
   - Prós: Acesso direto ao banco, testes rápidos, geração automática de código baseado em schema
   - Contras: Alta complexidade, riscos de segurança, overhead de manutenção, curva de aprendizado

2. **MCP Seletivo (Schema Reader apenas)**
   - Prós: Types sempre atualizados, baixo risco (só leitura)
   - Contras: Ainda adiciona complexidade, precisa configurar infraestrutura

3. **Sem MCP (Skills + Scripts CLI)**
   - Prós: Simplicidade, menor risco, foco no MVP, sem infraestrutura adicional
   - Contras: Claude não acessa dados diretamente, precisa gerar código manualmente

### Decisão
**Adiar uso de MCP para pós-MVP.** Focar em entregar o MVP usando skills customizadas do Claude Code e scripts CLI quando necessário.

**Razões:**
- MVP precisa ser entregue rapidamente
- Skills criadas já cobrem todos os padrões necessários
- Evitar complexidade adicional na fase inicial
- Reduzir riscos de segurança
- Facilitar onboarding da equipe

### Consequências

**Positivas:**
- Menor complexidade no setup inicial
- Equipe foca em features, não em infraestrutura
- Menos pontos de falha
- Onboarding mais rápido
- Maior segurança (sem acesso direto ao banco)

**Negativas:**
- Claude não pode validar queries contra schema real
- Testes de integração n8n precisam ser manuais
- Types do Supabase precisam ser gerados manualmente

**Riscos e Mitigações:**
- **Risco:** Types desatualizados
  - **Mitigação:** Script CLI para gerar types do Supabase regularmente
- **Risco:** Dificuldade em testar webhooks n8n
  - **Mitigação:** Criar scripts CLI para testes comuns

### Revisão Futura
Reavaliar pós-MVP se:
- Equipe crescer (>3 devs)
- Testes de integração se tornarem gargalo
- Schema do banco mudar frequentemente
- ROI de MCP justificar a complexidade

### Referências
- [Claude Code MCP Documentation](https://code.claude.com/docs/en/mcp)
- Análise de prós/contras documentada em conversa

---

## Decisão #002: Estrutura Híbrida de Skills

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Precisávamos definir como organizar skills do Claude Code para o projeto LIVIA: uma skill monolítica, múltiplas skills separadas por tecnologia, ou estrutura híbrida.

### Opções Consideradas

1. **1 Skill Monolítica**
   - Prós: Simplicidade, um arquivo só
   - Contras: Arquivo muito grande, consome muitos tokens, difícil de manter

2. **3 Skills Separadas (n8n, Supabase, Frontend)**
   - Prós: Especialização, ativação precisa
   - Contras: Possível overlap, contexto fragmentado, manutenção multiplicada

3. **1 Skill Principal + Arquivos de Referência**
   - Prós: Contexto unificado, carregamento progressivo, fácil manutenção
   - Contras: Requer boa organização dos arquivos

### Decisão
**Usar estrutura híbrida:** 1 SKILL.md principal com arquivos de referência especializados.

**Estrutura:**
```
.claude/skills/livia-mvp/
├── SKILL.md                 # Skill principal (sempre carregada)
├── n8n-reference.md         # Carregada quando necessário
├── supabase-reference.md    # Carregada quando necessário
└── frontend-reference.md    # Carregada quando necessário
```

### Consequências

**Positivas:**
- Claude carrega apenas o necessário (economia de tokens)
- Contexto do projeto permanece unificado
- Fácil de manter (um lugar para cada tipo de informação)
- Equipe pode contribuir em áreas específicas

**Negativas:**
- Requer disciplina para manter referências atualizadas
- Arquivos de referência podem ficar desatualizados se não revisados

**Riscos e Mitigações:**
- **Risco:** Referências desatualizadas
  - **Mitigação:** Revisar arquivos ao adicionar novas features
- **Risco:** Duplicação de informação
  - **Mitigação:** Definir claramente o que vai em cada arquivo

### Referências
- [Claude Code Skills Documentation](https://code.claude.com/docs/en/skills)

---

## Decisão #003: Base Vetorial Gerenciada pelo n8n

**Data:** 2025-11-16

**Status:** Aceita

### Contexto
Durante o planejamento da migração SQL, foi incluída uma tabela `synapse_embeddings` no Supabase para armazenar embeddings vetoriais (pgvector) das synapses. No entanto, a lógica de vetorização e busca semântica já é gerenciada pelo n8n.

### Opções Consideradas

1. **Tabela de embeddings no Supabase**
   - Prós: Dados centralizados, busca vetorial nativa (pgvector), controle total
   - Contras: Duplicação de lógica (n8n já faz), overhead de sincronização, complexidade adicional

2. **Base vetorial externa gerenciada pelo n8n**
   - Prós: Separação de responsabilidades, n8n já implementado, menor complexidade no frontend
   - Contras: Frontend não tem acesso direto aos embeddings (mas não precisa)

### Decisão
**Remover tabela `synapse_embeddings` do Supabase.** A base vetorial é responsabilidade do **n8n**, que gerencia:
- Criação de embeddings ao publicar synapses
- Armazenamento em serviço externo (Pinecone, Weaviate, ou similar)
- Busca semântica durante processamento de IA
- Sincronização com estado das synapses

**O frontend apenas:**
- Gerencia CRUD de synapses (título, content, descrição)
- Controla estados (draft, publishing, error)
- Ativa/desativa synapses (`is_enabled`)
- Dispara webhooks n8n para publicação

### Consequências

**Positivas:**
- Menor complexidade no schema do Supabase
- Não duplicar lógica de vetorização
- Separação clara de responsabilidades (Frontend = CRUD, n8n = IA/Embeddings)
- Menos manutenção e sincronização
- Migração SQL mais simples

**Negativas:**
- Frontend não tem visibilidade dos embeddings (mas não precisa para MVP)
- Não pode fazer queries vetoriais diretamente do frontend (mas não é necessário)

**Riscos e Mitigações:**
- **Risco:** Perda de visibilidade sobre embeddings
  - **Mitigação:** n8n pode expor métricas via webhook se necessário
- **Risco:** Difícil debugar problemas de busca
  - **Mitigação:** Tela de Treinamento Neurocore permite testar queries e ver synapses usadas

### Referências
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- Migração v2 atualizada sem `synapse_embeddings`

---

## Decisão #004: Aceitar Type Assertions `any` para Queries Supabase

**Data:** 2025-11-17

**Status:** Aceita

### Contexto
Durante o desenvolvimento da feature Livechat, ao criar queries Supabase com joins complexos e API routes, encontramos dificuldades com a inferência de tipos do Supabase JavaScript client. Queries com `.select()` usando joins não inferem tipos corretamente, resultando em tipos `never` ou erros de spread.

**Localizações afetadas:**
- [lib/queries/livechat.ts](app/lib/queries/livechat.ts) (4 ocorrências)
- [api/conversations/pause-ia/route.ts](app/api/conversations/pause-ia/route.ts) (2 ocorrências)
- [api/conversations/resume-ia/route.ts](app/api/conversations/resume-ia/route.ts) (2 ocorrências)
- [api/n8n/send-message/route.ts](app/api/n8n/send-message/route.ts) (1 ocorrência)

**Total:** 9 warnings `@typescript-eslint/no-explicit-any`

### Opções Consideradas

1. **Adicionar `eslint-disable-next-line` em cada ocorrência**
   - Prós: Suprime warnings, mantém regra ativa globalmente
   - Contras: Poluição visual, manutenção repetitiva (9 linhas)

2. **Desabilitar regra para pastas `api/` e `lib/queries/`**
   - Prós: Solução limpa, sem poluição visual
   - Contras: Pode mascarar problemas reais de `any` no futuro

3. **Aceitar warnings e continuar com desenvolvimento**
   - Prós: Pragmatismo, foco em entregar features, warnings são visíveis
   - Contras: Build mostra warnings (não é erro)

### Decisão
**Aceitar warnings `@typescript-eslint/no-explicit-any`** nas queries Supabase e API routes, mantendo assertions `as any` com comentários explicativos.

**Razões:**
- Pragmatismo: Supabase types não inferem corretamente para queries complexas
- Segurança: Todas as queries têm validação de `tenant_id` e null checks antes dos casts
- Visibilidade: Warnings permanecem visíveis, facilitando revisão futura
- Foco no MVP: Priorizar entrega de features sobre perfeição de tipos
- Comentários: Cada `any` tem comentário explicando o motivo

### Padrão Adotado

```typescript
// Exemplo em queries:
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const conversation = data as any;
return {
  ...conversation,
  lastMessage: conversation.messages?.[0] || null,
} as ConversationWithLastMessage;

// Exemplo em API routes:
// @ts-expect-error - Supabase types not inferring correctly
const updateData: any = {
  ia_active: false,
  ia_paused_by_user_id: user.id,
  ia_paused_at: new Date().toISOString(),
};
```

### Consequências

**Positivas:**
- Velocidade de desenvolvimento mantida
- Código continua funcionalmente correto (validações robustas)
- Warnings visíveis para revisão pós-MVP
- Menos poluição visual que múltiplos `eslint-disable-next-line`
- Pragmatismo apropriado para MVP

**Negativas:**
- Perda parcial de type safety em pontos específicos
- Build mostra 9 warnings ESLint

**Riscos e Mitigações:**
- **Risco:** Proliferação de `any` em outros lugares
  - **Mitigação:** Restringir uso apenas a queries/API routes Supabase, sempre com comentário
- **Risco:** Mascarar problemas reais de tipos
  - **Mitigação:** Null checks e validações antes de cada cast, runtime validation de `tenant_id`

### Revisão Futura
Reavaliar pós-MVP quando:
- Supabase liberar melhor inferência de tipos para joins
- Migrar para types gerados automaticamente (`supabase gen types`)
- Time decidir gerar tipos customizados com Zod
- Quantidade de `any` crescer além de queries/API routes

### Referências
- [Supabase Type Support](https://supabase.com/docs/reference/javascript/typescript-support)
- ESLint warnings documentados durante desenvolvimento Livechat

---

## Decisão #005: Webhooks n8n Simplificados para MVP WhatsApp

**Data:** 2025-11-17

**Status:** Aceita

### Contexto
Durante a configuração do ambiente, identificou-se que alguns webhooks n8n mapeados inicialmente podem ser substituídos por operações diretas no banco de dados, simplificando a arquitetura do MVP.

### Análise de Webhooks

**Webhooks NECESSÁRIOS (integração com WhatsApp/IA):**
1. ✅ **N8N_SEND_MESSAGE_WEBHOOK** - Enviar mensagem para WhatsApp
   - Motivo: n8n integrado ao canal (WhatsApp Business API)
   - Fluxo: Frontend → API Route → n8n → WhatsApp

2. ✅ **N8N_SYNC_SYNAPSE_WEBHOOK** - Publicar/editar synapse
   - Motivo: n8n gerencia vetorização (embeddings OpenAI)
   - Fluxo: Frontend → API Route → n8n → Criar embeddings → Base vetorial

3. ✅ **N8N_PAUSE_CONVERSATION_WEBHOOK** - Pausar IA em conversa específica
   - Motivo: n8n precisa saber para pausar processamento
   - Fluxo: Frontend → API Route → n8n → Pausa processamento

4. ✅ **N8N_RESUME_CONVERSATION_WEBHOOK** - Retomar IA em conversa específica
   - Motivo: n8n precisa saber para retomar processamento
   - Fluxo: Frontend → API Route → n8n → Retoma processamento

5. ✅ **N8N_PAUSE_IA_WEBHOOK** - Pausar IA em TODO tenant
   - Motivo: n8n precisa saber para pausar TODAS conversas
   - Fluxo: Frontend → API Route → n8n → Pausa processamento global

6. ✅ **N8N_RESUME_IA_WEBHOOK** - Retomar IA em TODO tenant
   - Motivo: n8n precisa saber para retomar TODAS conversas
   - Fluxo: Frontend → API Route → n8n → Retoma processamento global

**Webhooks DESNECESSÁRIOS (CRUD no banco):**
1. ❌ **N8N_NEUROCORE_QUERY_WEBHOOK** - Simulação de perguntas no treinamento
   - Motivo: É apenas CRUD no banco (salvar queries de teste)
   - Alternativa: Operação direta no Supabase

2. ❌ **N8N_USE_QUICK_REPLY_WEBHOOK** - Usar resposta rápida
   - Motivo: Apenas incrementar `usage_count` no banco
   - Alternativa: UPDATE direto na tabela `quick_reply_templates`

### Decisão
**Remover** webhooks desnecessários do MVP e implementar como operações diretas no Supabase.

**Webhooks finais do MVP WhatsApp:** 6 webhooks (redução de 9 → 6)

### Consequências

**Positivas:**
- Arquitetura mais simples
- Menos pontos de falha
- Melhor performance (menos chamadas HTTP)
- Menor dependência do n8n para operações CRUD
- Facilita desenvolvimento e debug

**Negativas:**
- Perda de centralização de lógica (mas não é necessária para CRUD simples)

**Riscos e Mitigações:**
- **Risco:** Quick Replies podem precisar de lógica adicional no futuro
  - **Mitigação:** Se necessário, adicionar webhook posteriormente
- **Risco:** Neurocore pode precisar integrar com IA no futuro
  - **Mitigação:** Por enquanto é só teste, se necessário adicionar webhook depois

### Padrão Adotado

**Para enviar mensagens (exemplo):**
```typescript
// 1. Salvar mensagem no banco primeiro
const message = await supabase.from('messages').insert({...});

// 2. Chamar n8n para enviar ao WhatsApp
await callN8nWebhook('/webhook/livia/send-message', {
  conversation_id,
  user_id,
  content
});

// 3. Realtime do Supabase atualiza UI automaticamente
```

**Para Quick Replies (simplificado):**
```typescript
// Apenas incrementar no banco
await supabase
  .from('quick_reply_templates')
  .update({ usage_count: current + 1 })
  .eq('id', quickReplyId);
```

### Referências
- Observações do arquivo `.env.local` original
- Análise de fluxos de integração n8n

---

## Decisões Rápidas

**Data** | **Decisão** | **Justificativa**
---------|-------------|------------------
2025-11-16 | shadcn/ui para componentes | Consistência visual, acessibilidade, manutenção facilitada
2025-11-16 | Server Components por padrão | Melhor performance, menor bundle, acesso direto a dados
