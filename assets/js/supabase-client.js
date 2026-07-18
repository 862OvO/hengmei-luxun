const SUPABASE_URL = "https://wsxkarlkhuwviubwgwjh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_oHhCfEPQK8ygSs2xtvIf2g_DGdKroYa";

const createClient = window.supabase?.createClient;

export const supabaseClient =
    typeof createClient === "function"
        ? createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                }
            }
        )
        : null;

export function isSupabaseConfigured() {
    return Boolean(
        supabaseClient &&
        SUPABASE_URL.startsWith("https://") &&
        SUPABASE_URL.includes(".supabase.co") &&
        SUPABASE_PUBLISHABLE_KEY.startsWith(
            "sb_publishable_"
        )
    );
}