import { CONFIG } from './config.js';

let client = null;

export function getSupabase() {
  if (client) return client;
  if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) return null;
  if (!window.supabase?.createClient) return null;
  client = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  return client;
}

export async function getSession() {
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data?.session || null;
}

export async function getUser() {
  const session = await getSession();
  return session?.user || null;
}
