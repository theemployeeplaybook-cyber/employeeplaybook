import { getSupabase, getSession } from './supabaseClient.js';
import { showToast, setLoading } from './ui.js';

export async function requireAuth() {
  const protectedPage = document.body.dataset.protected === 'true';
  if (!protectedPage) return true;
  const session = await getSession();
  if (session) return true;
  const gate = document.createElement('div');
  gate.className = 'auth-gate';
  gate.innerHTML = `<div class="auth-gate-card"><h2>Sign in to continue</h2><p>This page is part of your private workspace.</p><div class="cluster" style="justify-content:center"><a class="btn" href="sign-in.html">Sign in</a><a class="btn secondary" href="create-account.html">Create account</a></div></div>`;
  document.body.appendChild(gate);
  return false;
}

export function initAuthForms() {
  const supabase = getSupabase();
  if (!supabase) return;

  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const btn = loginForm.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Signing in...');
      const email = document.getElementById('email')?.value?.trim();
      const password = document.getElementById('password')?.value || '';
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(btn, false);
      if (error) return showToast(error.message, 'error');
      location.href = 'the-toolkit.html';
    });
  }

  const createForm = document.getElementById('createAccountForm');
  if (createForm) {
    createForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const btn = createForm.querySelector('button[type="submit"]');
      setLoading(btn, true, 'Creating account...');
      const firstName = document.getElementById('firstName')?.value?.trim() || '';
      const lastName = document.getElementById('lastName')?.value?.trim() || '';
      const email = document.getElementById('email')?.value?.trim() || '';
      const password = document.getElementById('password')?.value || '';
      const confirmPassword = document.getElementById('confirmPassword')?.value || '';
      const newsletter = Boolean(document.getElementById('newsletter')?.checked);
      if (password !== confirmPassword) {
        setLoading(btn, false);
        return showToast('Passwords do not match.', 'error');
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { first_name: firstName, last_name: lastName, full_name: `${firstName} ${lastName}`.trim(), newsletter } }
      });
      if (error) {
        setLoading(btn, false);
        return showToast(error.message, 'error');
      }
      if (data?.user) {
        await supabase.from('profiles').upsert({
          user_id: data.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`.trim(),
          newsletter_opt_in: newsletter,
          tier: 'free',
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });
      }
      setLoading(btn, false);
      showToast('Account created. Check your email if confirmation is enabled.');
      location.href = 'the-toolkit.html';
    });
  }

  const resetBtn = document.getElementById('sendResetBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      const email = document.getElementById('email')?.value?.trim();
      if (!email) return showToast('Enter your email first.', 'error');
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/update-password.html` });
      if (error) return showToast(error.message, 'error');
      showToast('Password reset email sent.');
    });
  }
}
