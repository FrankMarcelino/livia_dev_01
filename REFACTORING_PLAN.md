# Plano de Refatoração - Estrutura de Pastas

**Data:** 2025-11-17
**Status:** Proposto
**Prioridade:** CRÍTICA

---

## 📊 Análise da Situação Atual

### Estrutura Atual (PROBLEMÁTICA)

```
/home/frank/projeto/                    ← Raiz "fantasma"
├── package.json                         ← Apenas husky + lint-staged
├── package-lock.json                    ← 17KB (dev deps)
├── node_modules/                        ← 40 pacotes (husky, lint-staged, etc)
├── .husky/                              ← ❌ DUPLICADO
│
├── .claude/skills/livia-mvp/           ← ✅ OK
├── docs/                                ← ✅ OK
├── CONTEXT.md, PROGRESS.md, DECISIONS.md ← ✅ OK
│
├── components/                          ← ❌ PASTA VAZIA (não usado)
├── prototypes/                          ← ❌ PASTA VAZIA (não usado)
├── tests/                               ← ❌ PASTA VAZIA (não usado)
│
└── app/                                 ← Projeto Next.js REAL
    ├── package.json                     ← Next.js completo
    ├── package-lock.json                ← 262KB (todas deps)
    ├── node_modules/                    ← 400+ pacotes
    ├── .husky/                          ← ❌ DUPLICADO
    │
    ├── api/                             ← ✅ OK (API Routes)
    ├── components/                      ← ✅ OK (React components)
    ├── lib/                             ← ✅ OK (utils, clients)
    ├── types/                           ← ✅ OK (TypeScript types)
    ├── livechat/                        ← ✅ OK (página)
    ├── public/                          ← ✅ OK (assets)
    │
    ├── page.tsx                         ← ✅ OK (Next.js root)
    ├── layout.tsx                       ← ✅ OK (Next.js layout)
    ├── next.config.ts                   ← ✅ OK
    ├── tsconfig.json                    ← ✅ OK
    ├── tailwind.config.ts               ← ✅ OK
    ├── components.json                  ← ✅ OK (shadcn)
    │
    ├── SETUP.md                         ← ✅ OK (documentação)
    │
    ├── test-supabase.js                 ← ⚠️ Scripts de teste (deveria estar na raiz)
    ├── seed-database.js                 ← ⚠️ Scripts de teste (deveria estar na raiz)
    ├── clean-database.js                ← ⚠️ Scripts de teste (deveria estar na raiz)
    └── verify-seed.js                   ← ⚠️ Scripts de teste (deveria estar na raiz)
```

---

## 🔴 Problemas Identificados

### 1. **Duplicação de Configuração Git Hooks**
- **Problema:** Husky configurado em 2 lugares (`/` e `/app`)
- **Impacto:** Confusão sobre qual .husky/ está ativo
- **Risco:** Hooks podem não rodar ou rodar duplicados

### 2. **Duplicação de node_modules**
- **Problema:** 2 pastas de dependências
  - Raiz: 40 pacotes (~17KB lock)
  - App: 400+ pacotes (~262KB lock)
- **Impacto:** Desperdício de espaço (dezenas de MB), confusão de versionamento
- **Risco:** Dependências conflitantes

### 3. **Duplicação de package.json/scripts**
- **Raiz:** `npm run lint` → `cd app && npm run lint`
- **App:** `npm run lint` → `eslint`
- **Problema:** Indireção desnecessária, scripts quebrados
- **Impacto:** `npm run dev` falha (não acha `/pages` ou `/app`)

### 4. **Estrutura Inconsistente com Documentação**
- **CONTEXT.md linha 94:** Menciona `/components` na raiz (vazia)
- **CONTEXT.md linha 97:** Diz "próxima sessão: adicionar Next.js app" (já existe!)
- **SETUP.md:** Mostra estrutura de `/app/` corretamente, mas ignora raiz

### 5. **Next.js Confuso com Raiz do Projeto**
```
⚠ Warning: Next.js inferred your workspace root...
   We detected multiple lockfiles
Error: Couldn't find any `pages` or `app` directory
```
- **Problema:** Next.js roda da raiz, mas projeto está em `/app`
- **Impacto:** Servidor dev não sobe

### 6. **Scripts de Teste Dentro de /app**
- **Problema:** `test-supabase.js`, `seed-database.js`, etc estão em `/app`
- **Impacto:** Mistura código da aplicação com scripts utilitários
- **Esperado:** Scripts na raiz ou em `/scripts/`

---

## ✅ Estrutura CORRETA (Proposta)

### Opção A: Next.js na Raiz (Recomendado)

