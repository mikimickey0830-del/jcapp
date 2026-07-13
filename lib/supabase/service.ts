import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Server-only lazy proxy. The request cookies are read when a query executes,
 * never at module-import time, so Server Components and Route Handlers share
 * the authenticated server client safely.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const client = createClient();
    if (!client) return undefined;
    const value = Reflect.get(client, property);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
