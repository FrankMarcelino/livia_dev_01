'use client';

import { useQuery } from '@tanstack/react-query';
import type { SubscriptionDataResponse } from '@/types/stripe';

async function fetchSubscriptionData(): Promise<SubscriptionDataResponse> {
  const response = await fetch('/api/stripe/subscription');

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Falha ao carregar dados da assinatura');
  }

  return response.json();
}

/**
 * Hook for fetching Stripe billing data (subscription + plans)
 */
export function useStripeBilling({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['stripe-billing'],
    queryFn: fetchSubscriptionData,
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}
