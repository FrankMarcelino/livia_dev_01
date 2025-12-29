/**
 * Funil (Funnel) Queries for LIVIA
 * Handles all Supabase interactions for funnel data
 */

import { createClient } from '@/lib/supabase/server';
import type { FunnelData, FunnelKPIs } from '@/types/dashboard';

// ============================================================================
// TYPES
// ============================================================================

interface GetFunilDataParams {
  tenantId: string;
  daysAgo?: number;
  channelId?: string | null;
  startDate?: string;
  endDate?: string;
}

interface RawFunilResponse {
  kpis: FunnelKPIs;
  statusEvolution: Array<{
    date: string;
    open: number;
    paused: number;
    closed: number;
  }>;
  pauseReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  closureReasons: Array<{
    reason: string;
    count: number;
    percentage: number;
  }>;
  reactivationRate: number;
}

// ============================================================================
// MAIN QUERY
// ============================================================================

/**
 * Fetch funil data using optimized Postgres function
 */
export async function getFunilData({
  tenantId,
  daysAgo = 30,
  channelId = null,
  startDate,
  endDate,
}: GetFunilDataParams): Promise<FunnelData> {
  const supabase = await createClient();

  try {
    // Call Postgres function via RPC
    const rpcParams: Record<string, unknown> = {
      p_tenant_id: tenantId,
      p_channel_id: channelId,
    };

    // Use custom date range if provided, otherwise use daysAgo
    if (startDate && endDate) {
      rpcParams.p_start_date = startDate;
      rpcParams.p_end_date = endDate;
    } else {
      rpcParams.p_days_ago = daysAgo;
    }

    const { data, error } = await supabase.rpc('get_funil_data', rpcParams as any);

    if (error) {
      console.error('Error fetching funil data:', error);
      throw new Error(`Funil query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from funil query');
    }

    // Parse and return response
    const rawData = data as unknown as RawFunilResponse;

    // Provide default KPIs if missing
    const defaultKPIs: FunnelKPIs = {
      conversationsOpen: 0,
      conversationsPaused: 0,
      conversationsClosed: 0,
      conversionRate: 0,
      avgTimeToPauseSeconds: 0,
      avgTimeToCloseSeconds: 0,
    };

    const result = {
      kpis: rawData.kpis || defaultKPIs,
      statusEvolution: rawData.statusEvolution || [],
      pauseReasons: rawData.pauseReasons || [],
      closureReasons: rawData.closureReasons || [],
      reactivationRate: rawData.reactivationRate || 0,
    };

    return result;
  } catch (error) {
    console.error('getFunilData error:', error);
    throw error;
  }
}


