import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(),
}));
