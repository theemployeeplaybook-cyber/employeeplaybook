import { getSession, getSupabase } from './supabaseClient.js';
import { showToast } from './ui.js';

const nav = [
  ['The Lens', 'the-lens.html'],
  ['The Toolkit', 'the-toolkit.html'],
  ['The Coach', 'the-coach.html'],
  ['The Shift', 'the-shift.html'],
  ['Pricing', 'the-pricing.html']
];

export async function initLayout() {
  const headerMount = document.querySelector('[data-shared-header]');
  const footerMount = document.querySelector('[data-shared-footer]');
  const current = location.pathname.split('/').pop() || 'index.html';
  const session = await getSession();
  const loggedIn = Boolean(session);

  if (headerMount) {
    headerMount.innerHTML = `
      <header class="site-header">
        <div class="nav-inner">
          <a class="logo" href="index.html" aria-label="The Employee Playbook home">
            <img src="assets/img/logo.png" alt="" onerror="this.style.display='none'" />
            <span>The Employee Playbook</span>
          </a>
          <button class="mobile-toggle" type="button" aria-expanded="false" aria-controls="siteNav">Menu</button>
          <nav id="siteNav" class="nav-links" aria-label="Primary navigation">
            ${nav.map(([label, href]) => `<a class="nav-link" href="${href}" ${current === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
          </nav>
          <div class="nav-actions">
            ${loggedIn
              ? '<a class="btn ghost" href="my-playbook.html">My Playbook</a><a class="btn secondary" href="profile.html">Profile</a><button class="btn" data-action="sign-out" type="button">Sign out</button>'
              : '<a class="btn secondary" href="sign-in.html">Sign in</a><a class="btn" href="create-account.html">Create account</a>'}
          </div>
        </div>
      </header>`;
  }

  if (footerMount) {
    footerMount.innerHTML = `
      <footer class="site-footer">
        <div class="footer-inner">
          <div>
            <div class="footer-title">The Employee Playbook</div>
            <p>Private workplace clarity, scripts and practical tools. Not legal advice.</p>
          </div>
          <div><div class="footer-title">Product</div><ul class="footer-list"><li><a href="the-lens.html">The Lens</a></li><li><a href="the-toolkit.html">The Toolkit</a></li><li><a href="the-coach.html">The Coach</a></li></ul></div>
          <div><div class="footer-title">Account</div><ul class="footer-list"><li><a href="sign-in.html">Sign in</a></li><li><a href="checkout.html">Checkout</a></li><li><a href="profile.html">Profile</a></li></ul></div>
          <div><div class="footer-title">Legal</div><ul class="footer-list"><li><a href="privacy-and-security.html">Privacy & security</a></li><li><a href="terms-and-conditions.html">Terms</a></li><li><a href="help-centre.html">Help centre</a></li></ul></div>
        </div>
        <div class="container footer-bottom">© ${new Date().getFullYear()} The Employee Playbook. Guidance only. Not legal advice.</div>
      </footer>`;
  }

  document.addEventListener('click', async (event) => {
    const toggle = event.target.closest('.mobile-toggle');
    if (toggle) {
      const menu = document.getElementById('siteNav');
      const open = !menu.classList.contains('open');
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    }
    const signOut = event.target.closest('[data-action="sign-out"]');
    if (signOut) {
      const supabase = getSupabase();
      if (supabase) await supabase.auth.signOut();
      showToast('Signed out.');
      location.href = 'index.html';
    }
  });
}
