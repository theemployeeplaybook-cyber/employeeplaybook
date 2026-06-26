import { initLayout } from './layout.js';
import { requireAuth, initAuthForms } from './auth.js';
import { initToolState } from './toolState.js';
import { initProfile } from './profile.js';
import { initCheckout } from './checkout.js';

window.addEventListener('DOMContentLoaded', async () => {
  await initLayout();
  initAuthForms();
  initCheckout();
  const allowed = await requireAuth();
  if (!allowed) return;
  initToolState();
  initProfile();
});
