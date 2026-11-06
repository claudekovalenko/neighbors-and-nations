import { sb, h, fail, loadSettings } from './lib.js';
import { renderPublic, publicNav } from './public.js';
import { renderStaff } from './staff.js';

const state = { settings: {}, session: null, staff: null, navPages: [] };

async function refreshAuth() {
  const { data } = await sb.auth.getSession();
  state.session = data.session;
  state.staff = null;
  if (state.session) {
    const email = state.session.user.email.toLowerCase();
    const { data: row } = await sb.from('nn_staff').select('*').eq('email', email).maybeSingle();
    state.staff = row || null;
  }
}

function header() {
  const name = state.settings.church_name || 'Neighbors & Nations Christian Church';
  const toggle = h('button', {
    class: 'nav-toggle', 'aria-label': 'Menu',
    onclick: () => document.body.classList.toggle('nav-open'),
  }, '☰');
  const links = publicNav(state.navPages).map(([href, label]) =>
    h('a', { href, onclick: () => document.body.classList.remove('nav-open') }, label));
  const staffLink = h('a', { href: '#/staff', class: 'staff-link' }, state.staff ? 'Staff Portal' : 'Staff Sign In');
  return h('header', { class: 'site-header' },
    h('div', { class: 'wrap header-inner' },
      h('a', { href: '#/', class: 'brand' },
        h('span', { class: 'brand-mark' }, 'N&N'),
        h('span', { class: 'brand-name' }, name)),
      toggle,
      h('nav', { class: 'site-nav' }, links, staffLink)));
}

function footer() {
  const s = state.settings;
  return h('footer', { class: 'site-footer' },
    h('div', { class: 'wrap footer-inner' },
      h('div', {},
        h('strong', {}, s.church_name || 'Neighbors & Nations Christian Church'),
        s.address ? h('div', {}, s.address) : null,
        s.contact_email ? h('div', {}, h('a', { href: `mailto:${s.contact_email}` }, s.contact_email)) : null),
      h('div', { class: 'footer-links' },
        s.facebook_url ? h('a', { href: s.facebook_url, target: '_blank', rel: 'noopener' }, 'Facebook') : null,
        s.instagram_url ? h('a', { href: s.instagram_url, target: '_blank', rel: 'noopener' }, 'Instagram') : null,
        s.church_center_url ? h('a', { href: s.church_center_url, target: '_blank', rel: 'noopener' }, 'Church Center') : null),
      h('div', { class: 'footer-vision' }, s.vision || '')));
}

async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('?')[0].split('/').filter(Boolean);
  const app = document.getElementById('app');
  const main = h('main', { class: 'site-main' });
  app.replaceChildren(header(), main, footer());
  document.body.classList.toggle('in-staff', parts[0] === 'staff');
  window.scrollTo(0, 0);
  try {
    if (parts[0] === 'staff') {
      await renderStaff(main, parts.slice(1), { ...state, refresh: boot });
    } else {
      await renderPublic(main, parts, state);
    }
  } catch (err) {
    fail(err);
    main.append(h('div', { class: 'wrap' }, h('p', { class: 'muted' }, 'Something went wrong loading this page.')));
  }
}

async function boot() {
  try {
    state.settings = await loadSettings();
  } catch (err) {
    console.error(err);
  }
  try {
    const { data } = await sb.from('nn_pages').select('slug, title, show_in_nav, sort').eq('is_public', true).eq('show_in_nav', true).order('sort');
    state.navPages = data || [];
  } catch {
    state.navPages = [];
  }
  await refreshAuth();
  if (state.settings.church_name) document.title = state.settings.church_name;
  await route();
}

// Supabase fires INITIAL_SESSION on load and SIGNED_IN/OUT later. Calls into
// Supabase must not run inside the callback itself, so defer and coalesce them.
// SIGNED_IN can also fire when a tab regains focus; only re-render when the
// signed-in user actually changes so half-finished edits are not lost.
let pending;
let lastUser;
sb.auth.onAuthStateChange((event, session) => {
  if (event === 'PASSWORD_RECOVERY') location.hash = '#/staff/account';
  const user = session?.user?.id || null;
  if (['INITIAL_SESSION', 'SIGNED_IN', 'SIGNED_OUT'].includes(event) && user !== lastUser) {
    lastUser = user;
    clearTimeout(pending);
    pending = setTimeout(boot, 0);
  }
});
window.addEventListener('hashchange', route);
