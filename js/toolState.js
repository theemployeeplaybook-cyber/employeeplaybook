import { getSupabase, getUser } from './supabaseClient.js';
import { showToast } from './ui.js';

function fieldKey(field, index) {
  return field.name || field.id || `field_${index}`;
}

function getToolId() {
  return document.body.dataset.toolId || location.pathname.split('/').pop().replace('.html', '');
}

function getFields() {
  return [...document.querySelectorAll('main input, main textarea, main select, main [contenteditable="true"]')]
    .filter(el => !['hidden','submit','button','password'].includes(el.type));
}

export function collectState() {
  const state = {};
  getFields().forEach((field, index) => {
    const key = fieldKey(field, index);
    if (field.type === 'checkbox') state[key] = field.checked;
    else if (field.type === 'radio') {
      if (field.checked) state[key] = field.value;
    } else if (field.isContentEditable) state[key] = field.innerHTML;
    else state[key] = field.value;
  });
  return state;
}

export function applyState(state = {}) {
  getFields().forEach((field, index) => {
    const key = fieldKey(field, index);
    if (!(key in state)) return;
    if (field.type === 'checkbox') field.checked = Boolean(state[key]);
    else if (field.type === 'radio') field.checked = field.value === state[key];
    else if (field.isContentEditable) field.innerHTML = state[key] || '';
    else field.value = state[key] || '';
  });
}

export async function loadToolState() {
  if (document.body.dataset.page !== 'tool') return;
  const toolId = getToolId();
  const local = localStorage.getItem(`tool:${toolId}`);
  if (local) applyState(JSON.parse(local));
  const supabase = getSupabase();
  const user = await getUser();
  if (!supabase || !user) return;
  const { data } = await supabase.from('tool_states').select('state').eq('user_id', user.id).eq('tool_id', toolId).maybeSingle();
  if (data?.state) applyState(data.state);
}

export async function saveToolState({ quiet = false } = {}) {
  if (document.body.dataset.page !== 'tool') return;
  const toolId = getToolId();
  const state = collectState();
  localStorage.setItem(`tool:${toolId}`, JSON.stringify(state));
  const supabase = getSupabase();
  const user = await getUser();
  if (supabase && user) {
    const { error } = await supabase.from('tool_states').upsert({
      user_id: user.id,
      tool_id: toolId,
      state,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,tool_id' });
    if (error && !quiet) return showToast(error.message, 'error');
  }
  if (!quiet) showToast('Saved.');
}

export async function saveToPlaybook() {
  const title = document.querySelector('h1')?.textContent?.trim() || document.title;
  const toolId = getToolId();
  const state = collectState();
  const supabase = getSupabase();
  const user = await getUser();
  if (!supabase || !user) {
    localStorage.setItem(`playbook:${toolId}`, JSON.stringify({ title, toolId, state, saved_at: new Date().toISOString() }));
    return showToast('Saved locally. Sign in to sync to My Playbook.');
  }
  const { error } = await supabase.from('playbook_items').upsert({
    user_id: user.id,
    tool_id: toolId,
    title,
    state,
    source_path: location.pathname.split('/').pop(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,tool_id' });
  if (error) return showToast(error.message, 'error');
  showToast('Saved to My Playbook.');
}

export function initToolState() {
  if (document.body.dataset.page !== 'tool') return;
  const actions = document.createElement('div');
  actions.className = 'tool-actions';
  actions.innerHTML = '<button class="btn secondary" type="button" data-action="print-page">Print</button><button class="btn secondary" type="button" data-action="save-tool">Save progress</button><button class="btn" type="button" data-action="save-playbook">Save to My Playbook</button>';
  document.body.appendChild(actions);
  loadToolState();
  let timer;
  document.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => saveToolState({ quiet: true }), 800);
  });
  document.addEventListener('change', () => saveToolState({ quiet: true }));
  document.addEventListener('click', async (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (!action) return;
    if (action === 'save-tool') { event.preventDefault(); await saveToolState(); }
    if (action === 'save-playbook') { event.preventDefault(); await saveToPlaybook(); }
    if (action === 'print-page') { event.preventDefault(); window.print(); }
    if (action === 'reset-tool') {
      event.preventDefault();
      if (confirm('Clear saved answers on this page?')) {
        localStorage.removeItem(`tool:${getToolId()}`);
        applyState({});
        showToast('Cleared.');
      }
    }
  });
}
