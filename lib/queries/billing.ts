/**
 * Queries para o sistema de Bilhetagem
 *
 * Todas as queries usam createClient (server-side)
 * e filtram por tenant_id para garantir isolamento multi-tenant.
 *
 * NOTA: As tabelas de billing (wallets, ledger_entries, billing_notifications)
 * e os novos campos de usages ainda nao estao nos tipos gerados do Supabase.
 * Usamos type assertions temporariamente ate regenerar os tipos.
 * Comando: npx supabase gen types typescript --project-id <id> > types/database.ts
 */

import { createClient } from '@/lib/supabase/server';
import type {
  Wallet,
  WalletWithComputed,
  LedgerEntry,
  LedgerFilters,
  LedgerPaginatedResult,
  UsageSummary,
  UsageDailySummary,
  BillingNotification,
  WalletStatus,
} from '@/types/billing';

// ===== WALLET =====

/**
 * Busca a carteira do tenant com campos computados
 */
export async function getWallet(tenantId: string): Promise<WalletWithComputed | null> {
  const supabase = await createClient();

  // Cast para any porque a tabela wallets nao esta nos tipos gerados
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('wallets')
    .select('*')
    .eq('tenant_id', tenantId)
    .single();

  if (error) {
    // Se nao existe carteira, retorna null (pode ser criada depois)
    if (error.code === 'PGRST116') {
      console.warn('Wallet not found for tenant:', tenantId);
      return null;
    }
    console.error('Error fetching wallet:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const wallet = data as Wallet;

  // Calcula campos derivados
  const balance_brl = wallet.balance_credits / 100;
  const overdraft_amount =
    wallet.balance_credits > 0
      ? Math.floor(wallet.balance_credits * wallet.overdraft_percent)
      : 0;
  const available_credits = wallet.balance_credits + overdraft_amount;
  const available_brl = available_credits / 100;

  // Determina status
  let status: WalletStatus = 'ok';
  if (wallet.hard_stop_active || available_credits <= 0) {
    status = 'critical';
  } else if (available_credits <= wallet.low_balance_threshold_credits) {
    status = 'low';
  }

  return {
    ...wallet,
    balance_brl,
    available_credits,
    available_brl,
    status,
  };
}

// ===== LEDGER =====

/**
 * Busca entradas do extrato com filtros e paginacao
 */
export async function getLedgerEntries(
  tenantId: string,
  filters: LedgerFilters = {},
  limit = 50,
  page = 1
): Promise<LedgerPaginatedResult> {
  const supabase = await createClient();
  const offset = (page - 1) * limit;

  // Cast para any porque a tabela ledger_entries nao esta nos tipos gerados
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('ledger_entries')
    .select('*', { count: 'exact' })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  // Aplicar filtros
  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.direction && filters.direction !== 'all') {
    query = query.eq('direction', filters.direction);
  }
  if (filters.sourceType) {
    query = query.eq('source_type', filters.sourceType);
  }

  // Paginacao
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching ledger entries:', error);
    return {
      entries: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  const total = count || 0;

  return {
    entries: (data || []) as LedgerEntry[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Busca uma entrada especifica do extrato
 */
export async function getLedgerEntry(
  tenantId: string,
  entryId: string
): Promise<LedgerEntry | null> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', entryId)
    .single();

  if (error) {
    console.error('Error fetching ledger entry:', error);
    return null;
  }

  return data as LedgerEntry;
}

// ===== USAGE =====

interface UsageRow {
  provider: string | null;
  sku: string | null;
  debited_credits: number | null;
  created_at: string;
}

/**
 * Busca resumo de consumo por provider/sku
 */
export async function getUsageSummaryByProvider(
  tenantId: string,
  days = 7
): Promise<UsageSummary[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usages')
    .select('provider, sku, debited_credits')
    .eq('id_tenant', tenantId)
    .gte('created_at', startDate.toISOString())
    .not('provider', 'is', null)
    .not('debited_credits', 'is', null);

  if (error) {
    console.error('Error fetching usage summary:', error);
    return [];
  }

  const rows = (data || []) as UsageRow[];

  // Agrupa por provider+sku
  const grouped = rows.reduce(
    (acc, usage) => {
      if (!usage.provider) return acc;
      const key = `${usage.provider}|${usage.sku || 'unknown'}`;
      if (!acc[key]) {
        acc[key] = {
          provider: usage.provider,
          sku: usage.sku || 'unknown',
          calls: 0,
          debited_credits: 0,
          debited_brl: 0,
        };
      }
      acc[key].calls += 1;
      acc[key].debited_credits += usage.debited_credits || 0;
      acc[key].debited_brl = acc[key].debited_credits / 100;
      return acc;
    },
    {} as Record<string, UsageSummary>
  );

  return Object.values(grouped).sort((a, b) => b.debited_credits - a.debited_credits);
}

/**
 * Busca consumo diario para grafico
 */
export async function getUsageDaily(
  tenantId: string,
  days = 30
): Promise<UsageDailySummary[]> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usages')
    .select('created_at, debited_credits')
    .eq('id_tenant', tenantId)
    .gte('created_at', startDate.toISOString())
    .not('debited_credits', 'is', null);

  if (error) {
    console.error('Error fetching daily usage:', error);
    return [];
  }

  const rows = (data || []) as UsageRow[];

  // Agrupa por dia
  const grouped = rows.reduce(
    (acc, usage) => {
      const date = usage.created_at.split('T')[0];
      if (!date) return acc;
      if (!acc[date]) {
        acc[date] = { date, total_credits: 0, total_brl: 0, calls: 0 };
      }
      acc[date].calls += 1;
      acc[date].total_credits += usage.debited_credits || 0;
      acc[date].total_brl = acc[date].total_credits / 100;
      return acc;
    },
    {} as Record<string, UsageDailySummary>
  );

  // Preenche dias sem dados com zero
  const result: UsageDailySummary[] = [];
  const currentDate = new Date(startDate);
  const today = new Date();

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    if (dateStr) {
      result.push(
        grouped[dateStr] || {
          date: dateStr,
          total_credits: 0,
          total_brl: 0,
          calls: 0,
        }
      );
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

/**
 * Busca totais de consumo para um periodo
 */
export async function getUsageTotals(
  tenantId: string,
  days = 7
): Promise<{ total_credits: number; total_brl: number; calls: number }> {
  const supabase = await createClient();

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usages')
    .select('debited_credits')
    .eq('id_tenant', tenantId)
    .gte('created_at', startDate.toISOString())
    .not('debited_credits', 'is', null);

  if (error) {
    console.error('Error fetching usage totals:', error);
    return { total_credits: 0, total_brl: 0, calls: 0 };
  }

  const rows = (data || []) as Array<{ debited_credits: number | null }>;

  const total_credits = rows.reduce((sum, usage) => sum + (usage.debited_credits || 0), 0);

  return {
    total_credits,
    total_brl: total_credits / 100,
    calls: rows.length,
  };
}

// ===== NOTIFICATIONS =====

/**
 * Busca notificacoes de billing do tenant
 */
export async function getBillingNotifications(
  tenantId: string,
  limit = 20
): Promise<BillingNotification[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('billing_notifications')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching billing notifications:', error);
    return [];
  }

  return (data || []) as BillingNotification[];
}

// ===== RECARGAS =====

/**
 * Busca historico de recargas (creditos de compra)
 */
export async function getRechargeHistory(
  tenantId: string,
  limit = 20
): Promise<LedgerEntry[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('ledger_entries')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('direction', 'credit')
    .eq('source_type', 'purchase')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recharge history:', error);
    return [];
  }

  return (data || []) as LedgerEntry[];
}

// ===== PROVIDERS DISPONIVEIS =====

/**
 * Busca lista de providers distintos usados pelo tenant
 * (util para filtros)
 */
export async function getUsedProviders(tenantId: string): Promise<string[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('usages')
    .select('provider')
    .eq('id_tenant', tenantId)
    .not('provider', 'is', null);

  if (error) {
    console.error('Error fetching used providers:', error);
    return [];
  }

  const rows = (data || []) as Array<{ provider: string | null }>;

  // Extrai valores unicos
  const providers = [...new Set(rows.map((u) => u.provider).filter(Boolean))];
  return providers as string[];
}

/**
 * Busca lista de SKUs distintos usados pelo tenant
 * (util para filtros)
 */
export async function getUsedSkus(tenantId: string, provider?: string): Promise<string[]> {
  const supabase = await createClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('usages')
    .select('sku')
    .eq('id_tenant', tenantId)
    .not('sku', 'is', null);

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching used SKUs:', error);
    return [];
  }

  const rows = (data || []) as Array<{ sku: string | null }>;

  // Extrai valores unicos
  const skus = [...new Set(rows.map((u) => u.sku).filter(Boolean))];
  return skus as string[];
}
