import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const { session_id } = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    if (!session_id) return res.status(400).json({ error: 'Missing session_id' });
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });
    return res.status(200).json({ status: session.status, payment_status: session.payment_status, subscription: session.subscription || null });
  } catch (err) {
    console.error('[verify-session]', err);
    return res.status(500).json({ error: 'Unable to verify session' });
  }
}
