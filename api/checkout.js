import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
};

const priceIds = {
  core: {
    monthly: process.env.STRIPE_PRICE_CORE_MONTHLY,
    annual: process.env.STRIPE_PRICE_CORE_ANNUAL
  },
  edge: {
    monthly: process.env.STRIPE_PRICE_EDGE_MONTHLY,
    annual: process.env.STRIPE_PRICE_EDGE_ANNUAL
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(requiredEnv('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const supabaseAdmin = createClient(requiredEnv('SUPABASE_URL'), requiredEnv('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false }
    });

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Missing auth token' });

    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    if (userError || !userData?.user) return res.status(401).json({ error: 'Invalid auth token' });

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const tier = String(body.tier || '').toLowerCase();
    const period = String(body.period || 'monthly').toLowerCase();
    if (!['core', 'edge'].includes(tier)) return res.status(400).json({ error: 'Invalid tier' });
    if (!['monthly', 'annual'].includes(period)) return res.status(400).json({ error: 'Invalid period' });

    const price = priceIds[tier]?.[period];
    if (!price) return res.status(500).json({ error: 'Missing Stripe price configuration' });

    const siteUrl = requiredEnv('SITE_URL').replace(/\/$/, '');
    const user = userData.user;

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${siteUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout.html`,
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      allow_promotion_codes: true,
      metadata: { app: 'employee-playbook', user_id: user.id, tier, period },
      subscription_data: { metadata: { app: 'employee-playbook', user_id: user.id, tier, period } }
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[checkout]', err);
    return res.status(500).json({ error: 'Checkout failed' });
  }
}
