/**
 * Script para verificar as policies RLS das tabelas tags e conversation_tags
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente do .env.local
const envPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match && match[1] && match[2]) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      process.env[key] = value;
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRLS() {
  console.log('🔍 Verificando RLS policies para tags e conversation_tags...\n');

  // Query para buscar policies
  // Nota: exec_sql pode não estar disponível, tratamos isso abaixo
  const { data, error } = await (supabase as any)
    .rpc('exec_sql', {
      query: `
        SELECT
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename IN ('tags', 'conversation_tags')
        ORDER BY tablename, policyname;
      `
    });

  if (error) {
    console.log('⚠️  Não foi possível executar rpc exec_sql');
    console.log('   Vou tentar método alternativo...\n');

    // Método alternativo: verificar se RLS está habilitado
    console.log('📋 Verificando se RLS está habilitado:\n');

    // Verificar tags
    try {
      const { data: tagsWithoutAuth, error: tagsError } = await supabase
        .from('tags')
        .select('id')
        .limit(1);

      if (tagsError) {
        console.log('❌ tags: RLS pode estar bloqueando (ou não há dados)');
        console.log(`   Erro: ${tagsError.message}`);
      } else {
        console.log(`✅ tags: ${tagsWithoutAuth?.length || 0} registros acessíveis`);
      }
    } catch (e: any) {
      console.log('❌ tags: Erro ao acessar');
      console.log(`   ${e.message}`);
    }

    // Verificar conversation_tags
    try {
      const { data: ctWithoutAuth, error: ctError } = await supabase
        .from('conversation_tags')
        .select('id')
        .limit(1);

      if (ctError) {
        console.log('❌ conversation_tags: RLS pode estar bloqueando (ou não há dados)');
        console.log(`   Erro: ${ctError.message}`);
      } else {
        console.log(`✅ conversation_tags: ${ctWithoutAuth?.length || 0} registros acessíveis`);
      }
    } catch (e: any) {
      console.log('❌ conversation_tags: Erro ao acessar');
      console.log(`   ${e.message}`);
    }
  } else {
    console.log('✅ Policies encontradas:');
    console.log(JSON.stringify(data, null, 2));
  }

  console.log('\n');
  console.log('📝 Solução sugerida:');
  console.log('   Execute o seguinte SQL no Supabase Dashboard:\n');
  console.log('   -- Habilitar RLS nas tabelas');
  console.log('   ALTER TABLE tags ENABLE ROW LEVEL SECURITY;');
  console.log('   ALTER TABLE conversation_tags ENABLE ROW LEVEL SECURITY;\n');
  console.log('   -- Policy para tags');
  console.log('   CREATE POLICY "Tenants can view their tags"');
  console.log('     ON tags FOR SELECT');
  console.log('     USING (id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid()));\n');
  console.log('   -- Policy para conversation_tags');
  console.log('   CREATE POLICY "Users can view conversation_tags"');
  console.log('     ON conversation_tags FOR SELECT');
  console.log('     USING (');
  console.log('       tag_id IN (');
  console.log('         SELECT id FROM tags');
  console.log('         WHERE id_tenant = (SELECT tenant_id FROM users WHERE id = auth.uid())');
  console.log('       )');
  console.log('     );');
}

checkRLS().catch(console.error);
