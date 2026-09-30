import { createClient } from "@supabase/supabase-js";

type RuntimeGlobals = typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
};

function env(names: string[]): string | undefined {
  const p = (globalThis as RuntimeGlobals).process?.env;
  for (const n of names) {
    const v = p?.[n]?.trim();
    if (v) return v;
  }
  return undefined;
}

// No caller identity — RLS runs as `anon`. Public tools only.
export function supabaseAnon() {
  const url = env(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  const key = env([
    "SUPABASE_PUBLISHABLE_KEY",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_ANON_KEY",
  ]);
  if (!url || !key) throw new Error("Backend configuration is missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function jsonText(value: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }] };
}
