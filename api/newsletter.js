import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { email } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const cleanEmail = String(email || '').trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) return res.status(400).json({ error: 'Enter a valid email.' });
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { error } = await supabase.from('newsletter_subscribers').upsert({ email: cleanEmail, updated_at: new Date().toISOString() }, { onConflict: 'email' });
    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[newsletter]', err);
    return res.status(500).json({ error: 'Unable to subscribe.' });
  }
}
