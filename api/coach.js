import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const SYSTEM_PROMPT = `You are The Employee Playbook Coach. Give practical, calm workplace guidance in UK English. Do not claim to be a lawyer, therapist or HR representative. Flag when the user should seek ACAS, union, HR, legal, medical or emergency support. Keep answers structured, specific and proportionate.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Sign in required' });

    const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid session' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const messages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];
    if (!messages.length) return res.status(400).json({ error: 'Missing message' });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0.35,
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages]
    });

    return res.status(200).json({ reply: completion.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('[coach]', err);
    return res.status(500).json({ error: 'Coach is unavailable right now.' });
  }
}
