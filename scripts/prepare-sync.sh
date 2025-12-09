#!/bin/bash
# =====================================================================
# Script de Preparação para Sincronização do Schema
# =====================================================================

set -e

echo "🗄️  PREPARAÇÃO PARA SINCRONIZAÇÃO DO SCHEMA DO BANCO"
echo "===================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório raiz do projeto
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "📁 Diretório: $PROJECT_ROOT"
echo ""

# =====================================================================
# 1. FAZER BACKUP DOS ARQUIVOS ATUAIS
# =====================================================================
echo "1️⃣  Fazendo backup dos arquivos atuais..."

BACKUP_DIR="backups/schema-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

cp types/database.ts "$BACKUP_DIR/"
cp docs/database-schema.md "$BACKUP_DIR/"

echo -e "${GREEN}✓ Backup salvo em: $BACKUP_DIR${NC}"
echo ""

# =====================================================================
# 2. VERIFICAR SE SUPABASE CLI ESTÁ INSTALADO
# =====================================================================
echo "2️⃣  Verificando Supabase CLI..."

if command -v supabase &> /dev/null; then
    SUPABASE_VERSION=$(supabase --version)
    echo -e "${GREEN}✓ Supabase CLI instalado: $SUPABASE_VERSION${NC}"
else
    echo -e "${RED}✗ Supabase CLI não encontrado${NC}"
    echo ""
    echo "Instale com:"
    echo "  npm install -g supabase"
    echo ""
    echo "Ou use o método SQL manual (scripts/discover-database-schema.sql)"
fi
echo ""

# =====================================================================
# 3. VERIFICAR CONFIGURAÇÃO DO PROJETO
# =====================================================================
echo "3️⃣  Verificando configuração..."

if [ -f ".env.local" ]; then
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        echo -e "${GREEN}✓ .env.local configurado${NC}"
    else
        echo -e "${YELLOW}⚠ .env.local existe mas pode estar incompleto${NC}"
    fi
else
    echo -e "${RED}✗ .env.local não encontrado${NC}"
fi
echo ""

# =====================================================================
# 4. DOCUMENTAR O QUE JÁ SABEMOS
# =====================================================================
echo "4️⃣  Documentando problemas conhecidos..."

cat > "$BACKUP_DIR/known-issues.md" << 'EOF'
# Problemas Conhecidos no Schema Atual

## ❌ Campos que NÃO existem (mas estão nos types)

### Tabela `agents`
- `associated_neurocores` (array) - NÃO EXISTE
- `function` (enum) - NÃO EXISTE
- `communication_medium` - DESCONHECIDO
- `conversation_roteiro` - DESCONHECIDO
- `gender` - DESCONHECIDO
- `objective` - DESCONHECIDO
- `persona` - DESCONHECIDO
- `personality_tone` - DESCONHECIDO
- `instructions` (jsonb) - DESCONHECIDO
- `is_intent_agent` - DESCONHECIDO
- `limitations` (jsonb) - DESCONHECIDO
- `other_instructions` (jsonb) - DESCONHECIDO

## ✅ Campos que EXISTEM (confirmados)

### Tabela `agents`
- `id` (uuid) ✓
- `name` (text) ✓
- `type` (agent_type_enum) ✓
- `id_neurocore` (uuid) ✓ SINGULAR!
- `reactive` (boolean) ✓
- `template_id` (uuid) ✓
- `created_at` (timestamp) ✓
- `updated_at` (timestamp) ✓

## 🔍 Para Investigar

- Estrutura completa de todas as outras tabelas
- Todos os enums e seus valores corretos
- Todas as policies RLS ativas
- Todos os relacionamentos (foreign keys)
- Todos os índices

## 🚨 Impacto de Segurança

### CRÍTICO: RLS Policy Quebrada
- Migration 011 usa campo `associated_neurocores` que não existe
- Policy atual permite vazamento de dados entre tenants
- **CORREÇÃO URGENTE NECESSÁRIA:** fix-rls-definitive.sql
EOF

echo -e "${GREEN}✓ Problemas documentados em: $BACKUP_DIR/known-issues.md${NC}"
echo ""

# =====================================================================
# 5. INSTRUÇÕES PRÓXIMOS PASSOS
# =====================================================================
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "OPÇÃO 1: Supabase CLI (Recomendado)"
echo "  supabase gen types typescript --linked > types/database-new.ts"
echo ""
echo "OPÇÃO 2: SQL Manual"
echo "  1. Abra: https://supabase.com/dashboard"
echo "  2. SQL Editor > Cole: scripts/discover-database-schema.sql"
echo "  3. Execute e copie resultados"
echo ""
echo "OPÇÃO 3: Ambos (Mais Completo)"
echo "  1. Execute Supabase CLI"
echo "  2. Execute SQL Discovery"
echo "  3. Compare resultados"
echo "  4. Atualize documentação"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   Antes de aplicar no código, compare com backup:"
echo "   diff types/database.ts types/database-new.ts"
echo ""
echo -e "${GREEN}✓ Preparação concluída!${NC}"
echo ""
