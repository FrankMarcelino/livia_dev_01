/**
 * Script de debug para verificar tags de conversas
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Carregar .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugConversationTags() {
  console.log('🔍 Verificando tags nas conversas...\n');

  // Primeiro, verificar total de conversas
  const { count: totalConvs } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total de conversas no banco: ${totalConvs}\n`);

  // Buscar conversas com tags
  const { data: conversations, error } = await supabase
    .from('conversations')
    .select(`
      id,
      status,
      contacts(name, phone),
      conversation_tags(
        id,
        tag:tags(
          id,
          tag_name,
          tag_type,
          is_category
        )
      )
    `)
    .limit(20);

  if (error) {
    console.error('❌ Erro:', error);
    return;
  }

  if (!conversations || conversations.length === 0) {
    console.log('❌ Nenhuma conversa encontrada');
    return;
  }

  console.log(`✅ ${conversations.length} conversas encontradas\n`);

  conversations.forEach((conv: any) => {
    const contactName = conv.contacts?.name || conv.contacts?.phone || 'Sem nome';
    const allTags = conv.conversation_tags || [];
    const categoryTags = allTags.filter((ct: any) => ct.tag?.is_category);
    const regularTags = allTags.filter((ct: any) => !ct.tag?.is_category);

    console.log(`📋 Conversa: ${conv.id.slice(0, 8)}...`);
    console.log(`   Contato: ${contactName}`);
    console.log(`   Total de tags: ${allTags.length}`);
    console.log(`   Categorias (is_category=true): ${categoryTags.length}`);
    console.log(`   Tags normais (is_category=false): ${regularTags.length}`);

    if (categoryTags.length > 0) {
      console.log(`   ├─ Categorias: ${categoryTags.map((ct: any) => ct.tag?.tag_name).join(', ')}`);
    }

    if (regularTags.length > 0) {
      console.log(`   └─ Tags normais: ${regularTags.map((ct: any) => ct.tag?.tag_name).join(', ')}`);
    }

    console.log('');
  });
}

debugConversationTags();
