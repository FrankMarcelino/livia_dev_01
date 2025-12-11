/**
 * Script para popular banco com quick replies de teste
 * Útil para testar performance com muitos dados
 *
 * Uso:
 * npx tsx scripts/seed-quick-replies.ts <tenant_id> <count>
 *
 * Exemplo:
 * npx tsx scripts/seed-quick-replies.ts "123e4567-e89b-12d3-a456-426614174000" 150
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const EMOJIS = ['⚡', '💬', '👋', '📞', '✅', '❌', '🎯', '💡', '🚀', '⭐', '📝', '🔥', '💪', '🎉', '📊'];

const TITLES_PATTERNS = [
  'Saudação {n}',
  'Informação {n}',
  'Atendimento {n}',
  'Suporte Técnico {n}',
  'Comercial {n}',
  'Horário {n}',
  'Localização {n}',
  'Promoção {n}',
  'FAQ {n}',
  'Agendamento {n}',
];

const MESSAGE_PATTERNS = [
  'Olá {nome_cliente}! Bem-vindo(a) ao nosso atendimento. Como posso ajudar você hoje? Protocolo: {protocolo}',
  'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Data: {data}, Hora: {hora}',
  'Obrigado por entrar em contato, {nome_cliente}! Estamos aqui para ajudar.',
  'Estamos localizados na Rua Exemplo, 123 - Centro. Como posso ajudar?',
  'Temos uma promoção especial para você! Entre em contato para mais detalhes.',
  'Para agendar um atendimento, por favor informe sua disponibilidade.',
  'Sua solicitação foi registrada com o protocolo {protocolo}. Em breve entraremos em contato.',
  'Ficamos felizes em atender você, {nome_cliente}! Precisando de algo, estou à disposição.',
  'Nossa equipe está trabalhando para resolver sua solicitação o mais rápido possível.',
  'Caso tenha dúvidas, consulte nossa FAQ em nosso site ou nos envie uma mensagem.',
];

async function seedQuickReplies(tenantId: string, count: number = 150) {
  console.log(`🌱 Criando ${count} quick replies para tenant ${tenantId}...`);

  const quickReplies = Array.from({ length: count }, (_, i) => {
    const titlePattern = TITLES_PATTERNS[i % TITLES_PATTERNS.length] || 'Quick Reply {n}';
    const messagePattern = MESSAGE_PATTERNS[i % MESSAGE_PATTERNS.length] || 'Mensagem {n}';
    const emoji = EMOJIS[i % EMOJIS.length] || '💬';

    return {
      tenant_id: tenantId,
      title: titlePattern.replace('{n}', String(i + 1)),
      message: messagePattern,
      icon: emoji,
      active: true,
      usage_count: Math.floor(Math.random() * 100), // Uso aleatório de 0 a 99
      created_by: null, // Seed não tem usuário
    };
  });

  // Insere em lotes de 50 para evitar timeout
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < quickReplies.length; i += batchSize) {
    const batch = quickReplies.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('quick_reply_templates')
      .insert(batch)
      .select();

    if (error) {
      console.error(`❌ Erro ao inserir lote ${i / batchSize + 1}:`, error);
      continue;
    }

    inserted += data?.length || 0;
    console.log(`✅ Lote ${i / batchSize + 1}/${Math.ceil(quickReplies.length / batchSize)} inserido (${inserted}/${count})`);
  }

  console.log(`\n🎉 ${inserted} quick replies criadas com sucesso!`);
  console.log(`\n📊 Estatísticas:`);
  console.log(`   - Total criado: ${inserted}`);
  console.log(`   - Emojis usados: ${EMOJIS.length}`);
  console.log(`   - Padrões de título: ${TITLES_PATTERNS.length}`);
  console.log(`   - Padrões de mensagem: ${MESSAGE_PATTERNS.length}`);
}

async function cleanQuickReplies(tenantId: string) {
  console.log(`🧹 Limpando quick replies do tenant ${tenantId}...`);

  const { error, count } = await supabase
    .from('quick_reply_templates')
    .delete()
    .eq('tenant_id', tenantId)
    .is('created_by', null); // Remove apenas as de seed

  if (error) {
    console.error('❌ Erro ao limpar:', error);
    return;
  }

  console.log(`✅ ${count || 0} quick replies removidas!`);
}

// Main
const args = process.argv.slice(2);
const command = args[0];

if (command === 'clean') {
  const tenantId = args[1];
  if (!tenantId) {
    console.error('❌ Uso: npx tsx scripts/seed-quick-replies.ts clean <tenant_id>');
    process.exit(1);
  }
  cleanQuickReplies(tenantId).then(() => process.exit(0));
} else {
  const tenantId = args[0];
  const count = parseInt(args[1] || '150', 10);

  if (!tenantId) {
    console.error('❌ Uso: npx tsx scripts/seed-quick-replies.ts <tenant_id> [count]');
    console.error('Exemplo: npx tsx scripts/seed-quick-replies.ts "123e4567-e89b-12d3-a456-426614174000" 150');
    process.exit(1);
  }

  if (isNaN(count) || count < 1 || count > 500) {
    console.error('❌ Count deve ser entre 1 e 500');
    process.exit(1);
  }

  seedQuickReplies(tenantId, count).then(() => process.exit(0));
}
