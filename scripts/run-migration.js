#!/usr/bin/env node

/**
 * Script para executar migration no Supabase
 * Usage: node scripts/run-migration.js migrations/003_message_status_enum.sql
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const SUPABASE_URL = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const migrationFile = process.argv[2] || 'migrations/003_message_status_enum.sql';

async function runMigration() {
  try {
    // Ler arquivo SQL
    const sqlPath = path.join(process.cwd(), migrationFile);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log(`📝 Lendo migration: ${migrationFile}`);
    console.log(`📊 Tamanho do SQL: ${sql.length} bytes`);

    // Criar cliente Supabase com service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('🔌 Conectando ao Supabase...');

    // Dividir SQL em statements separados
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🚀 Executando ${statements.length} statements...\n`);

    // Executar cada statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] Executando...`);
      console.log(statement.substring(0, 100) + '...\n');

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: statement
      });

      if (error) {
        // Tentar executar direto via REST API
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
          },
          body: JSON.stringify({ sql_query: statement })
        });

        if (!response.ok) {
          console.error(`❌ Erro no statement ${i + 1}:`, error);
          console.error('Response:', await response.text());
          // Continuar para os próximos statements
        } else {
          console.log(`✅ Statement ${i + 1} executado com sucesso!`);
        }
      } else {
        console.log(`✅ Statement ${i + 1} executado com sucesso!`);
        if (data) console.log('Resultado:', data);
      }
      console.log('');
    }

    console.log('🎉 Migration concluída!');

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

runMigration();
