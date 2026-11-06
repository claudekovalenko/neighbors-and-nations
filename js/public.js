import { sb, h, md, toast, fail, fmtDate, fmtTime, isoDate } from './lib.js';
import { PAGES } from './content.js';

const CORE_NAV = [
  ['#/', 'Home'],
  ['#/about', 'About'],
  ['#/sundays', 'Sundays'],
  ['#/ministries', 'Ministries'],
  ['#/events', 'Events'],
  ['#/prayer', 'Prayer'],
  ['#/give', 'Give'],
  ['#/contact', 'Contact'],
];
const CORE_SLUGS = new Set(['home', 'about', 'sundays', 'ministries', 'give', 'contact', 'prayer', 'events']);

export function publicNav(navPages) {
  const extra = navPages.filter((p) => !CORE_SLUGS.has(p.slug)).map((p) => [`#/${p.slug}`, p.title]);
  return [...CORE_NAV.slice(0, -1), ...extra, CORE_NAV.at(-1)];
}

async function getPage(slug) {
  try {
    const { data, error } = await sb.from('nn_pages').select('*').eq('slug', slug).maybeSingle();
    if (!error && data) return data;
  } catch { /* fall through */ }
  const p = PAGES[slug];
  return p ? { slug, title: p.title, body: p.body } : null;
}

async function upcomingEvents(limit) {
  const { data, error } = await sb.from('nn_events').select('*')
    .eq('is_public', true)
    .gte('starts_at', isoDate(new Date()))
    .order('starts_at')
    .limit(limit);
  if (error) throw error;
  return data || [];
}

function eventCard(ev) {
  const when = ev.all_day ? fmtDate(ev.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })
    : `${fmtDate(ev.starts_at, { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtTime(ev.starts_at)}`;
  return h('article', { class: 'event-card' },
    h('div', { class: 'event-date' },
      h('span', { class: 'event-month' }, fmtDate(ev.starts_at, { month: 'short' })),
      h('span', { class: 'event-day' }, fmtDate(ev.starts_at, { day: 'numeric' }))),
    h('div', {},
      h('h3', {}, ev.title),
      h('div', { class: 'muted' }, when, ev.location ? ` · ${ev.location}` : ''),
      ev.description ? h('div', { class: 'event-desc', html: md(ev.description) }) : null));
}

function linkButton(url, label, cls = 'btn') {
  return url ? h('a', { class: cls, href: url, target: '_blank', rel: 'noopener' }, label) : null;
}

async function renderHome(main, { settings }) {
  const [page, events] = await Promise.all([getPage('home'), upcomingEvents(3)]);
  main.append(
    h('section', { class: 'hero' },
      h('div', { class: 'wrap' },
        h('p', { class: 'eyebrow' }, settings.tagline || 'Welcome home'),
        h('h1', {}, settings.church_name || 'Neighbors & Nations Christian Church'),
        h('p', { class: 'hero-vision' }, settings.vision || ''),
        h('div', { class: 'hero-actions' },
          h('a', { class: 'btn', href: '#/sundays' }, 'Plan your Sunday'),
          h('a', { class: 'btn btn-ghost', href: '#/prayer' }, 'Request prayer')))),
    h('section', { class: 'wrap info-strip' },
      h('div', { class: 'info-tile' }, h('h3', {}, 'Sundays'), h('p', {}, settings.service_times || 'Sunday mornings')),
      h('div', { class: 'info-tile' }, h('h3', {}, 'Where'), h('p', {}, settings.address || 'Ask us for directions')),
      h('div', { class: 'info-tile' }, h('h3', {}, 'Kids & youth'), h('p', {}, settings.kids_blurb || 'n2 Kids on Sundays, Awana on Wednesdays'))),
    page ? h('section', { class: 'wrap prose', html: md(page.body) }) : null,
    h('section', { class: 'wrap' },
      h('div', { class: 'section-head' }, h('h2', {}, 'Coming up'), h('a', { href: '#/events' }, 'Full calendar →')),
      events.length ? h('div', { class: 'event-list' }, events.map(eventCard))
        : h('p', { class: 'muted' }, 'No upcoming events posted yet.')));
}