```
/home/frank/projeto/                    ← Raiz = Projeto Next.js
├── package.json                         ← Next.js completo (consolidado)
├── package-lock.json                    ← Todas dependências
├── node_modules/                        ← Único node_modules
│
├── .husky/                              ← Único .husky/
├── .env.local                           ← ✅ Variáveis de ambiente
├── .gitignore                           ← ✅ Git
│
├── next.config.ts                       ← ✅ Config Next.js
├── tsconfig.json                        ← ✅ TypeScript
├── tailwind.config.ts                   ← ✅ Tailwind
├── components.json                      ← ✅ shadcn/ui
├── eslint.config.mjs                    ← ✅ ESLint
│
├── app/                                 ← ✅ App Router (páginas)
│   ├── page.tsx                         ← Home
│   ├── layout.tsx                       ← Layout global
│   ├── livechat/
│   └── ...
│
├── api/                                 ← ⚠️ MOVER de /app/api
│   ├── conversations/
│   └── n8n/
│
├── components/                          ← ✅ Componentes React
│   ├── livechat/
│   ├── knowledge-base/
│   ├── neurocore/
│   ├── shared/
│   └── ui/
│
├── lib/                                 ← ✅ Bibliotecas
│   ├── supabase/
│   ├── n8n/
│   ├── queries/
│   ├── hooks/
│   └── utils/
│
├── types/                               ← ✅ Tipos TypeScript
│   └── database.ts
│
├── public/                              ← ✅ Assets estáticos
│
├── scripts/                             ← ✅ Scripts utilitários
│   ├── test-supabase.js
│   ├── seed-database.js
│   ├── clean-database.js
│   └── verify-seed.js
│
├── docs/                                ← ✅ Documentação técnica
│   ├── database-schema.md
│   ├── types-example.ts
│   └── migrations/
│
├── .claude/                             ← ✅ Skills Claude Code
│   └── skills/livia-mvp/
│
├── CONTEXT.md                           ← ✅ Documentação do projeto
├── PROGRESS.md
├── DECISIONS.md
├── REFACTORING_PLAN.md                  ← ✅ Este arquivo
│
└── tests/                               ← ✅ Testes (futuro)
```

**Vantagens:**
- ✅ Next.js funciona direto (`npm run dev`)
- ✅ Único node_modules, único package.json
- ✅ Estrutura padrão de projetos Next.js 15
- ✅ Sem indireções (`cd app &&...`)
- ✅ Fácil deploy (Vercel, etc)

**Desvantagens:**
- ⚠️ Precisa mover ~20 arquivos/pastas

---

### Opção B: Monorepo com Workspaces (Complexo)

```
/home/frank/projeto/
├── package.json                         ← Workspace root
├── packages/
│   └── app/                             ← Aplicação Next.js
├── docs/
└── scripts/
```

**Vantagens:**
- ✅ Separação clara de concerns
- ✅ Suporta múltiplos apps no futuro

**Desvantagens:**
- ❌ Complexidade desnecessária para MVP
- ❌ Mais configuração (workspaces, paths)
- ❌ Não é padrão para Next.js simples

---

## 🎯 Decisão: Opção A (Next.js na Raiz)

**Razões:**
1. ✅ Simplicidade para MVP
2. ✅ Padrão de mercado para Next.js
3. ✅ Resolve TODOS os problemas identificados
4. ✅ Fácil de manter e entender
5. ✅ Deploy direto (Vercel, etc)

---

## 📋 Plano de Migração

### Fase 1: Backup e Preparação

1. **Criar backup do projeto**
   ```bash
   cp -r /home/frank/projeto /home/frank/projeto.backup
   ```

2. **Commitar estado atual no git**
   ```bash
   git add . && git commit -m "chore: backup antes de refatoração de estrutura"
   ```

### Fase 2: Mover Arquivos do /app para Raiz

```bash
# 1. Mover configs Next.js
mv app/next.config.ts .
mv app/next-env.d.ts .
mv app/tsconfig.json .
mv app/tailwind.config.ts .
mv app/components.json .
mv app/eslint.config.mjs .

# 2. Mover pasta app/ (App Router)
# Criar temporário
mkdir -p temp_app
mv app/page.tsx temp_app/
mv app/layout.tsx temp_app/
mv app/livechat temp_app/
mv app/global.css temp_app/ # se existir
# Depois renomear
mv temp_app app

# 3. Mover components, lib, types
mv app/components .
mv app/lib .
mv app/types .
mv app/public .

# 4. Mover API routes (IMPORTANTE: Next.js 15 precisa de /app/api ou /pages/api)
# API routes DEVEM ficar dentro de /app/
# NÃO mover app/api/

# 5. Mover package.json e node_modules
rm package.json package-lock.json
rm -rf node_modules
mv app/package.json .
mv app/package-lock.json .
mv app/node_modules .

# 6. Mover .env
mv app/.env.local .

# 7. Mover scripts utilitários
mkdir -p scripts
mv app/test-supabase.js scripts/
mv app/seed-database.js scripts/
mv app/clean-database.js scripts/
mv app/verify-seed.js scripts/

# 8. Mover documentação
mv app/SETUP.md docs/

# 9. Remover .husky duplicado
rm -rf app/.husky
```

