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
}: GetFunilDataParams): Promise<FunnelData> {
  const supabase = await createClient();

  try {
    // Call Postgres function via RPC
    // @ts-expect-error - Function will be created by running sql/dashboard/03_function_funil.sql
    const { data, error } = await supabase.rpc('get_funil_data', {
      p_tenant_id: tenantId,
      p_days_ago: daysAgo,
      p_channel_id: channelId,
    });

    if (error) {
      console.error('Error fetching funil data:', error);
      throw new Error(`Funil query failed: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned from funil query');
    }

    // Parse and return response
    const rawData = data as unknown as RawFunilResponse;

    return {
      kpis: rawData.kpis,
      statusEvolution: rawData.statusEvolution || [],
      pauseReasons: rawData.pauseReasons || [],
      closureReasons: rawData.closureReasons || [],
      reactivationRate: rawData.reactivationRate || 0,
    };
  } catch (error) {
    console.error('getFunilData error:', error);
    throw error;
  }
}
