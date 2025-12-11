/**
 * Script para depurar dados do CRM
 * Verifica se as relações entre conversation_tags e tags estão corretas
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
// Usar service_role para bypass RLS e ver todos os dados
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não encontradas!');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'OK' : 'MISSING');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function debugCRM() {
  console.log('🔍 Depurando dados do CRM...\n');

  // 1. Verificar tags
  console.log('📋 1. Verificando tags:');
  const { data: tags, error: tagsError } = await supabase
    .from('tags')
    .select('*')
    .limit(5);

  if (tagsError) {
    console.error('❌ Erro ao buscar tags:', tagsError);
  } else {
    console.log(`✅ ${tags?.length || 0} tags encontradas`);
    tags?.forEach((tag) => {
      console.log(`   - ${tag.tag_name} (ID: ${tag.id.substring(0, 8)}...)`);
    });
  }

  console.log('\n');

  // 2. Verificar conversation_tags
  console.log('🔗 2. Verificando conversation_tags:');
  const { data: conversationTags, error: ctError } = await supabase
    .from('conversation_tags')
    .select('*')
    .limit(5);

  if (ctError) {
    console.error('❌ Erro ao buscar conversation_tags:', ctError);
  } else {
    console.log(`✅ ${conversationTags?.length || 0} conversation_tags encontrados`);
    conversationTags?.forEach((ct) => {
      console.log(`   - Conv: ${ct.conversation_id.substring(0, 8)}... -> Tag: ${ct.tag_id.substring(0, 8)}...`);
    });
  }

  console.log('\n');

  // 3. Verificar query com JOIN (sintaxe 1)
  console.log('🔗 3. Testando query com JOIN (sintaxe atual):');
  const { data: test1, error: error1 } = await supabase
    .from('conversation_tags')
    .select(`
      *,
      tag:tags(*)
    `)
    .limit(2);

  if (error1) {
    console.error('❌ Erro na query:', error1);
  } else {
    console.log(`✅ Query executada com sucesso`);
    console.log('Resultado:', JSON.stringify(test1, null, 2));
  }

  console.log('\n');

  // 4. Verificar query de conversas com tags (query atual)
  console.log('💬 4. Testando query completa de conversas:');
  const { data: conversations, error: convError } = await supabase
    .from('conversations')
    .select(`
      id,
      status,
      last_message_at,
      conversation_tags(
        id,
        tag_id,
        tag:tags(
          id,
          tag_name,
          color
        )
      )
    `)
    .limit(2);

  if (convError) {
    console.error('❌ Erro na query de conversas:', convError);
  } else {
    console.log(`✅ ${conversations?.length || 0} conversas encontradas`);
    console.log('Resultado:', JSON.stringify(conversations, null, 2));
  }

  console.log('\n');

  // 5. Diagnóstico
  console.log('📊 5. Diagnóstico:');
  if (test1 && test1.length > 0) {
    const firstItem = test1[0] as any;
    if (firstItem.tag) {
      console.log('✅ Relacionamento tag:tags(*) funcionando corretamente!');
      console.log(`   Tag encontrada: ${firstItem.tag.tag_name}`);
    } else if (firstItem.tags) {
      console.log('⚠️  Campo retornado como "tags" ao invés de "tag"');
      console.log('   Solução: Mudar query para usar .tag ao invés de .tags');
    } else {
      console.log('❌ Relacionamento NÃO está retornando dados da tag');
      console.log('   Possíveis causas:');
      console.log('   1. Foreign key não configurada no banco');
      console.log('   2. tag_id aponta para registro inexistente');
      console.log('   3. RLS bloqueando acesso aos dados');
    }
  } else {
    console.log('⚠️  Nenhum dado de conversation_tags para testar');
  }
}

debugCRM().catch(console.error);