### Fase 3: Limpar Diretório /app Antigo

```bash
# Verificar se /app está vazio (exceto app/api que deve ficar)
ls -la app/

# Se estiver vazio (exceto api/):
rm -rf app
mkdir -p app
# Restaurar apenas o que deve estar em /app (páginas)
```

### Fase 4: Recriar Estrutura /app Correta

```bash
# /app agora contém apenas:
# - page.tsx (home)
# - layout.tsx (layout global)
# - livechat/ (página livechat)
# - api/ (API Routes)
# - global.css (se houver)
```

### Fase 5: Atualizar package.json

**Antes (raiz):**
```json
{
  "scripts": {
    "lint": "cd app && npm run lint"
  }
}
```

**Depois:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "type-check": "tsc --noEmit"
  }
}
```

### Fase 6: Atualizar Imports (se necessário)

Verificar se há imports com paths relativos quebrados:

```typescript
// Antes (se estiver em /app/components/...)
import { Button } from './ui/button'

// Depois (agora em /components/...)
import { Button } from '@/components/ui/button'
```

### Fase 7: Atualizar Documentação

**CONTEXT.md:**
```diff
## Estrutura do Projeto
-projeto/
-├── app/                                # ❌ Remover
-│   ├── components/
-│   └── ...
-├── components/                         # ❌ Remover (vazio)
+/home/frank/projeto/                    # Raiz = Next.js
+├── app/                                # App Router (páginas)
+│   ├── page.tsx
+│   ├── layout.tsx
+│   ├── livechat/
+│   └── api/                            # API Routes
+├── components/                         # Componentes React
+├── lib/                                # Bibliotecas
+├── types/                              # Tipos
+├── scripts/                            # Scripts utilitários
```

**SETUP.md:**
- Atualizar caminhos
- Remover menção a `cd app &&...`

### Fase 8: Testar

```bash
# 1. Reinstalar dependências (limpo)
rm -rf node_modules package-lock.json
npm install

# 2. Testar dev server
npm run dev
# Deve abrir em http://localhost:3000

# 3. Testar lint
npm run lint

# 4. Testar type-check
npm run type-check

# 5. Testar scripts
node scripts/test-supabase.js
```

### Fase 9: Git Commit

```bash
git add .
git commit -m "refactor: consolidar estrutura Next.js na raiz

- Mover Next.js de /app para raiz
- Remover duplicação de node_modules e package.json
- Mover scripts utilitários para /scripts
- Atualizar documentação (CONTEXT.md, SETUP.md)
- Estrutura agora segue padrão Next.js 15

BREAKING CHANGE: Estrutura de pastas foi completamente reorganizada"
```

---

## ⚠️ Riscos e Mitigações

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Perda de arquivos durante mv | Alto | Backup completo antes |
| Imports quebrados | Médio | Usar alias `@/` consistentemente |
| Git hooks não funcionam | Baixo | Reinstalar husky após migração |
| Scripts de seed quebrados | Baixo | Atualizar paths em scripts/ |
| Deploy quebrado | Baixo | Testar localmente antes |

---

## 📊 Checklist de Execução

- [ ] **Fase 1:** Backup completo
- [ ] **Fase 2:** Mover arquivos do /app para raiz
- [ ] **Fase 3:** Limpar /app antigo
- [ ] **Fase 4:** Recriar /app apenas com páginas
- [ ] **Fase 5:** Atualizar package.json
- [ ] **Fase 6:** Verificar imports
- [ ] **Fase 7:** Atualizar documentação
- [ ] **Fase 8:** Testar tudo
- [ ] **Fase 9:** Commitar mudanças

---

## 🎯 Resultado Esperado

**Antes:**
```bash
$ cd /home/frank/projeto
$ npm run dev
❌ Error: Couldn't find any pages or app directory
```

**Depois:**
```bash
$ cd /home/frank/projeto
$ npm run dev
✅ Ready on http://localhost:3000
```

---

## 📝 Notas Adicionais

1. **API Routes:** Segundo Next.js 15, API Routes devem estar em `/app/api/` ou `/pages/api/`. Como estamos usando App Router, manter em `/app/api/`.

2. **Componentes:** Podem ficar na raiz (`/components`) por convenção de mercado.

3. **Scripts:** Mover para `/scripts/` separa código da aplicação de scripts utilitários.

4. **Husky:** Após migração, rodar `npm run prepare` para reinstalar hooks.

5. **Vercel Deploy:** Com estrutura na raiz, deploy fica direto (detecta Next.js automaticamente).

---

**Pronto para executar?** Aguardando sua aprovação para iniciar a refatoração.
