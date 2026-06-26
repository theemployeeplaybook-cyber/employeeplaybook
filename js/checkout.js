import { getSession } from './supabaseClient.js';
import { showToast, setLoading } from './ui.js';

export function initCheckout() {
  document.addEventListener('click', async (event) => {
    const btn = event.target.closest('[data-checkout-tier], [data-plan], .checkout-button');
    if (!btn) return;
    const tier = btn.dataset.checkoutTier || btn.dataset.plan || btn.dataset.tier || 'core';
    const period = btn.dataset.period || 'monthly';
    event.preventDefault();
    const session = await getSession();
    if (!session) return location.href = 'sign-in.html';
    setLoading(btn, true, 'Opening checkout...');
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ tier, period })
    });
    const data = await res.json().catch(() => ({}));
    setLoading(btn, false);
    if (!res.ok) return showToast(data.error || 'Checkout failed.', 'error');
    location.href = data.url;
  });
}
