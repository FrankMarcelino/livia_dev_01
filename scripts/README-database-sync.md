# 🗄️ Sincronização do Schema do Banco de Dados

Este diretório contém scripts para manter a documentação e tipos TypeScript sincronizados com o banco de dados real.

## 🚨 PROBLEMA ATUAL

Os arquivos `types/database.ts` e `docs/database-schema.md` estão **desatualizados** e contêm informações incorretas sobre o schema do banco.

Exemplo de problemas encontrados:
- ❌ `agents.associated_neurocores` (não existe - o correto é `id_neurocore`)
- ❌ `agents.function` (não existe)
- ✅ `agents.reactive` (existe mas não estava documentado)

---

## 📋 MÉTODO 1: Supabase CLI (RECOMENDADO)

### Pré-requisitos

```bash
# 1. Instalar Supabase CLI (se não tiver)
npm install -g supabase

# 2. Verificar instalação
supabase --version
```

### Gerar Types Atualizados

```bash
# Opção A: Se você tem o projeto linkado
supabase gen types typescript --linked > types/database-generated.ts

# Opção B: Usando Project ID
supabase gen types typescript --project-id SEU_PROJECT_ID > types/database-generated.ts

# Opção C: Usando database URL diretamente
supabase gen types typescript --db-url "postgresql://..." > types/database-generated.ts
```

### Comparar com Atual

```bash
# Comparar diferenças
diff types/database.ts types/database-generated.ts

# Ou usar uma ferramenta visual
code --diff types/database.ts types/database-generated.ts
```

### Aplicar Atualização

```bash
# Backup do antigo
cp types/database.ts types/database-backup-$(date +%Y%m%d).ts

# Substituir pelo correto
mv types/database-generated.ts types/database.ts

# Testar build
npm run type-check
```

---

## 📋 MÉTODO 2: Script SQL Manual

### Executar Discovery

1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Cole o conteúdo de `scripts/discover-database-schema.sql`
5. Clique em **RUN**
6. **Copie todos os resultados** (8 seções)

### Salvar Resultados

Salve os resultados em um arquivo para referência:

```bash
# Criar arquivo com resultados
cat > scripts/database-discovery-results.txt << 'EOF'
# Cole aqui os resultados do SQL
EOF
```

---

## 📋 MÉTODO 3: Híbrido (MAIS COMPLETO)

1. **Gerar types com CLI:**
   ```bash
   supabase gen types typescript --linked > types/database-new.ts
   ```

2. **Executar SQL de discovery:**
   - Para documentação humanizada
   - Para verificar policies RLS
   - Para listar relacionamentos

3. **Atualizar documentação:**
   ```bash
   # Editar docs/database-schema.md com dados reais
   code docs/database-schema.md
   ```

4. **Verificar e aplicar:**
   ```bash
   npm run type-check
   npm run build
   ```

---

## 🔍 VERIFICAÇÕES IMPORTANTES

Após atualizar os tipos, verifique:

### 1. Tabela `agents`
```typescript
// Verificar campos corretos:
agents: {
  Row: {
    id: string
    name: string
    type: agent_type_enum
    id_neurocore: string  // ← SINGULAR, não array!
    reactive: boolean     // ← Existe!
    template_id: string | null
    // NÃO tem: function, associated_neurocores
  }
}
```

### 2. Tabela `tenants`
```typescript
// Verificar relacionamento:
tenants: {
  Row: {
    id: string
    name: string
    neurocore_id: string  // ← Relaciona com neurocores
    // ...
  }
}
```

### 3. Enums
```typescript
agent_type_enum: "attendant" | "intention" | "observer" | "in_guard_rails"
// NÃO é: "proactive" | "reactive"
```

---

## 📝 CHECKLIST DE ATUALIZAÇÃO

- [ ] 1. Backup dos arquivos atuais
- [ ] 2. Gerar types com Supabase CLI
- [ ] 3. Executar SQL de discovery
- [ ] 4. Comparar types antigos vs novos
- [ ] 5. Identificar todas as diferenças
- [ ] 6. Atualizar `types/database.ts`
- [ ] 7. Atualizar `docs/database-schema.md`
- [ ] 8. Atualizar código que usa campos removidos
- [ ] 9. Rodar `npm run type-check`
- [ ] 10. Rodar `npm run build`
- [ ] 11. Testar aplicação localmente
- [ ] 12. Commit e push

---

## 🚀 AUTOMAÇÃO FUTURA

Para evitar que isso aconteça novamente, criar:

### Script de CI/CD
```yaml
# .github/workflows/verify-types.yml
name: Verify Database Types
on: [push]
jobs:
  check-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: supabase gen types typescript --linked > types/database-check.ts
      - run: diff types/database.ts types/database-check.ts
```

### Pre-commit Hook
```bash
# .husky/pre-commit
#!/bin/sh
echo "Verificando sincronização do schema..."
# Avisar se types/database.ts está muito antigo
```

---

## 📚 RECURSOS

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Supabase Type Generation](https://supabase.com/docs/guides/api/generating-types)
- [PostgreSQL Information Schema](https://www.postgresql.org/docs/current/information-schema.html)

---

**Criado em:** 2025-12-09
**Última Atualização:** 2025-12-09
