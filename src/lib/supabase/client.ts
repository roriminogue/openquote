import { createBrowserClient } from "@supabase/ssr";
import { supabaseEnv } from "./env";

// Supabase client for Client Components (e.g. direct-to-storage uploads).
export function createClient() {
  const { url, key } = supabaseEnv();
  return createBrowserClient(url, key);
}
