import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseAdminInstance: SupabaseClient | null = null;

export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
      );
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });
  }

  return supabaseAdminInstance;
};

// Keep backward compatibility with existing code
export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseAdmin()[prop as keyof SupabaseClient];
  },
});
