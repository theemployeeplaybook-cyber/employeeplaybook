import { CONFIG } from './config.js';
import { getSupabase, getUser } from './supabaseClient.js';

export async function getProfile() {
  const supabase = getSupabase();
  const user = await getUser();
  if (!supabase || !user) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) return null;
  return data;
}

export function tierRank(tier = 'free') {
  return CONFIG.tiers[tier] ?? 0;
}

export async function hasTier(required = CONFIG.defaultPaidTier) {
  const profile = await getProfile();
  return tierRank(profile?.tier) >= tierRank(required);
}