async function renderPage(main, slug, extra) {
  const page = await getPage(slug);
  if (!page) {
    main.append(h('div', { class: 'wrap' }, h('h1', {}, 'Page not found'),
      h('p', {}, h('a', { href: '#/' }, 'Back to home'))));
    return;
  }
  main.append(h('div', { class: 'wrap page' },
    h('h1', {}, page.title),
    h('div', { class: 'prose', html: md(page.body) }),
    extra || null));
}

async function renderEvents(main) {
  const events = await upcomingEvents(200);
  const byMonth = new Map();
  for (const ev of events) {
    const key = fmtDate(ev.starts_at, { month: 'long', year: 'numeric' });
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(ev);
  }
  main.append(h('div', { class: 'wrap page' },
    h('h1', {}, 'Events'),
    events.length ? [...byMonth].map(([month, list]) =>
      h('section', {}, h('h2', { class: 'month-head' }, month), h('div', { class: 'event-list' }, list.map(eventCard))))
      : h('p', { class: 'muted' }, 'No upcoming events posted yet. Check back soon!')));
}

function renderPrayer(main, { settings }) {
  const form = h('form', { class: 'card form', onsubmit: submit },
    h('label', {}, 'Your name (optional)', h('input', { name: 'name', autocomplete: 'name' })),
    h('label', {}, 'Phone or email (optional, if you would like someone to reach out)',
      h('input', { name: 'contact', autocomplete: 'email' })),
    h('label', {}, 'How can we pray for you?', h('textarea', { name: 'need', rows: 6, required: true })),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'ok_to_share' }),
      'It is okay to share this request with the church prayer team'),
    h('button', { class: 'btn', type: 'submit' }, 'Send prayer request'),
    h('p', { class: 'muted small' }, 'Requests go only to our staff and prayer team.'));

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(form);
    const { error } = await sb.from('nn_prayer').insert({
      name: f.get('name') || null,
      contact: f.get('contact') || null,
      need: f.get('need'),
      ok_to_share: f.get('ok_to_share') === 'on',
      source: 'web',
    });
    if (error) return fail(error);
    form.replaceWith(h('div', { class: 'card' }, h('h2', {}, 'Thank you'),
      h('p', {}, 'We received your request and will be praying with you.')));
    toast('Prayer request sent');
  }

  return renderPage(main, 'prayer', h('div', {},
    form,
    settings.church_center_prayer_url
      ? h('p', { class: 'muted' }, 'You can also fill out a prayer card on ',
        h('a', { href: settings.church_center_prayer_url, target: '_blank', rel: 'noopener' }, 'Church Center'), '.')
      : null));
}

function renderGive(main, { settings }) {
  return renderPage(main, 'give', h('div', { class: 'hero-actions' },
    linkButton(settings.giving_url, 'Give online through Church Center')
      || h('p', { class: 'muted' }, 'Online giving link coming soon.')));
}

function renderContact(main, { settings }) {
  return renderPage(main, 'contact', h('div', { class: 'card contact-card' },
    settings.address ? h('p', {}, h('strong', {}, 'Address: '), settings.address) : null,
    settings.contact_email ? h('p', {}, h('strong', {}, 'Email: '),
      h('a', { href: `mailto:${settings.contact_email}` }, settings.contact_email)) : null,
    settings.phone ? h('p', {}, h('strong', {}, 'Phone: '), settings.phone) : null,
    h('div', { class: 'hero-actions' },
      linkButton(settings.church_center_url, 'Church Center'),
      linkButton(settings.facebook_url, 'Facebook', 'btn btn-ghost'),
      linkButton(settings.instagram_url, 'Instagram', 'btn btn-ghost'))));
}

export async function renderPublic(main, parts, state) {
  const slug = parts[0] || 'home';
  if (slug === 'home') return renderHome(main, state);
  if (slug === 'events') return renderEvents(main);
  if (slug === 'prayer') return renderPrayer(main, state);
  if (slug === 'give') return renderGive(main, state);
  if (slug === 'contact') return renderContact(main, state);
  return renderPage(main, slug);
}
