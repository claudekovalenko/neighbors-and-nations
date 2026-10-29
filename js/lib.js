import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@12.0.2/+esm';
import DOMPurify from 'https://cdn.jsdelivr.net/npm/dompurify@3.1.6/+esm';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

marked.setOptions({ breaks: true });

export function md(text) {
  return DOMPurify.sanitize(marked.parse(text || ''));
}

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

// Tiny DOM builder: h('div', { class: 'x', onclick }, child, 'text', ...)
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === false || value == null) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2), value);
    } else if (key === 'html') {
      el.innerHTML = value;
    } else if (key in el && typeof value !== 'string') {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return el;
}

export function toast(message, kind = 'ok') {
  const el = h('div', { class: `toast toast-${kind}` }, message);
  document.body.append(el);
  setTimeout(() => el.remove(), 3500);
}

export function fail(error) {
  console.error(error);
  toast(error?.message || String(error), 'error');
}

export function fmtDate(value, opts = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!value) return '';
  const d = typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00')
    : new Date(value);
  return isNaN(d) ? String(value) : d.toLocaleDateString(undefined, opts);
}

export function fmtTime(value) {
  const d = new Date(value);
  return isNaN(d) ? '' : d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function fmtStamp(row) {
  if (!row?.updated_at) return '';
  const who = row.updated_by ? ` by ${row.updated_by}` : '';
  return `Last updated ${fmtDate(row.updated_at)} ${fmtTime(row.updated_at)}${who}`;
}

// Next upcoming Sunday (today if it is Sunday) as YYYY-MM-DD.
export function nextSunday(from = new Date()) {
  const d = new Date(from);
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7));
  return isoDate(d);
}

export function isoDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Which "week of the month" (1-5) a date falls in; drives the volunteer rotation.
export function weekOfMonth(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return Math.floor((d.getDate() - 1) / 7) + 1;
}

export function modal(title, body, actions = []) {
  const close = () => wrap.remove();
  const wrap = h('div', { class: 'modal-wrap', onclick: (e) => e.target === wrap && close() },
    h('div', { class: 'modal', role: 'dialog', 'aria-label': title },
      h('div', { class: 'modal-head' },
        h('h2', {}, title),
        h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: close }, '×')),
      h('div', { class: 'modal-body' }, body),
      actions.length ? h('div', { class: 'modal-actions' }, actions) : null));
  document.body.append(wrap);
  wrap.querySelector('input, textarea, select')?.focus();
  return close;
}

export async function loadSettings() {
  const { data, error } = await sb.from('nn_settings').select('key, value');
  if (error) throw error;
  return Object.fromEntries((data || []).map((r) => [r.key, r.value]));
}
