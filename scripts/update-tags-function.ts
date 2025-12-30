import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

async function updateFunction() {
  try {
    console.log('📝 Lendo arquivo SQL...');
    const sqlPath = path.join(__dirname, '../sql/dashboard/04_function_tags.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    console.log('🚀 Executando SQL no Supabase...\n');

    // Usar fetch direto para executar SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ query: sqlContent })
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP: ${response.status} ${response.statusText}`);
      const text = await response.text();
      console.error('Resposta:', text);
      throw new Error(`Failed to execute SQL: ${response.statusText}`);
    }

    console.log('✅ Função get_tags_data atualizada com sucesso!');
    console.log('\n📊 A função agora suporta:');
    console.log('   - p_tenant_id (UUID)');
    console.log('   - p_days_ago (INTEGER, default 30)');
    console.log('   - p_channel_id (UUID, default NULL)');
    console.log('   ✨ p_start_date (TIMESTAMP, default NULL)');
    console.log('   ✨ p_end_date (TIMESTAMP, default NULL)');

  } catch (error: any) {
    console.error('\n❌ Não foi possível aplicar automaticamente.');
    console.error('\n╔════════════════════════════════════════════════════════════════════╗');
    console.error('║  📋 INSTRUÇÕES PARA CORRIGIR O RELATÓRIO DE TAGS                  ║');
    console.error('╚════════════════════════════════════════════════════════════════════╝\n');

    console.error('🔍 PROBLEMA IDENTIFICADO:');
    console.error('   A função get_tags_data no banco estava desatualizada.');
    console.error('   Tags agora são associadas ao NEUROCORE, não ao TENANT.\n');

    console.error('✅ SOLUÇÃO:');
    console.error('   Aplicar a função SQL atualizada no banco de dados.\n');

    console.error('📝 PASSO A PASSO:\n');
    console.error('1️⃣  Acesse o Supabase SQL Editor:');
    console.error('   👉 https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new\n');

    console.error('2️⃣  Abra o arquivo local no seu editor:');
    console.error(`   📁 ${path.join(__dirname, '../sql/dashboard/04_function_tags.sql')}\n`);

    console.error('3️⃣  Copie TODO o conteúdo do arquivo e cole no SQL Editor\n');

    console.error('4️⃣  Clique no botão "Run" (canto inferior direito)\n');

    console.error('5️⃣  Aguarde a mensagem de sucesso:');
    console.error('   ✓ "Success. No rows returned"\n');

    console.error('🎉 APÓS APLICAR:');
    console.error('   Recarregue a página /relatorios/tags e os dados aparecerão!\n');

    console.error('═══════════════════════════════════════════════════════════════════════\n');

    process.exit(1);
  }
}

updateFunction();
