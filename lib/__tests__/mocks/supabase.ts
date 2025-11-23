import { vi } from 'vitest';

/**
 * Mock do Supabase Client
 *
 * Simula as operações mais comuns do Supabase para testes unitários:
 * - Queries (from, select, eq, neq, in, order, limit, single)
 * - Realtime (channel, on, subscribe, removeChannel)
 */
export const createMockSupabaseClient = () => ({
  // Queries
  from: vi.fn().mockReturnThis(),
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  neq: vi.fn().mockReturnThis(),
  in: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  single: vi.fn(),

  // Realtime
  channel: vi.fn().mockReturnThis(),
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  removeChannel: vi.fn(),

  // Auth
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
});

/**
 * Mock de RealtimeChannel
 */
export const createMockRealtimeChannel = () => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(),
  unsubscribe: vi.fn(),
});

/**
 * Mock de payload de evento realtime
 */
export const createMockRealtimePayload = <T>(data: T, old?: Partial<T>) => ({
  new: data,
  old: old || {},
  eventType: 'INSERT' as const,
  schema: 'public',
  table: 'test',
  commit_timestamp: new Date().toISOString(),
});
