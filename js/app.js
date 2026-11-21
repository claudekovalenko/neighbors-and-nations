import { sb, h, fail, loadSettings } from './lib.js';
import { renderPublic, publicNav } from './public.js';
import { renderStaff } from './staff.js';
import { icon } from './icons.js';

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

const closeNav = () => document.body.classList.remove('nav-open');

function brand() {
  return h('a', { href: '#/', class: 'brand', 'aria-label': 'Neighbors & Nations home', onclick: closeNav },
    h('span', { class: 'brand-mark' }, 'N', h('em', {}, '&'), 'N'),
    h('span', { class: 'brand-name' }, 'Neighbors', h('em', {}, ' & '), 'Nations'));
}

function header() {
  const current = location.hash || '#/';
  const isActive = (href) => current === href || (href !== '#/' && current.startsWith(href + '/'));

  const items = publicNav(state.navPages).map((item) => {
    if (Array.isArray(item)) {
      const [href, label] = item;
      return h('li', {}, h('a', { href, class: isActive(href) ? 'nav-link active' : 'nav-link', onclick: closeNav }, label));
    }
    const active = item.items.some(([href]) => isActive(href));
    return h('li', { class: 'has-menu' },
      h('button', { class: active ? 'nav-link active' : 'nav-link', type: 'button', 'aria-haspopup': 'true' },
        item.label, icon('chevron', 'chev')),
      h('div', { class: 'menu' },
        h('ul', {}, item.items.map(([href, label, blurb]) =>
          h('li', {}, h('a', { href, onclick: closeNav, class: isActive(href) ? 'active' : null },
            h('strong', {}, label), blurb ? h('span', {}, blurb) : null))))));
  });

  const toggle = h('button', {
    class: 'nav-toggle', 'aria-label': 'Open menu',
    onclick: () => document.body.classList.toggle('nav-open'),
  }, icon('menu', 'i-open'), icon('close', 'i-close'));

  return h('header', { class: 'site-header' },
    h('div', { class: 'wrap header-inner' },
      brand(),
      h('nav', { class: 'site-nav', 'aria-label': 'Main' },
        h('ul', { class: 'nav-list' }, items),
        h('div', { class: 'nav-actions' },
          h('a', { href: '#/staff', class: 'staff-link', onclick: closeNav }, icon('lock'), state.staff ? 'Staff portal' : 'Staff'),
          h('a', { href: '#/give', class: 'btn btn-sm', onclick: closeNav }, 'Give'))),
      toggle));
}

function footer() {
  const s = state.settings;
  const social = [
    [s.instagram_url, 'instagram', 'Instagram'],
    [s.youtube_url, 'youtube', 'YouTube'],
    [s.facebook_url, 'facebook', 'Facebook'],
  ].filter(([url]) => url);
  const col = (title, links) => h('div', { class: 'footer-col' },
    h('h4', {}, title),
    h('ul', {}, links.map(([href, label]) => h('li', {}, h('a', { href }, label)))));

  return h('footer', { class: 'site-footer' },
    h('div', { class: 'wrap' },
      h('div', { class: 'footer-top' },
        h('div', { class: 'footer-brand' },
          brand(),
          h('p', { class: 'footer-vision' }, s.vision || ''),
          h('div', { class: 'social' }, social.map(([url, ic, label]) =>
            h('a', { href: url, target: '_blank', rel: 'noopener', 'aria-label': label }, icon(ic))))),
        h('div', { class: 'footer-col' },
          h('h4', {}, 'Visit'),
          h('p', {}, h('strong', {}, s.service_times || 'Sundays')),
          s.address ? h('p', {}, h('a', { href: mapsUrl(s.address), target: '_blank', rel: 'noopener' }, s.address)) : null,
          s.phone ? h('p', {}, h('a', { href: `tel:${s.phone.replace(/\D/g, '')}` }, s.phone)) : null,
          s.contact_email ? h('p', {}, h('a', { href: `mailto:${s.contact_email}` }, s.contact_email)) : null),
        col('Explore', [['#/about', 'About us'], ['#/beliefs', 'Beliefs'], ['#/leadership', 'Leadership'], ['#/sundays', 'Sundays'], ['#/house-churches', 'House churches']]),
        col('Connect', [['#/ministries', 'Ministries'], ['#/outreach', 'Outreach'], ['#/events', 'Events'], ['#/prayer', 'Prayer'], ['#/give', 'Give']])),
      h('div', { class: 'footer-bottom' },
        h('span', {}, `© ${new Date().getFullYear()} ${s.church_name || 'Neighbors & Nations Christian Church'}`),
        h('a', { href: '#/staff' }, 'Staff sign in'))));
}

export function mapsUrl(address) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

// Header sits transparently over a photo hero, then turns solid once scrolled.
function syncHeader() {
  const hdr = document.querySelector('.site-header');
  if (!hdr) return;
  const overHero = document.querySelector('.site-main > :first-child')?.matches('.hero, .page-hero');
  hdr.classList.toggle('over-hero', !!overHero);
  hdr.classList.toggle('scrolled', window.scrollY > 24);
}
window.addEventListener('scroll', syncHeader, { passive: true });

// Fade sections up as they scroll into view.
let observer;
function revealOnScroll(root) {
  observer?.disconnect();
  const els = root.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((el) => el.classList.add('in'));
    return;
  }
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('in'); observer.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  els.forEach((el) => observer.observe(el));
}

async function route() {
  const hash = location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('?')[0].split('/').filter(Boolean);
  const app = document.getElementById('app');
  const main = h('main', { class: 'site-main', id: 'main' });
  closeNav();
  app.replaceChildren(h('a', { class: 'skip', href: '#main', onclick: (e) => { e.preventDefault(); main.focus(); } }, 'Skip to content'),
    header(), main, footer());
  main.tabIndex = -1;
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
    main.append(h('div', { class: 'wrap page' }, h('p', { class: 'muted' }, 'Something went wrong loading this page.')));
  }
  const title = main.querySelector('h1')?.textContent;
  const church = state.settings.church_name || 'Neighbors & Nations Christian Church';
  document.title = parts.length && title ? `${title} · ${church}` : church;
  syncHeader();
  revealOnScroll(main);
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
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
