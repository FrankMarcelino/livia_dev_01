import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://wfrxwfbslhkkzkexyilx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indmcnh3ZmJzbGhra3prZXh5aWx4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzIxNTcwOSwiZXhwIjoyMDc4NzkxNzA5fQ.aecEqxioevtkt1PO_Z79ZuHt0UuazoHTYiMcPD6UUV0';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('');
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║            SETUP CRM - LIVIA MVP                           ║');
console.log('╚════════════════════════════════════════════════════════════╝');
console.log('');

// ============================================================================
// PASSO 1: VERIFICAR SE MIGRATIONS JÁ FORAM APLICADAS
// ============================================================================

console.log('🔍 Verificando estado do banco...\n');

// Verificar se conversation_tags existe
const { error: ctError } = await supabase
  .from('conversation_tags')
  .select('id')
  .limit(1);

const conversationTagsExists = !ctError || !ctError.message.includes('does not exist');

// Verificar se order_index existe em tags
const { error: orderError } = await supabase
  .from('tags')
  .select('order_index')
  .limit(1);

const orderIndexExists = !orderError || !orderError.message.includes('does not exist');

console.log(`   conversation_tags table: ${conversationTagsExists ? '✅ Existe' : '❌ Não existe'}`);
console.log(`   tags.order_index column: ${orderIndexExists ? '✅ Existe' : '❌ Não existe'}`);
console.log('');

if (!conversationTagsExists || !orderIndexExists) {
  console.log('⚠️  MIGRATIONS NECESSÁRIAS!\n');
  console.log('📝 Execute no Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/wfrxwfbslhkkzkexyilx/sql/new\n');

  if (!conversationTagsExists) {
    console.log('━━━ Migration 006: conversation_tags ━━━');
    const migration006 = readFileSync('./migrations/006_create_conversation_tags.sql', 'utf8');
    console.log(migration006);
    console.log('');
  }

  if (!orderIndexExists) {
    console.log('━━━ Migration 007: tags (order_index, color) ━━━');
    const migration007 = readFileSync('./migrations/007_alter_tags_add_order_color.sql', 'utf8');
    console.log(migration007);
    console.log('');
  }

  console.log('❌ Execute as migrations acima e rode este script novamente!');
  console.log('');
  process.exit(1);
}

// ============================================================================
// PASSO 2: BUSCAR DADOS EXISTENTES
// ============================================================================

console.log('✅ Migrations aplicadas!\n');
console.log('📦 Buscando dados existentes...\n');

// Buscar tags
const { data: tags, error: tagsError } = await supabase
  .from('tags')
  .select('*')
  .order('created_at', { ascending: true });

if (tagsError) {
  console.error('❌ Erro ao buscar tags:', tagsError.message);
  process.exit(1);
}

console.log(`   Tags: ${tags.length} encontradas`);
tags.forEach((tag, i) => console.log(`     ${i + 1}. ${tag.tag_name}`));
console.log('');

// Buscar conversas
const { data: conversations, error: convError } = await supabase
  .from('conversations')
  .select('id, status')
  .order('created_at', { ascending: false })
  .limit(50);

if (convError) {
  console.error('❌ Erro ao buscar conversas:', convError.message);
  process.exit(1);
}

console.log(`   Conversas: ${conversations.length} encontradas (últimas 50)`);
console.log('');

if (tags.length === 0) {
  console.error('❌ Nenhuma tag encontrada! Crie tags primeiro.');
  process.exit(1);
}

if (conversations.length === 0) {
  console.error('❌ Nenhuma conversa encontrada! Crie conversas primeiro.');
  process.exit(1);
}

// ============================================================================
// PASSO 3: ATUALIZAR ORDER_INDEX DAS TAGS
// ============================================================================

console.log('🔢 Atualizando order_index das tags...\n');

for (let i = 0; i < tags.length; i++) {
  const { error } = await supabase
    .from('tags')
    .update({ order_index: i, color: '#3b82f6' }) // Azul padrão
    .eq('id', tags[i].id);

  if (!error) {
    console.log(`   ✓ ${tags[i].tag_name}: order_index = ${i}`);
  }
}
console.log('');

// ============================================================================
// PASSO 4: CRIAR RELACIONAMENTOS
// ============================================================================

console.log('🏷️  Criando relacionamentos conversation_tags...\n');

let created = 0;
let skipped = 0;

for (const conv of conversations) {
  // Cada conversa recebe 1-2 tags aleatórias
  const numTags = Math.random() > 0.6 ? 2 : 1;
  const shuffled = [...tags].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, numTags);

  for (const tag of selected) {
    const { error } = await supabase
      .from('conversation_tags')
      .insert({ conversation_id: conv.id, tag_id: tag.id });

    if (error) {
      if (error.code === '23505') skipped++;
      else console.error(`   ❌ Erro:`, error.message);
    } else {
      created++;
      console.log(`   ✓ Conversa ...${conv.id.slice(-8)} → ${tag.tag_name}`);
    }
  }
}

// ============================================================================
// RESUMO
// ============================================================================

console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log('✅ SETUP CRM CONCLUÍDO!');
console.log('═══════════════════════════════════════════════════════════');
console.log('');
console.log(`📊 Estatísticas:`);
console.log(`   - Tags: ${tags.length}`);
console.log(`   - Conversas: ${conversations.length}`);
console.log(`   - Relacionamentos criados: ${created}`);
console.log(`   - Relacionamentos existentes: ${skipped}`);
console.log('');
console.log('🎉 Acesse http://localhost:3000/crm para testar!');
console.log('');
