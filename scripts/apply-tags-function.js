const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyFunction() {
  try {
    console.log('📝 Lendo arquivo SQL...');
    const sqlPath = path.join(__dirname, '../sql/dashboard/04_function_tags.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Aplicando função get_tags_data...');

    // Executar SQL usando RPC query
    const { data, error } = await supabase.rpc('query', { query: sqlContent });

    if (error) {
      // Tentar método alternativo via REST API
      console.log('⚠️  Método RPC não disponível, tentando via REST...');

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlContent })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('✅ Função aplicada com sucesso via REST!');
    } else {
      console.log('✅ Função aplicada com sucesso via RPC!');
      console.log('Resultado:', data);
    }
  } catch (error) {
    console.error('❌ Erro ao aplicar função:', error.message);
    console.error('\n💡 Por favor, aplique manualmente no Supabase Dashboard:');
    console.error('   1. Acesse: https://wfrxwfbslhkkzkexyilx.supabase.co');
    console.error('   2. Vá em SQL Editor');
    console.error('   3. Cole o conteúdo de: sql/dashboard/04_function_tags.sql');
    console.error('   4. Execute a query');
    process.exit(1);
  }
}

applyFunction();
