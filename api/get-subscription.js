import { createClient } from '@supabase/supabase-js';

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false }
    });
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });

    const userId = userData.user.id;
    const [{ data: profile }, { data: subscription }] = await Promise.all([
      supabaseAdmin.from('profiles').select('tier').eq('user_id', userId).maybeSingle(),
      supabaseAdmin.from('subscriptions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).maybeSingle()
    ]);

    return res.status(200).json({ tier: profile?.tier || 'free', subscription: subscription || null });
  } catch (err) {
    console.error('[get-subscription]', err);
    return res.status(500).json({ error: 'Unable to load subscription' });
  }
}
