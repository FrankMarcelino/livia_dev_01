/**
 * Script para testar as queries de billing
 * Executar com: npx tsx scripts/test-billing-queries.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const TENANT_ID = '31701213-794d-43c3-a74a-50d57fcd9d2b';

async function testWallet() {
  console.log('\n=== TESTE: getWallet ===');

  const { data, error } = await supabase
    .from('wallets')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .single();

  if (error) {
    console.error('Erro:', error.message);
    return null;
  }

  const balance_brl = data.balance_credits / 100;
  const overdraft = data.balance_credits > 0
    ? Math.floor(data.balance_credits * data.overdraft_percent)
    : 0;
  const available = data.balance_credits + overdraft;

  console.log('Wallet encontrada:');
  console.log(`  ID: ${data.id}`);
  console.log(`  Saldo: ${data.balance_credits} creditos (R$ ${balance_brl.toFixed(2)})`);
  console.log(`  Disponivel: ${available} creditos (R$ ${(available/100).toFixed(2)})`);
  console.log(`  Overdraft: ${data.overdraft_percent * 100}%`);
  console.log(`  Hard Stop: ${data.hard_stop_active ? 'SIM' : 'NAO'}`);

  return data;
}

async function testLedger() {
  console.log('\n=== TESTE: getLedgerEntries ===');

  const { data, error, count } = await supabase
    .from('ledger_entries')
    .select('*', { count: 'exact' })
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  console.log(`Total de entradas: ${count}`);
  console.log('Ultimas 5 entradas:');

  data?.forEach((entry, i) => {
    const sign = entry.direction === 'credit' ? '+' : '-';
    console.log(`  ${i+1}. ${sign}R$ ${(entry.amount_credits/100).toFixed(2)} | ${entry.source_type} | Saldo: R$ ${(entry.balance_after/100).toFixed(2)}`);
  });
}

async function testUsageSummary() {
  console.log('\n=== TESTE: getUsageSummaryByProvider (7 dias) ===');

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7);

  const { data, error } = await supabase
    .from('usages')
    .select('provider, sku, debited_credits')
    .eq('id_tenant', TENANT_ID)
    .gte('created_at', startDate.toISOString())
    .not('provider', 'is', null)
    .not('debited_credits', 'is', null);

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  // Agrupa
  const grouped: Record<string, { provider: string; sku: string; calls: number; credits: number }> = {};

  data?.forEach(u => {
    const key = `${u.provider}|${u.sku}`;
    if (!grouped[key]) {
      grouped[key] = { provider: u.provider, sku: u.sku, calls: 0, credits: 0 };
    }
    grouped[key].calls++;
    grouped[key].credits += u.debited_credits || 0;
  });

  console.log('Consumo por provider/sku:');
  Object.values(grouped)
    .sort((a, b) => b.credits - a.credits)
    .forEach(g => {
      console.log(`  ${g.provider} / ${g.sku}: ${g.calls} chamadas, R$ ${(g.credits/100).toFixed(2)}`);
    });
}

async function testNotifications() {
  console.log('\n=== TESTE: getBillingNotifications ===');

  const { data, error } = await supabase
    .from('billing_notifications')
    .select('*')
    .eq('tenant_id', TENANT_ID)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Erro:', error.message);
    return;
  }

  console.log(`Notificacoes encontradas: ${data?.length || 0}`);

  data?.forEach((n, i) => {
    console.log(`  ${i+1}. [${n.severity}] ${n.type} - ${n.title} (${n.status})`);
  });
}

async function main() {
  console.log('========================================');
  console.log('TESTE DE QUERIES DE BILLING');
  console.log(`Tenant: ${TENANT_ID}`);
  console.log('========================================');

  await testWallet();
  await testLedger();
  await testUsageSummary();
  await testNotifications();

  console.log('\n========================================');
  console.log('TESTES CONCLUIDOS');
  console.log('========================================\n');
}

main().catch(console.error);
