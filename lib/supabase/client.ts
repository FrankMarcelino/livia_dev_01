import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database-helpers';

/**
 * Creates a Supabase client for use in Client Components
 * @returns Supabase browser client instance
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
