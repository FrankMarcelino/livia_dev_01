# 🏷️ Instalação das Categorias do Livechat

Este guia explica como configurar as categorias do Livechat no banco de dados.

## 📋 Pré-requisitos

- Acesso ao Supabase Dashboard
- Node.js instalado (para executar scripts)

## 🚀 Passo a Passo

### 1️⃣ Adicionar campo `is_category` na tabela `tags`

Acesse o Supabase Dashboard → SQL Editor e execute:

```sql
-- Migration: Add is_category field to tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT false;

COMMENT ON COLUMN tags.is_category IS 'Indica se a tag é uma categoria do Livechat (true) ou uma tag regular do CRM (false)';

CREATE INDEX IF NOT EXISTS idx_tags_is_category ON tags(is_category) WHERE is_category = true;
```

**Resultado esperado:** ✅ Success. No rows returned

---

### 2️⃣ Criar as tags de categoria

No terminal, execute o script de seed:

```bash
node scripts/seed-livechat-categories.js
```

**Resultado esperado:**
```
🏷️  Criando categorias do Livechat...

🔍 Buscando tenant...
✅ Tenant encontrado: [Nome do Tenant] ([ID])

🔍 Verificando categorias existentes...
📝 Criando categorias...

✅ Categoria criada: Presencial
   - Cor: #3B82F6
   - Ordem: 1
   - ID: [UUID]

✅ Categoria criada: Teoria + Estágio
   - Cor: #A855F7
   - Ordem: 2
   - ID: [UUID]

✅ Categoria criada: Teoria
   - Cor: #EAB308
   - Ordem: 3
   - ID: [UUID]

🎉 Todas as categorias foram criadas com sucesso!

📊 Resumo das categorias:
┌─────────────────────┬──────────┬────────┐
│ Nome                │ Cor      │ Ordem  │
├─────────────────────┼──────────┼────────┤
│ 🔵 Presencial       │ #3B82F6  │   1    │
│ 🟣 Teoria + Estágio │ #A855F7  │   2    │
│ 🟡 Teoria           │ #EAB308  │   3    │
└─────────────────────┴──────────┴────────┘
```

---

## ✅ Verificação

Para verificar se as categorias foram criadas corretamente:

```sql
SELECT tag_name, color, is_category, order_index
FROM tags
WHERE is_category = true
ORDER BY order_index;
```

Deve retornar:

| tag_name          | color   | is_category | order_index |
|-------------------|---------|-------------|-------------|
| Presencial        | #3B82F6 | true        | 1           |
| Teoria + Estágio  | #A855F7 | true        | 2           |
| Teoria            | #EAB308 | true        | 3           |

---

## 🎨 Cores das Categorias

- **🔵 Presencial**: `#3B82F6` (Azul - Blue 500)
- **🟣 Teoria + Estágio**: `#A855F7` (Roxo - Purple 500)
- **🟡 Teoria**: `#EAB308` (Amarelo - Yellow 500)

---

## 📁 Arquivos Criados

- `scripts/add-is-category-to-tags.sql` - Migration SQL
- `scripts/seed-livechat-categories.js` - Script de seed
- `scripts/apply-category-migration.js` - Script auxiliar (não necessário se executar SQL manualmente)
- `scripts/README-livechat-categories.md` - Este arquivo

---

## 🔄 Reexecutando o Seed

Se precisar recriar as categorias:

1. Delete as categorias existentes:
```sql
DELETE FROM conversation_tags WHERE tag_id IN (SELECT id FROM tags WHERE is_category = true);
DELETE FROM tags WHERE is_category = true;
```

2. Execute novamente:
```bash
node scripts/seed-livechat-categories.js
```

---

## 🆘 Troubleshooting

### Erro: "Categorias já existem"
O script detectou que as categorias já foram criadas. Se quiser recriar, siga os passos em "Reexecutando o Seed".

### Erro: "Tenant não encontrado"
Certifique-se de que existe pelo menos um tenant ativo no banco:
```sql
SELECT id, name, is_active FROM tenants WHERE is_active = true;
```

### Erro: "column is_category does not exist"
Execute o SQL da migration (Passo 1️⃣) antes de rodar o script de seed.
