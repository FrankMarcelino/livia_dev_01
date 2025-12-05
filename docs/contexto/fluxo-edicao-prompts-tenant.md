# Fluxo de Edição de Prompts por Tenants

**Documento de Contexto para Desenvolvimento da Plataforma Tenant**

**Criado em:** 2025-12-03
**Versão:** 1.0
**Objetivo:** Explicar como funciona o sistema de templates e edição de prompts entre Plataforma Admin e Plataforma Tenant

---

## 📋 Índice

1. [Visão Geral da Arquitetura](#visão-geral-da-arquitetura)
2. [Tabelas e Relacionamentos](#tabelas-e-relacionamentos)
3. [Fluxo Completo de Dados](#fluxo-completo-de-dados)
4. [Como Tenant Edita Seus Prompts](#como-tenant-edita-seus-prompts)
5. [Estrutura de Dados](#estrutura-de-dados)
6. [Permissões e RLS](#permissões-e-rls)
7. [Exemplos Práticos](#exemplos-práticos)
8. [Checklist de Implementação (Plataforma Tenant)](#checklist-de-implementação)

---

## 🏗️ Visão Geral da Arquitetura

### Duas Plataformas Separadas

```
┌─────────────────────────────────────────┐
│  PLATAFORMA SUPER ADMIN                 │
│  (Desenvolvida - Em Produção)           │
│                                          │
│  - Gerenciar Empresas (Tenants)         │
│  - Gerenciar NeuroCores                 │
│  - Gerenciar Templates de Agents ✅     │
│                                          │
│  Usuários: Super Admins                 │
│  Acesso: Global (todos os dados)        │
└─────────────────────────────────────────┘
                    ↓
            (cria templates)
                    ↓
┌─────────────────────────────────────────┐
│  PLATAFORMA TENANT                      │
│  (A ser desenvolvida)                   │
│                                          │
│  - Meu Perfil                           │
│  - Meus Agentes IA 🎯                   │
│  - Meus Canais                          │
│  - Relatórios                           │
│                                          │
│  Usuários: Tenants (Empresas)           │
│  Acesso: Apenas dados da própria empresa│
└─────────────────────────────────────────┘
```

---

## 🗄️ Tabelas e Relacionamentos

### Diagrama de Relacionamentos

```
┌──────────────────┐
│ agent_templates  │  ← Super Admin cria templates reutilizáveis
│                  │     (Tabela: agent_templates)
│ - id             │
│ - name           │
│ - type           │
│ - limitations    │ (JSONB)
│ - instructions   │ (JSONB)
│ - guide_line     │ (JSONB - estrutura especial)
│ - is_active      │
└────────┬─────────┘
         │
         │ (1) Super Admin usa template ao criar neurocore
         │
         ↓
┌──────────────────┐
│     agents       │  ← Agent do neurocore (estrutura técnica)
│                  │     (Tabela: agents)
│ - id             │
│ - id_neurocore   │ (FK → neurocores)
│ - template_id    │ (FK → agent_templates) ⚠️ IMPORTANTE
│ - name           │
│ - type           │
│ - reactive       │
└────────┬─────────┘
         │
         │ (2) Sistema copia configuração do template
         │
         ↓
┌──────────────────┐
│  agent_prompts   │  ← Configuração BASE (herança)
│  (id_tenant=NULL)│     (Tabela: agent_prompts)
│                  │
│ - id             │
│ - id_agent       │ (FK → agents)
│ - id_tenant      │ = NULL ⚠️ NULL = configuração base
│ - limitations    │ (JSONB - copiado do template)
│ - instructions   │ (JSONB - copiado do template)
│ - guide_line     │ (JSONB - copiado do template)
└────────┬─────────┘
         │
         │ (3) Tenant é criado → Sistema copia configuração base
         │
         ↓
┌──────────────────┐
│  agent_prompts   │  ← Configuração PERSONALIZADA do Tenant
│ (id_tenant=UUID) │     (Tabela: agent_prompts)
│                  │
│ - id             │
│ - id_agent       │ (FK → agents)
│ - id_tenant      │ = UUID ⚠️ Tenant específico
│ - limitations    │ (JSONB - Tenant pode editar)
│ - instructions   │ (JSONB - Tenant pode editar)
│ - guide_line     │ (JSONB - Tenant pode editar)
└──────────────────┘
```

### Campo Chave: `template_id` em `agents`

```sql
ALTER TABLE agents
ADD COLUMN template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL;
```

**Por que é importante?**
- ✅ Rastreabilidade: Saber qual template originou cada agent
- ✅ Estatísticas: "Template X usado em Y neurocores"
- ✅ Auditoria: Histórico de uso dos templates
- ✅ Propagação futura: Atualizar agents baseados em template (opcional)

---

## 🔄 Fluxo Completo de Dados

### Passo 1: Super Admin Cria Template

**Na Plataforma Admin:**

```sql
-- Super Admin cria template "Recepcionista Imobiliária"
INSERT INTO agent_templates (
  name,
  type,
  reactive,
  limitations,
  instructions,
  guide_line,
  is_active
)
VALUES (
  'Recepcionista Imobiliária',
  'attendant',
  true,
  '["Não discutir política", "Não prometer prazos sem confirmar"]'::jsonb,
  '["Cumprimentar cliente pelo nome", "Ser educado"]'::jsonb,
  '[{
    "title": "Roteiro de Atendimento",
    "type": "rank",
    "active": true,
    "sub": [
      {"content": "Saudar cliente", "active": true},
      {"content": "Identificar necessidade", "active": true}
    ]
  }]'::jsonb,
  true
);

-- Retorna: template_id = "abc-123"
```

### Passo 2: Super Admin Usa Template em Neurocore

**Na Plataforma Admin (ao criar/editar neurocore):**

```typescript
// 2.1. Super Admin seleciona template no modal "Usar Template"
const selectedTemplate = await fetchAgentTemplateById('abc-123')

// 2.2. Sistema cria agent no neurocore
const { data: newAgent } = await supabase
  .from('agents')
  .insert({
    id_neurocore: 'neurocore-xyz',
    name: 'Recepcionista',
    type: selectedTemplate.type,
    reactive: selectedTemplate.reactive,
    template_id: selectedTemplate.id  // ⚠️ Rastreamento
  })
  .select()
  .single()

// newAgent.id = "agent-456"

// 2.3. Sistema copia configuração do template para agent_prompts
const { data: basePrompt } = await supabase
  .from('agent_prompts')
  .insert({
    id_agent: newAgent.id,
    id_tenant: null,  // ⚠️ NULL = configuração base
    limitations: selectedTemplate.limitations,
    instructions: selectedTemplate.instructions,
    guide_line: selectedTemplate.guide_line,
    // ... outros campos
  })
  .select()
  .single()
```

### Passo 3: Tenant é Criado e Herda Configuração

**Na Plataforma Admin (ao criar tenant):**

```typescript
// 3.1. Super Admin cria tenant e associa a neurocore
const { data: newTenant } = await supabase
  .from('tenants')
  .insert({
    name: 'Imobiliária XYZ',
    id_neurocore: 'neurocore-xyz',
    // ... outros campos
  })
  .select()
  .single()

// newTenant.id = "tenant-789"

// 3.2. Sistema busca todos os agents do neurocore
const { data: agents } = await supabase
  .from('agents')
  .select('id')
  .eq('id_neurocore', 'neurocore-xyz')

// 3.3. Para cada agent, cria configuração específica do tenant
for (const agent of agents) {
  // Busca configuração base (id_tenant = NULL)
  const { data: basePrompt } = await supabase
    .from('agent_prompts')
    .select('*')
    .eq('id_agent', agent.id)
    .is('id_tenant', null)
    .single()

  // Cria cópia para o tenant
  await supabase
    .from('agent_prompts')
    .insert({
      id_agent: agent.id,
      id_tenant: newTenant.id,  // ⚠️ Tenant específico
      limitations: basePrompt.limitations,      // Copiado
      instructions: basePrompt.instructions,    // Copiado
      guide_line: basePrompt.guide_line,        // Copiado
      // ... outros campos
    })
}
```

### Passo 4: Tenant Edita Suas Configurações

**Na Plataforma Tenant (a ser desenvolvida):**

```typescript
// 4.1. Tenant faz login
const { data: { user } } = await supabase.auth.getUser()
// user tem: tenant_id = "tenant-789"

// 4.2. Tenant acessa "Meus Agentes IA"
const { data: agents } = await supabase
  .from('agents')
  .select(`
    *,
    agent_prompts!inner(*)
  `)
  .eq('agent_prompts.id_tenant', user.tenant_id)

// 4.3. Tenant clica "Editar" no agent "Recepcionista"
const { data: prompt } = await supabase
  .from('agent_prompts')
  .select('*')
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', user.tenant_id)
  .single()

// 4.4. Tenant adiciona nova limitação no formulário
const updatedLimitations = [
  ...prompt.limitations,
  "Não falar de concorrentes"  // ⚠️ Nova limitação personalizada
]

// 4.5. Sistema salva APENAS no registro do tenant
await supabase
  .from('agent_prompts')
  .update({
    limitations: updatedLimitations
  })
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', user.tenant_id)  // ⚠️ Atualiza só o dele
```

---

## 🎯 Como Tenant Edita Seus Prompts

### Autenticação e Permissões

#### Super Admin
```typescript
{
  role: 'super_admin',
  permissions: [
    'manage_tenants',
    'manage_neurocores',
    'manage_templates',
    'view_all_data'
  ]
}
```

#### Tenant
```typescript
{
  role: 'tenant_admin',  // ou 'tenant_user'
  tenant_id: 'tenant-789',
  permissions: [
    'manage_own_agents',
    'view_own_reports',
    'manage_own_channels'
  ]
}
```

### Interface "Meus Agentes IA" (Tenant)

#### Layout da Tela

```
╔═══════════════════════════════════════════════════════╗
║ Meus Agentes IA                                       ║
╠═══════════════════════════════════════════════════════╣
║                                                        ║
║ ┌────────────────────────────────────────────────┐   ║
║ │ 🤖 Recepcionista                               │   ║
║ │ ─────────────────────────────────────────────  │   ║
║ │ Status: ✅ Ativo                               │   ║
║ │ Tipo: Atendente                                │   ║
║ │                                                 │   ║
║ │ 📋 Configuração: Baseada em Template           │   ║
║ │ 🔗 Template origem: "Recepcionista Imobiliária"│   ║
║ │                                                 │   ║
║ │                        [Ver Detalhes] [Editar] │   ║
║ └────────────────────────────────────────────────┘   ║
║                                                        ║
║ ┌────────────────────────────────────────────────┐   ║
║ │ 💰 Vendedor                                    │   ║
║ │ ─────────────────────────────────────────────  │   ║
║ │ Status: ✅ Ativo                               │   ║
║ │ Tipo: Vendas                                   │   ║
║ │                                                 │   ║
║ │ 📋 Configuração: Personalizada ⚠️              │   ║
║ │ 🔗 Template origem: "Vendedor Padrão"          │   ║
║ │                                                 │   ║
║ │                        [Ver Detalhes] [Editar] │   ║
║ └────────────────────────────────────────────────┘   ║
╚═══════════════════════════════════════════════════════╝
```

#### Ao Clicar em "Editar"

Abre formulário **similar ao da Plataforma Admin**, mas com restrições:

| Campo | Editável? | Motivo |
|-------|-----------|--------|
| Nome do Agent | ❌ Não | Herda do neurocore |
| Tipo (Atendente/Vendas) | ❌ Não | Estrutura técnica fixa |
| Modo (Reativo/Proativo) | ❌ Não | Estrutura técnica fixa |
| **Limitações** | ✅ Sim | Tenant pode personalizar |
| **Instruções** | ✅ Sim | Tenant pode personalizar |
| **Roteiro (guide_line)** | ✅ Sim | Tenant pode personalizar |
| **Personalidade** | ✅ Sim | Tenant pode personalizar |

#### Query ao Editar (Tenant)

```typescript
// Busca APENAS a configuração do tenant
const { data: prompt } = await supabase
  .from('agent_prompts')
  .select('*')
  .eq('id_agent', agentId)
  .eq('id_tenant', currentUser.tenant_id)  // ⚠️ Filtro crítico
  .single()
```

#### Update ao Salvar (Tenant)

```typescript
// Atualiza APENAS o registro do tenant
await supabase
  .from('agent_prompts')
  .update({
    limitations: editedLimitations,
    instructions: editedInstructions,
    guide_line: editedGuideline,
    // ... outros campos
  })
  .eq('id_agent', agentId)
  .eq('id_tenant', currentUser.tenant_id)  // ⚠️ Segurança crítica
```

---

## 📊 Estrutura de Dados

### Tabela: `agent_templates`

```sql
CREATE TABLE agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Estrutura Técnica
  name TEXT NOT NULL,
  type agent_function NOT NULL,  -- 'attendant', 'intention', 'in_guard_rails', 'observer'
  reactive BOOLEAN NOT NULL DEFAULT true,

  -- Persona
  persona_name TEXT,
  age TEXT,
  gender TEXT,
  objective TEXT,
  communication TEXT,
  personality TEXT,

  -- Configurações (JSONB)
  limitations JSONB,      -- Array de strings
  instructions JSONB,     -- Array de strings
  guide_line JSONB,       -- Array de objetos (estrutura especial)
  rules JSONB,
  others_instructions JSONB,

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `agents`

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_neurocore UUID NOT NULL REFERENCES neurocores(id),
  template_id UUID REFERENCES agent_templates(id) ON DELETE SET NULL,  -- ⚠️ Rastreamento

  name TEXT NOT NULL,
  type agent_function NOT NULL,
  reactive BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: `agent_prompts`

```sql
CREATE TABLE agent_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  id_agent UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  id_tenant UUID REFERENCES tenants(id) ON DELETE CASCADE,  -- ⚠️ NULL = base

  -- Configurações (JSONB)
  limitations JSONB,
  instructions JSONB,
  guide_line JSONB,
  rules JSONB,
  others_instructions JSONB,

  -- Escape/Fallback
  escape JSONB,
  fallback JSONB,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  -- ⚠️ Constraint: Cada agent tem 1 configuração base (NULL) e 1 por tenant
  UNIQUE(id_agent, id_tenant)
);
```

### Estrutura JSONB: `guide_line`

**✅ Estrutura Implementada (Atualizada em 2025-12-03)**

```json
[
  {
    "title": "Roteiro de Suporte",
    "type": "rank",           // "rank" ou "markdown"
    "active": true,           // Se a etapa está ativa
    "sub": [
      {
        "content": "Identifique o motivo do contato",
        "active": true        // Se a instrução está ativa
      },
      {
        "content": "SE for Boleto: Informe o link",
        "active": true
      },
      {
        "content": "Finalize com empatia",
        "active": false       // ⚠️ Desativado
      }
    ]
  },
  {
    "title": "Instruções Operacionais",
    "type": "markdown",
    "active": true,
    "sub": [
      {
        "content": "*Formatação:* Use emojis 🛠",
        "active": true
      }
    ]
  }
]
```

**Campos da Etapa (`GuidelineStep`):**
- `title` (string): Título da etapa
- `type` (enum): `"rank"` (numerado/ordenado) ou `"markdown"` (formatado com markdown)
- `active` (boolean): Se a etapa inteira está ativa
- `sub` (array): Array de sub-instruções (`GuidelineSubInstruction[]`)

**Campos da Sub-Instrução (`GuidelineSubInstruction`):**
- `content` (string): Texto da instrução
- `active` (boolean): Se a instrução específica está ativa

**Diferença entre `type`:**
- **rank**: Instruções numeradas (1, 2, 3...) para seguir sequencialmente
- **markdown**: Permite formatação com markdown (*negrito*, _itálico_, emojis, etc)

---

## 🔐 Permissões e RLS (Row Level Security)

### RLS Policy: Super Admin (Todos os Templates)

```sql
-- Super Admin pode fazer tudo em agent_templates
CREATE POLICY "Super Admin can do everything on agent_templates"
  ON agent_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'super_admin'
    )
  );
```

### RLS Policy: Tenant (Apenas Seus Prompts)

```sql
-- Tenant pode VER apenas seus prompts
CREATE POLICY "Tenants can view their own prompts"
  ON agent_prompts
  FOR SELECT
  USING (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );

-- Tenant pode ATUALIZAR apenas seus prompts
CREATE POLICY "Tenants can update their own prompts"
  ON agent_prompts
  FOR UPDATE
  USING (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id_tenant = (
      SELECT tenant_id FROM users WHERE id = auth.uid()
    )
  );
```

### RLS Policy: Tenant (Apenas Seus Agents)

```sql
-- Tenant pode VER apenas agents do seu neurocore
CREATE POLICY "Tenants can view their own agents"
  ON agents
  FOR SELECT
  USING (
    id_neurocore = (
      SELECT id_neurocore FROM tenants
      JOIN users ON users.tenant_id = tenants.id
      WHERE users.id = auth.uid()
    )
  );
```

---

## 💡 Exemplos Práticos

### Exemplo 1: Tenant Adiciona Limitação

**Cenário:** Imobiliária XYZ quer impedir que o agent fale de concorrentes

```typescript
// 1. Tenant busca configuração atual
const { data: currentPrompt } = await supabase
  .from('agent_prompts')
  .select('limitations')
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', 'tenant-789')
  .single()

// currentPrompt.limitations = [
//   "Não discutir política",
//   "Não prometer prazos sem confirmar"
// ]

// 2. Tenant adiciona nova limitação
const updatedLimitations = [
  ...currentPrompt.limitations,
  "Não falar de concorrentes"
]

// 3. Sistema salva
await supabase
  .from('agent_prompts')
  .update({ limitations: updatedLimitations })
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', 'tenant-789')

// Resultado: [
//   "Não discutir política",
//   "Não prometer prazos sem confirmar",
//   "Não falar de concorrentes"  ← Nova
// ]
```

### Exemplo 2: Tenant Desativa Etapa do Roteiro

**Cenário:** Tenant quer desativar temporariamente uma etapa do guideline

```typescript
// 1. Busca configuração atual
const { data: currentPrompt } = await supabase
  .from('agent_prompts')
  .select('guide_line')
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', 'tenant-789')
  .single()

// 2. Desativa etapa específica
const updatedGuideline = currentPrompt.guide_line.map((step, index) => {
  if (index === 1) {  // Desativa segunda etapa
    return { ...step, active: false }
  }
  return step
})

// 3. Salva
await supabase
  .from('agent_prompts')
  .update({ guide_line: updatedGuideline })
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', 'tenant-789')
```

### Exemplo 3: Tenant Personaliza Personalidade

```typescript
// 1. Busca configuração base (herança)
const { data: basePrompt } = await supabase
  .from('agent_prompts')
  .select('*')
  .eq('id_agent', 'agent-456')
  .is('id_tenant', null)
  .single()

// basePrompt.persona_name = "Alex"
// basePrompt.objective = "Atender com excelência"

// 2. Tenant personaliza
await supabase
  .from('agent_prompts')
  .update({
    persona_name: "Maria",  // Personalizado
    objective: "Atender clientes de imóveis de luxo"  // Personalizado
  })
  .eq('id_agent', 'agent-456')
  .eq('id_tenant', 'tenant-789')
```

---

## ✅ Checklist de Implementação (Plataforma Tenant)

### Fase 1: Autenticação e Permissões
- [ ] Sistema de login para tenants
- [ ] Middleware de autenticação
- [ ] Context/Hook para `currentUser.tenant_id`
- [ ] RLS policies configuradas no Supabase
- [ ] Testes de segurança (tentar acessar dados de outro tenant)

### Fase 2: Listagem de Agents
- [ ] Página "Meus Agentes IA"
- [ ] Query: `agents` filtrados por `id_neurocore` do tenant
- [ ] JOIN com `agent_prompts WHERE id_tenant = current_user.tenant_id`
- [ ] Cards/Tabela exibindo agents
- [ ] Badges de status (Ativo/Inativo)
- [ ] Indicador se configuração é "Base" ou "Personalizada"
- [ ] Exibir template de origem (via `agents.template_id`)

### Fase 3: Visualização de Detalhes
- [ ] Drawer/Modal de detalhes do agent
- [ ] Exibir estrutura técnica (Nome, Tipo, Modo) - **read-only**
- [ ] Exibir personalidade (Nome, Idade, Objetivo, etc)
- [ ] Exibir limitações (lista)
- [ ] Exibir instruções (lista)
- [ ] Exibir roteiro/guideline (estrutura hierárquica)
- [ ] Indicar campos editados (diferença do template base)

### Fase 4: Edição de Configuração
- [ ] Formulário de edição (similar ao da Plataforma Admin)
- [ ] Campos **read-only**: Nome do Agent, Tipo, Modo
- [ ] Campos **editáveis**: Limitações, Instruções, Guideline, Personalidade
- [ ] Validação com Zod (mesmos schemas)
- [ ] Componente para editar `guide_line`:
  - [ ] Renderizar etapas com `type: "rank"` ou `"markdown"`
  - [ ] Toggle para `active` em etapas e sub-instruções
  - [ ] Adicionar/remover sub-instruções
- [ ] Botão "Resetar para Padrão" (copiar da configuração base)
- [ ] Confirmação antes de salvar

### Fase 5: Operações CRUD
- [ ] **Update**: Atualizar `agent_prompts WHERE id_tenant = current`
- [ ] Toast de sucesso/erro
- [ ] Invalidar cache após update
- [ ] Loading states durante operações

### Fase 6: Features Adicionais
- [ ] Diff Viewer (comparar configuração atual vs base)
- [ ] Histórico de alterações (audit log)
- [ ] Exportar/Importar configuração (JSON)
- [ ] Preview do agent (testar prompt antes de salvar)

### Fase 7: UI/UX
- [ ] Responsividade (mobile/tablet/desktop)
- [ ] Skeleton loaders
- [ ] Empty states
- [ ] Error boundaries
- [ ] Acessibilidade (ARIA labels, keyboard navigation)

### Fase 8: Testes
- [ ] Testes de segurança (RLS)
- [ ] Testes de CRUD
- [ ] Testes de validação
- [ ] Testes de edge cases (tenant sem agents, etc)

---

## 📚 Referências

### Documentação Relacionada
- `doc/planejamento/gerenciar-agentes.md` - Planejamento completo da feature
- `doc/status-projeto.md` - Status de implementação
- `doc/database-relationships.md` - Esquema completo do banco

### Código-Fonte (Plataforma Admin)
- `src/components/agents/AgentTemplateForm.tsx` - Formulário master
- `src/components/agents/form-sections/AgentTemplateGuidelineSection.tsx` - Editor de roteiro
- `src/lib/validations/agentTemplateValidation.ts` - Schemas Zod
- `src/lib/queries/agentTemplate/` - Queries Supabase

### Migrations
- `supabase/migrations/20251203_create_agent_templates_table_fixed.sql`

---

## 🎯 Próximos Passos

### Plataforma Admin (Atual)
1. ✅ Fase 5 (Formulário) - Completa
2. 🟡 Fase 6 (Drawer de Detalhes) - Em andamento
3. ⬜ Fase 7 (Integração com Neurocores)
4. ⬜ Fase 8 (Integração com Tenants)

### Plataforma Tenant (Futura)
1. ⬜ Setup inicial (autenticação, navegação)
2. ⬜ Implementar "Meus Agentes IA"
3. ⬜ Implementar edição de prompts
4. ⬜ Testes e validação

---

**Criado por:** Claude (Plataforma Admin)
**Para:** Agente da Plataforma Tenant
**Contato:** Use este documento como referência ao desenvolver a interface do tenant
