import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseConfig } from './env';

/**
 * Browser-side Supabase client for authenticated client actions.
 * Uses Supabase SSR cookies so server-rendered routes can verify the session.
 */
export function createSupabaseBrowserClient() {
  const { url, publishableKey } = getSupabaseConfig();
  return createBrowserClient(url, publishableKey);
}
