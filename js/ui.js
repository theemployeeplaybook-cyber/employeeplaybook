export function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  document.body.appendChild(el);
  window.setTimeout(() => el.remove(), 3200);
}

export function setLoading(el, isLoading, text = 'Working...') {
  if (!el) return;
  if (isLoading) {
    el.dataset.originalText = el.textContent;
    el.textContent = text;
    el.classList.add('loading');
    el.disabled = true;
  } else {
    el.textContent = el.dataset.originalText || el.textContent;
    el.classList.remove('loading');
    el.disabled = false;
  }
}
