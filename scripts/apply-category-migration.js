// Script para aplicar migration: adicionar campo is_category na tabela tags
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function applyMigration() {
  console.log('🔧 Aplicando migration: add is_category to tags\n');

  try {
    // Executar as queries SQL uma por vez
    console.log('📝 Adicionando coluna is_category...');

    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE tags
        ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT false;
      `
    });

    // Se não tem a função exec_sql, vamos usar outra abordagem
    if (alterError && alterError.message?.includes('function')) {
      console.log('ℹ️  Usando abordagem alternativa...\n');

      // Tentar via query direta (não é ideal, mas funciona)
      const { error } = await supabase.from('tags').select('is_category').limit(1);

      if (error && error.message?.includes('column "is_category" does not exist')) {
        console.log('❌ A coluna is_category não existe e não pode ser adicionada via client.');
        console.log('📋 Execute este SQL manualmente no Supabase Dashboard:\n');
        console.log('─'.repeat(60));
        console.log(`
-- Migration: Add is_category field to tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT false;

COMMENT ON COLUMN tags.is_category IS 'Indica se a tag é uma categoria do Livechat (true) ou uma tag regular do CRM (false)';

CREATE INDEX IF NOT EXISTS idx_tags_is_category ON tags(is_category) WHERE is_category = true;
        `);
        console.log('─'.repeat(60));
        console.log('\n💡 Depois de executar o SQL, rode este script novamente.\n');
        process.exit(1);
      } else if (!error) {
        console.log('✅ Coluna is_category já existe!\n');
      } else {
        throw error;
      }
    } else if (alterError) {
      throw alterError;
    } else {
      console.log('✅ Coluna is_category adicionada!\n');
    }

    console.log('✨ Migration aplicada com sucesso!\n');

  } catch (error) {
    console.error('\n❌ Erro ao aplicar migration:', error);
    console.log('\n📋 Execute este SQL manualmente no Supabase Dashboard:\n');
    console.log('─'.repeat(60));
    console.log(`
-- Migration: Add is_category field to tags table
ALTER TABLE tags
ADD COLUMN IF NOT EXISTS is_category BOOLEAN DEFAULT false;

COMMENT ON COLUMN tags.is_category IS 'Indica se a tag é uma categoria do Livechat (true) ou uma tag regular do CRM (false)';

CREATE INDEX IF NOT EXISTS idx_tags_is_category ON tags(is_category) WHERE is_category = true;
    `);
    console.log('─'.repeat(60));
    process.exit(1);
  }
}

applyMigration();
