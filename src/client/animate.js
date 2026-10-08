// Animated number transitions for money values (respects reduced motion).
import { brl } from '../lib/format.js';

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function animateValue(el, from, to, format = brl, duration = 520) {
  if (!el) return;
  if (reduced() || !Number.isFinite(from) || !Number.isFinite(to) || from === to) {
    el.textContent = format(to);
    return;
  }
  const start = performance.now();
  const id = (el.__anim = (el.__anim || 0) + 1);
  const step = (now) => {
    if (el.__anim !== id) return;
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - (1 - t) ** 3;
    el.textContent = format(from + (to - from) * eased);
    if (t < 1) requestAnimationFrame(step);
    else el.textContent = format(to);
  };
  requestAnimationFrame(step);
}

/** Parses "R$ 1.234,56" back into a number (for animating rendered results). */
export function moneyFromText(text) {
  const m = /^(−|-)?\s*R\$\s?([\d.]+,\d{2})$/.exec(String(text).trim());
  if (!m) return null;
  const v = Number(m[2].replace(/\./g, '').replace(',', '.'));
  return m[1] ? -v : v;
}
