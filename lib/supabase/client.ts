"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabaseConfig } from "./env";
import type { Database } from "./database.types";

export function createClient() {
  return createBrowserClient<Database>(
    supabaseConfig.url,
    supabaseConfig.anonKey,
  );
}
