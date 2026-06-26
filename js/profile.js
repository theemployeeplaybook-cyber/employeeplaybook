import { getSupabase, getUser } from './supabaseClient.js';
import { showToast, setLoading } from './ui.js';

export async function initProfile() {
  if (!location.pathname.endsWith('profile.html')) return;
  const supabase = getSupabase();
  const user = await getUser();
  if (!supabase || !user) return;
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const [firstName = '', ...lastParts] = (profile?.full_name || '').split(' ');
  setValue('firstNameInput', profile?.first_name || firstName || user.user_metadata?.first_name || '');
  setValue('lastNameInput', profile?.last_name || lastParts.join(' ') || user.user_metadata?.last_name || '');
  setValue('emailInput', profile?.email || user.email || '');
  setValue('phoneInput', profile?.phone || '');
  setValue('jobTitleInput', profile?.job_title || '');
  const emailInput = document.getElementById('emailInput');
  if (emailInput) {
    emailInput.readOnly = true;
    emailInput.setAttribute('aria-readonly', 'true');
  }

  const saveBtn = [...document.querySelectorAll('button')].find(b => /save/i.test(b.textContent));
  if (saveBtn) {
    saveBtn.addEventListener('click', async (event) => {
      event.preventDefault();
      setLoading(saveBtn, true, 'Saving...');
      const first = value('firstNameInput');
      const last = value('lastNameInput');
      const payload = {
        user_id: user.id,
        email: user.email,
        first_name: first,
        last_name: last,
        full_name: `${first} ${last}`.trim(),
        phone: value('phoneInput'),
        job_title: value('jobTitleInput'),
        updated_at: new Date().toISOString()
      };
      const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'user_id' });
      setLoading(saveBtn, false);
      if (error) return showToast(error.message, 'error');
      showToast('Profile saved.');
    });
  }
}

function setValue(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function value(id) { return document.getElementById(id)?.value?.trim() || ''; }
