/**
 * Types para o sistema de Bilhetagem
 *
 * Modelo de creditos:
 * - 1 credito = R$ 0,01
 * - R$ 100,00 = 10.000 creditos
 * - Overdraft: 10% do saldo positivo
 */

// ===== WALLET =====

export interface Wallet {
  id: string;
  tenant_id: string;
  balance_credits: number;
  overdraft_percent: number;
  low_balance_threshold_credits: number;
  notify_low_balance: boolean;
  notify_hard_stop: boolean;
  hard_stop_active: boolean;
  last_low_balance_notified_at: string | null;
  last_hard_stop_notified_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WalletStatus = 'ok' | 'low' | 'critical';

export interface WalletWithComputed extends Wallet {
  /** Saldo em reais (balance_credits / 100) */
  balance_brl: number;
  /** Creditos disponiveis (saldo + overdraft) */
  available_credits: number;
  /** Disponivel em reais (available_credits / 100) */
  available_brl: number;
  /** Status da carteira */
  status: WalletStatus;
}

// ===== LEDGER =====

export type LedgerDirection = 'credit' | 'debit';

export type LedgerSourceType = 'purchase' | 'usage' | 'adjustment' | 'refund';

export interface LedgerEntry {
  id: string;
  tenant_id: string;
  wallet_id: string;
  direction: LedgerDirection;
  amount_credits: number;
  balance_after: number;
  source_type: LedgerSourceType;
  source_ref: string | null;
  usage_id: number | null;
  description: string | null;
  meta: LedgerMeta;
  created_at: string;
}

export interface LedgerMeta {
  // Campos de usage (debit)
  provider?: string;
  sku?: string;
  measures?: Record<string, number>;
  base_usd?: number;
  sell_usd?: number;
  fx_used?: number;
  sell_brl?: number;
  markup_multiplier?: number;
  markup_fixed_usd?: number;
  markup_rule_id?: string;
  // Campos de credit
  credited_credits?: number;
  balance_after?: number;
  // Campos genericos
  [key: string]: unknown;
}

export interface LedgerFilters {
  startDate?: string;
  endDate?: string;
  direction?: LedgerDirection | 'all';
  sourceType?: LedgerSourceType;
  provider?: string;
  sku?: string;
  search?: string;
}

export interface LedgerPaginatedResult {
  entries: LedgerEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===== USAGE =====

export interface Usage {
  id: number;
  created_at: string;
  model: string | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  workflow_id: string | null;
  execution_id: number | null;
  id_tenant: string;
  id_contact: string | null;
  id_agent: string | null;
  id_conversation: string | null;
  provider: string | null;
  sku: string | null;
  measures: Record<string, number> | null;
  base_usd: number | null;
  sell_usd: number | null;
  fx_used: number | null;
  debited_credits: number | null;
}

export interface UsageSummary {
  provider: string;
  sku: string;
  calls: number;
  debited_credits: number;
  debited_brl: number;
}

export interface UsageDailySummary {
  date: string;
  total_credits: number;
  total_brl: number;
  calls: number;
}

export interface UsageByAgentSummary {
  agent_id: string;
  agent_name: string;
  calls: number;
  debited_credits: number;
  debited_brl: number;
}

// ===== BILLING NOTIFICATIONS =====

export type NotificationSeverity = 'info' | 'warning' | 'critical';

export type NotificationType = 'low_balance' | 'hard_stop' | 'recovered' | 'payment_failed';

export type NotificationStatus = 'pending' | 'processing' | 'sent' | 'failed';

export interface BillingNotification {
  id: string;
  tenant_id: string;
  severity: NotificationSeverity;
  type: NotificationType;
  title: string;
  message: string;
  channels: string[];
  status: NotificationStatus;
  tries: number;
  last_error: string | null;
  meta: Record<string, unknown>;
  created_at: string;
  sent_at: string | null;
}

// ===== PRICING (Referencia - Admin) =====

export interface PricingSku {
  id: string;
  provider: string;
  sku: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export interface PricingComponent {
  id: string;
  sku_id: string;
  measure_key: string;
  unit_multiplier: number;
  created_at: string;
}

export interface PricingComponentPrice {
  id: string;
  component_id: string;
  usd_per_unit: number;
  effective_range: string; // tstzrange como string
  created_at: string;
}

// ===== MARKUP RULES (Referencia - Admin) =====

export interface MarkupRule {
  id: string;
  tenant_id: string | null;
  provider: string | null;
  sku: string | null;
  agent_id: string | null;
  multiplier: number;
  fixed_usd: number;
  priority: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ===== AUTO-RECHARGE =====

export interface AutoRechargeConfig {
  id: string;
  tenant_id: string;
  is_enabled: boolean;
  threshold_credits: number;
  recharge_amount_cents: number;
  stripe_payment_method_id: string;
  card_last4: string | null;
  card_brand: string | null;
  last_triggered_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// ===== FX HISTORY =====

export interface FxUsdBrlHistory {
  id: number;
  rate: number;
  source: string | null;
  fetched_at: string;
}

// ===== HELPERS =====

/**
 * Converte creditos para reais
 * @param credits Quantidade de creditos
 * @returns Valor em reais
 */
export function creditsToReal(credits: number): number {
  return credits / 100;
}

/**
 * Converte reais para creditos
 * @param reais Valor em reais
 * @returns Quantidade de creditos
 */
export function realToCredits(reais: number): number {
  return Math.round(reais * 100);
}

/**
 * Formata valor em reais
 * @param value Valor numerico
 * @returns String formatada (ex: "R$ 150,00")
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Formata quantidade de creditos
 * @param credits Quantidade de creditos
 * @returns String formatada (ex: "15.000 creditos")
 */
export function formatCredits(credits: number): string {
  const formatted = new Intl.NumberFormat('pt-BR').format(credits);
  return `${formatted} creditos`;
}

/**
 * Calcula creditos disponiveis com overdraft
 * @param balance Saldo atual em creditos
 * @param overdraftPercent Percentual de overdraft (ex: 0.10 para 10%)
 * @returns Creditos disponiveis
 */
export function calculateAvailableCredits(
  balance: number,
  overdraftPercent: number
): number {
  const overdraftAmount = balance > 0 ? Math.floor(balance * overdraftPercent) : 0;
  return balance + overdraftAmount;
}

/**
 * Determina o status da carteira
 * @param wallet Carteira com dados computados
 * @returns Status da carteira
 */
export function getWalletStatus(
  availableCredits: number,
  threshold: number,
  hardStopActive: boolean
): WalletStatus {
  if (hardStopActive || availableCredits <= 0) {
    return 'critical';
  }
  if (availableCredits <= threshold) {
    return 'low';
  }
  return 'ok';
}
