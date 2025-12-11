// Script para aplicar o fix de RLS nas tabelas tags e conversation_tags
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
  db: { schema: 'public' }
});

async function applyRLSFix() {
  console.log('🔧 Aplicando fix de RLS para tags e conversation_tags...\n');

  const sqlStatements = [
    {
      name: 'Habilitar RLS em tags',
      sql: 'ALTER TABLE tags ENABLE ROW LEVEL SECURITY'
    },
    {
      name: 'Habilitar RLS em conversation_tags',
      sql: 'ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY'
    },
    {
      name: 'Remover policy antiga de tags (se existir)',
      sql: 'DROP POLICY IF EXISTS "Tenants can view their tags" ON tags'
    },
    {
      name: 'Remover policy antiga de conversation_tags (se existir)',
      sql: 'DROP POLICY IF EXISTS "Tenants can view their tags" ON conversation_tags'
    },
    {
      name: 'Remover policy users conversation_tags (se existir)',
      sql: 'DROP POLICY IF EXISTS "Users can view conversation_tags" ON conversation_tags'
    },
    {
      name: 'Criar policy para tags',
      sql: `CREATE POLICY "Tenants can view their tags"
  ON tags FOR SELECT
  USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()))`
    },
    {
      name: 'Criar policy para conversation_tags',
      sql: `CREATE POLICY "Users can view conversation_tags"
  ON conversation_tags FOR SELECT
  USING (
    tag_id IN (
      SELECT id FROM tags
      WHERE id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid())
    )
  )`
    }
  ];

  for (const statement of sqlStatements) {
    console.log(`📝 ${statement.name}...`);
    const { error } = await supabase.rpc('exec_sql', { query: statement.sql });

    if (error) {
      // Tentar executar diretamente se exec_sql não existir
      console.log(`   ⚠️  exec_sql não disponível, tentando método alternativo...`);
      console.log(`   💡 Execute manualmente no Supabase Dashboard:`);
      console.log(`   ${statement.sql}\n`);
    } else {
      console.log(`   ✅ Sucesso\n`);
    }
  }

  console.log('\n');
  console.log('=' .repeat(60));
  console.log('📊 IMPORTANTE: Como o Supabase não permite exec_sql por padrão,');
  console.log('você precisa executar o SQL manualmente no Supabase Dashboard.');
  console.log('');
  console.log('📁 Arquivo SQL criado: scripts/fix-tags-rls.sql');
  console.log('');
  console.log('🔗 Passos:');
  console.log('1. Abrir Supabase Dashboard → SQL Editor');
  console.log('2. Copiar e colar o conteúdo de scripts/fix-tags-rls.sql');
  console.log('3. Executar o SQL');
  console.log('=' .repeat(60));
}

applyRLSFix().catch(console.error);
