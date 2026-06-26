import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function env(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

const priceToPlan = {
  [process.env.STRIPE_PRICE_CORE_MONTHLY]: { tier: 'core', period: 'monthly' },
  [process.env.STRIPE_PRICE_CORE_ANNUAL]: { tier: 'core', period: 'annual' },
  [process.env.STRIPE_PRICE_EDGE_MONTHLY]: { tier: 'edge', period: 'monthly' },
  [process.env.STRIPE_PRICE_EDGE_ANNUAL]: { tier: 'edge', period: 'annual' }
};

function planFromSubscription(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id;
  return {
    tier: subscription.metadata?.tier || priceToPlan[priceId]?.tier || 'free',
    period: subscription.metadata?.period || priceToPlan[priceId]?.period || 'monthly'
  };
}

async function updateTier(supabaseAdmin, userId, tier) {
  await supabaseAdmin.from('profiles').upsert({
    user_id: userId,
    tier,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });
}

async function upsertSubscription(supabaseAdmin, subscription) {
  const userId = subscription.metadata?.user_id;
  if (!userId) throw new Error(`Subscription ${subscription.id} missing user_id metadata`);
  const { tier, period } = planFromSubscription(subscription);
  const active = ['active', 'trialing'].includes(subscription.status);

  const payload = {
    user_id: userId,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: String(subscription.customer || ''),
    tier,
    period,
    status: subscription.status,
    current_period_start: subscription.current_period_start ? new Date(subscription.current_period_start * 1000).toISOString() : null,
    current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    updated_at: new Date().toISOString()
  };

  const { error } = await supabaseAdmin.from('subscriptions').upsert(payload, {
    onConflict: 'stripe_subscription_id'
  });
  if (error) throw error;
  await updateTier(supabaseAdmin, userId, active ? tier : 'free');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const stripe = new Stripe(env('STRIPE_SECRET_KEY'), { apiVersion: '2024-06-20' });
    const supabaseAdmin = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
      auth: { persistSession: false }
    });

    const signature = req.headers['stripe-signature'];
    if (!signature) return res.status(400).json({ error: 'Missing Stripe signature' });

    const rawBody = await readRawBody(req);
    const event = stripe.webhooks.constructEvent(rawBody, signature, env('STRIPE_WEBHOOK_SECRET'));

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await upsertSubscription(supabaseAdmin, event.data.object);
        break;
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.user_id;
        if (userId) {
          await supabaseAdmin.from('subscriptions').update({ status: 'canceled', updated_at: new Date().toISOString() }).eq('stripe_subscription_id', subscription.id);
          await updateTier(supabaseAdmin, userId, 'free');
        }
        break;
      }
      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[webhook]', err);
    return res.status(400).json({ error: 'Webhook failed' });
  }
}
