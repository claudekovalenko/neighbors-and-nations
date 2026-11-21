import { sb, h, md, toast, fail, fmtDate, fmtTime, isoDate } from './lib.js';
import { PAGES } from './content.js';
import { icon } from './icons.js';

const IMG = (id) => `assets/images/${id}.jpg`;

// ── Navigation ──
// Grouped menus become dropdowns on desktop and expanded lists on mobile.
const CORE_NAV = [
  { label: 'About', items: [
    ['#/about', 'About us', 'Our story and vision'],
    ['#/beliefs', 'Beliefs', 'What we believe and why'],
    ['#/leadership', 'Leadership', 'Staff, elders, shepherds & deacons'],
  ] },
  { label: 'Gather', items: [
    ['#/sundays', 'Sundays', 'Worship together at 9:30 AM'],
    ['#/gatherings', 'Your first visit', 'What to expect when you come'],
    ['#/house-churches', 'House churches', 'Monday–Friday across the region'],
  ] },
  { label: 'Ministries', items: [
    ['#/ministries', 'Ministries', 'Kids, youth and more'],
    ['#/outreach', 'Outreach', 'Local partners and global missions'],
  ] },
  ['#/events', 'Events'],
  ['#/prayer', 'Prayer'],
  ['#/contact', 'Contact'],
];
const CORE_SLUGS = new Set(['home', 'about', 'beliefs', 'leadership', 'sundays', 'gatherings', 'house-churches',
  'ministries', 'outreach', 'give', 'contact', 'prayer', 'events']);

export function publicNav(navPages) {
  const extra = navPages.filter((p) => !CORE_SLUGS.has(p.slug)).map((p) => [`#/${p.slug}`, p.title]);
  return [...CORE_NAV.slice(0, -1), ...extra, CORE_NAV.at(-1)];
}

// Per-page hero photo, focal point, eyebrow and subtitle.
const PAGE_META = {
  about:            { img: 'ce77ee7612c147b388f6587eff1f3f8a', pos: 'center 40%', eyebrow: 'About', sub: 'A church family in Buena Park with a heart for the Great Commission.' },
  beliefs:          { img: '990124d4fcf1472d9f56316395533d58', pos: 'center 45%', eyebrow: 'About', sub: 'Firmly rooted in Scripture, our beliefs guide everything we do.' },
  leadership:       { img: '883d4ebd3fdb4021a2f36f8387dc2319', pos: 'center 45%', eyebrow: 'About', sub: 'The team leading out the mission of the church.' },
  sundays:          { img: '58a9a6083c444dd8a36c827699d9d28c', pos: 'center 35%', eyebrow: 'Gather', sub: 'Worship, Scripture and family — every Sunday at 9:30 AM.' },
  gatherings:       { img: 'a766e52fe54d4c0b8735680aaaf0688f', pos: 'center 45%', eyebrow: 'Gather', sub: 'Friendly faces, a casual atmosphere and free coffee on us.' },
  'house-churches': { img: 'ce9c94307eb540da82bec521038a1383', pos: 'center 65%', eyebrow: 'Gather', sub: 'Smaller gatherings through the week for care, accountability and the Word.' },
  ministries:       { img: '9191daca75cb4cb78416b9d0ab17ebef', pos: 'center 45%', eyebrow: 'Ministries', sub: 'Equipping and unleashing Christ followers at every age.' },
  outreach:         { img: 'be0a12f85aa24a3087100d1b353c8eb5', pos: 'center 55%', eyebrow: 'Ministries', sub: 'Seeking and serving Jesus — to our neighbors and to the nations.' },
  give:             { img: '1a0da52d2d5b4649864644778a44d568', pos: 'center 40%', eyebrow: 'Give', sub: 'Thank you for joyfully partnering in what God is doing.' },
  prayer:           { img: '132cc16c6cfb4bfcaf95fb9fa4f5237f', pos: 'center 40%', eyebrow: 'Prayer', sub: 'We would love to pray with you.' },
  contact:          { img: '15b769b6bb17401b937f727d501a5693', pos: 'center 40%', eyebrow: 'Contact', sub: 'We’d love to hear from you.' },
  events:           { img: 'feea9dd33b954231bf14fcfa66775393', pos: 'center 45%', eyebrow: 'Events', sub: 'What’s coming up at Neighbors & Nations.' },
};
const DEFAULT_META = { img: 'hero', pos: 'center 45%', eyebrow: 'Neighbors & Nations' };

// Card headings that match a keyword get a photo.
const CARD_IMAGES = [
  [/pier youth|youth/i, '9191daca75cb4cb78416b9d0ab17ebef'],
  [/n2 kids|children/i, 'c880544c3764409a9b946e6f3fff9e68'],
  [/^outreach$/i, 'be0a12f85aa24a3087100d1b353c8eb5'],
  [/start a ministry/i, '905d46607f9e43a28be01a4816a59bbd'],
];

// ── Data ──

async function getPage(slug) {
  try {
    const { data, error } = await sb.from('nn_pages').select('*').eq('slug', slug).maybeSingle();
    if (!error && data) return data;
  } catch { /* fall through */ }
  const p = PAGES[slug];
  return p ? { slug, title: p.title, body: p.body } : null;
}

async function upcomingEvents(limit) {
  try {
    const { data, error } = await sb.from('nn_events').select('*')
      .eq('is_public', true)
      .gte('starts_at', isoDate(new Date()))
      .order('starts_at')
      .limit(limit);
    if (!error) return data || [];
  } catch { /* no DB yet */ }
  return [];
}

// ── Shared pieces ──

const ext = { target: '_blank', rel: 'noopener' };
const mapsUrl = (a) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a)}`;
const telUrl = (p) => `tel:${p.replace(/\D/g, '')}`;

function btn(href, label, cls = 'btn', ic) {
  if (!href) return null;
  const external = /^https?:/.test(href);
  return h('a', { class: cls, href, ...(external ? ext : {}) }, ic ? icon(ic) : null, label);
}

function sectionHead(eyebrow, title, extra) {
  return h('div', { class: 'section-head reveal' },
    h('div', {}, eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null, h('h2', {}, title)),
    extra || null);
}

function pageHero(slug, title) {
  const m = PAGE_META[slug] || DEFAULT_META;
  return h('section', { class: 'page-hero' },
    h('img', { class: 'hero-img', src: IMG(m.img), alt: '', style: `object-position:${m.pos}`, fetchpriority: 'high' }),
    h('div', { class: 'wrap' },
      h('p', { class: 'eyebrow eyebrow-light' }, m.eyebrow),
      h('h1', {}, title),
      m.sub ? h('p', { class: 'hero-sub' }, m.sub) : null));
}

function eventCard(ev) {
  const when = ev.all_day ? fmtDate(ev.starts_at, { weekday: 'long' })
    : `${fmtDate(ev.starts_at, { weekday: 'long' })} · ${fmtTime(ev.starts_at)}`;
  return h('article', { class: 'event-card reveal' },
    h('div', { class: 'event-date' },
      h('span', { class: 'event-month' }, fmtDate(ev.starts_at, { month: 'short' })),
      h('span', { class: 'event-day' }, fmtDate(ev.starts_at, { day: 'numeric' }))),
    h('div', { class: 'event-body' },
      h('h3', {}, ev.title),
      h('p', { class: 'event-meta' }, icon('clock'), when, ev.location ? [' ', icon('pin'), ev.location] : null),
      ev.description ? h('div', { class: 'event-desc', html: md(ev.description) }) : null));
}

// ── Markdown → designed layout ──
// Pages stay plain markdown so staff can edit them; this turns the structure
// into a layout. `---` and headings split the page into blocks:
//   · text before the first heading      → lead paragraph
//   · "## Heading" with a lot of text    → two-column editorial block
//   · "### Heading" or a short "##" block → card; neighbouring cards form a grid

function chunk(html) {
  const tmp = h('div', { html });
  const chunks = [];
  let cur = null;
  for (const node of [...tmp.childNodes]) {
    if (node.nodeType === 3 && !node.textContent.trim()) continue;
    if (node.nodeName === 'HR') { cur = null; continue; }
    if (node.nodeName === 'H2' || node.nodeName === 'H3' || !cur) {
      cur = { level: node.nodeName === 'H2' ? 2 : node.nodeName === 'H3' ? 3 : 0, nodes: [] };
      chunks.push(cur);
    }
    cur.nodes.push(node);
  }
  for (const c of chunks) {
    c.text = c.nodes.map((n) => n.textContent).join(' ').trim();
    c.kind = c.level === 3 || (c.level === 2 && c.text.length < 360) ? 'card' : c.level === 2 ? 'split' : 'lead';
  }
  // A short "## Heading" opening the page just restates the hero title: show its text as the lead.
  const first = chunks[0];
  if (first?.level === 2 && first.kind === 'card' && chunks[1]?.kind === 'card') {
    first.nodes.shift();
    first.kind = 'lead';
  }
  return chunks;
}

function cardFrom(c, i) {
  const [head, ...rest] = c.nodes;
  const title = head.textContent;
  const img = CARD_IMAGES.find(([re]) => re.test(title))?.[1];
  const links = rest.flatMap((n) => (n.querySelectorAll ? [...n.querySelectorAll('a')] : []));
  const card = h('article', { class: `content-card reveal${img ? ' has-img' : ''}${links.length === 1 ? ' is-link' : ''}`, style: `--d:${(i % 3) * 70}ms` },
    img ? h('div', { class: 'card-img' }, h('img', { src: IMG(img), alt: '', loading: 'lazy' })) : null,
    h('div', { class: 'card-body' },
      h('h3', {}, title),
      h('div', { class: 'card-text' }, rest)));
  if (links.length === 1) links[0].classList.add('stretched');
  return card;
}

function layout(markdown) {
  const out = [];
  let grid = null;
  let cardIndex = 0;
  for (const c of chunk(md(markdown))) {
    if (c.kind === 'card') {
      if (!grid) { grid = h('div', { class: 'card-grid' }); out.push(grid); cardIndex = 0; }
      grid.append(cardFrom(c, cardIndex++));
      continue;
    }
    grid = null;
    if (c.kind === 'split') {
      const [head, ...rest] = c.nodes;
      out.push(h('section', { class: 'split reveal' },
        h('div', { class: 'split-head' }, h('h2', {}, head.textContent)),
        h('div', { class: 'prose' }, rest)));
    } else {
      out.push(h('div', { class: 'prose lead reveal' }, c.nodes));
    }
  }
  // A grid holding a single card reads better as a callout.
  for (const g of out) if (g.classList?.contains('card-grid') && g.children.length === 1) g.classList.add('single');
  return out;
}

async function renderPage(main, slug, { before, after } = {}) {
  const page = await getPage(slug);
  if (!page) return notFound(main);
  main.append(
    pageHero(slug, page.title),
    h('div', { class: 'wrap page-body' }, before || null, layout(page.body), after || null));
}

function notFound(main) {
  main.append(h('section', { class: 'wrap page notfound' },
    h('p', { class: 'eyebrow' }, '404'),
    h('h1', {}, 'We couldn’t find that page'),
    h('p', { class: 'muted' }, 'It may have moved. Try one of these instead:'),
    h('div', { class: 'actions' }, btn('#/', 'Home'), btn('#/sundays', 'Sundays', 'btn btn-outline'), btn('#/contact', 'Contact us', 'btn btn-outline'))));
}

// ── Home ──

function taglineHeading(tagline) {
  const t = tagline || 'Loving our neighbors and the nations';
  const i = t.lastIndexOf(' and ');
  return i > 0 ? [t.slice(0, i), h('br'), h('em', {}, t.slice(i + 1))] : t;
}

async function renderHome(main, { settings: s }) {
  const [events, hcCount] = [await upcomingEvents(3), houseChurchCount()];

  const hero = h('section', { class: 'hero' },
    h('img', { class: 'hero-img', src: IMG('hero'), alt: '', fetchpriority: 'high' }),
    h('div', { class: 'wrap hero-inner' },
      h('p', { class: 'pill' }, h('span', { class: 'dot' }), s.service_times || 'Sundays', ' · Buena Park, CA'),
      h('h1', {}, taglineHeading(s.tagline)),
      h('p', { class: 'hero-sub' }, s.vision || ''),
      h('div', { class: 'actions' },
        btn('#/gatherings', 'Plan your visit', 'btn btn-lg'),
        btn(s.youtube_url, 'Watch online', 'btn btn-lg btn-glass', 'play'))));

  const visit = h('section', { class: 'wrap visit-bar-wrap' },
    h('div', { class: 'visit-bar' },
      visitItem('clock', 'When', s.service_times || 'Sundays', h('a', { href: '#/sundays' }, 'Plan your Sunday')),
      visitItem('pin', 'Where', s.address || '', s.address ? h('a', { href: mapsUrl(s.address), ...ext }, 'Get directions') : null),
      visitItem('kids', 'Kids', s.kids_blurb || 'Kids classes every Sunday', h('a', { href: '#/ministries' }, 'Kids & youth')),
      visitItem('youtube', 'Online', 'Livestream every Sunday', btn(s.youtube_url, 'Watch on YouTube', ''))));

  const who = h('section', { class: 'wrap section who' },
    h('div', { class: 'who-text reveal' },
      h('p', { class: 'eyebrow' }, 'Who we are'),
      h('h2', {}, 'Making disciples who make disciples.'),
      h('p', { class: 'lead-text' }, 'Neighbors and Nations Christian Church was established in May of 2021 with the heart to pursue and be obedient to the Great Commission — both to our neighbors, where we live, work and play, and to the nations.'),
      h('ul', { class: 'stats' },
        stat('2021', 'Founded in Buena Park'),
        stat(String(hcCount || '10+'), 'House churches'),
        stat('Mon–Fri', 'Gatherings all week')),
      h('div', { class: 'actions' }, btn('#/about', 'Our story', 'btn btn-outline'), btn('#/beliefs', 'What we believe', 'btn-text', null))),
    h('div', { class: 'collage reveal' },
      h('img', { src: IMG('ce77ee7612c147b388f6587eff1f3f8a'), alt: 'The congregation gathered for Sunday worship', loading: 'lazy' }),
      h('img', { src: IMG('a766e52fe54d4c0b8735680aaaf0688f'), alt: 'People chatting at the coffee bar', loading: 'lazy' }),
      h('img', { src: IMG('c880544c3764409a9b946e6f3fff9e68'), alt: 'A child playing in the n2 Kids room', loading: 'lazy' })));

  const gather = h('section', { class: 'section tint' },
    h('div', { class: 'wrap' },
      sectionHead('Get connected', 'Ways to gather'),
      h('div', { class: 'photo-cards' },
        photoCard('#/sundays', '58a9a6083c444dd8a36c827699d9d28c', 'Sunday mornings', 'Worship and Scripture-rich teaching together as one family.', 'Sundays · 9:30 AM'),
        photoCard('#/house-churches', 'ce9c94307eb540da82bec521038a1383', 'House churches', 'Smaller gatherings across the region for care, prayer and the Word.', hcCount ? `${hcCount} groups · Mon–Fri` : 'Monday–Friday'),
        photoCard('#/ministries', '9191daca75cb4cb78416b9d0ab17ebef', 'Kids & youth', 'n2 Kids on Sundays and The Pier Youth for middle & high schoolers.', 'All ages'))));

  const mission = h('section', { class: 'mission' },
    h('img', { class: 'hero-img', src: IMG('be0a12f85aa24a3087100d1b353c8eb5'), alt: '', loading: 'lazy' }),
    h('div', { class: 'wrap mission-inner reveal' },
      h('p', { class: 'eyebrow eyebrow-light' }, 'Our vision'),
      h('blockquote', {}, s.vision || ''),
      h('div', { class: 'actions' },
        btn('#/outreach', 'Local & global outreach', 'btn btn-light'),
        btn('#/ministries', 'Our ministries', 'btn btn-glass'))));

  const coming = events.length ? h('section', { class: 'wrap section' },
    sectionHead('Calendar', 'Coming up', h('a', { href: '#/events', class: 'btn-text' }, 'All events', icon('arrow'))),
    h('div', { class: 'event-list' }, events.map(eventCard))) : null;

  const messages = h('section', { class: 'wrap section' },
    h('div', { class: 'feature reveal' },
      h('div', { class: 'feature-img' }, h('img', { src: IMG('883d4ebd3fdb4021a2f36f8387dc2319'), alt: 'Teaching on a Sunday morning', loading: 'lazy' }),
        s.youtube_url ? h('a', { class: 'play-btn', href: s.youtube_url, ...ext, 'aria-label': 'Watch messages on YouTube' }, icon('play')) : null),
      h('div', { class: 'feature-text' },
        h('p', { class: 'eyebrow' }, 'Messages'),
        h('h2', {}, 'Missed a Sunday?'),
        h('p', {}, 'Sunday mornings are full of Scripture-rich teaching and worship. Watch the current series or dive into the archives anytime.'),
        h('div', { class: 'actions' }, btn(s.youtube_url, 'Watch on YouTube', 'btn', 'youtube')))));

  const ctas = h('section', { class: 'wrap section cta-pair' },
    ctaCard('heart', 'Prayer', 'How can we pray for you?', 'Share a request with our staff and prayer team. We’d be honored to pray with you.', '#/prayer', 'Send a prayer request'),
    ctaCard('gift', 'Give', 'Partner in the mission', s.text_to_give_number
      ? `Give online, on campus, or text any amount to ${s.text_to_give_number}.` : 'Give online or on campus.', '#/give', 'Ways to give', 'accent'));

  main.append(...[hero, visit, who, gather, mission, coming, messages, ctas].filter(Boolean));
}

function visitItem(ic, label, value, link) {
  return h('div', { class: 'visit-item' },
    icon(ic, 'visit-icon'),
    h('div', {}, h('span', { class: 'visit-label' }, label), h('strong', {}, value), link ? h('div', { class: 'visit-link' }, link) : null));
}

function stat(n, label) {
  return h('li', {}, h('strong', {}, n), h('span', {}, label));
}

function photoCard(href, img, title, text, tag) {
  return h('a', { class: 'photo-card reveal', href },
    h('img', { src: IMG(img), alt: '', loading: 'lazy' }),
    h('div', { class: 'photo-card-body' },
      h('span', { class: 'tag' }, tag),
      h('h3', {}, title),
      h('p', {}, text),
      h('span', { class: 'more' }, 'Learn more', icon('arrow'))));
}

function ctaCard(ic, eyebrow, title, text, href, label, tone = '') {
  return h('a', { class: `cta-card reveal ${tone}`, href },
    icon(ic, 'cta-icon'),
    h('p', { class: 'eyebrow' }, eyebrow),
    h('h3', {}, title),
    h('p', {}, text),
    h('span', { class: 'more' }, label, icon('arrow')));
}

// ── House churches ──
// Parses the markdown list ("### Day", "**Name** · City · Time", "Contact …")
// into cards with day filters. Falls back to the generic layout if the text
// no longer matches that shape.

function parseHouseChurches(body) {
  const lines = body.split('\n').map((l) => l.trim());
  const groups = [];
  const intro = [];
  const outro = [];
  let day = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dayMatch = line.match(/^###\s+(.+)/);
    if (dayMatch) { day = dayMatch[1]; continue; }
    const m = line.match(/^\*\*(.+?)\*\*\s*(?:\*\((.+?)\)\*)?\s*·\s*(.+?)\s*·\s*(.+)$/);
    if (m && day) {
      const contactLine = (lines[i + 1] || '').replace(/^Contact\s+/i, '');
      const lang = contactLine.match(/\*\((.+?)\)\*/)?.[1];
      groups.push({ day, name: m[1], note: m[2], city: m[3], time: m[4], contact: contactLine.replace(/\s*\*\(.+?\)\*/, ''), lang });
      i++;
      continue;
    }
    if (!line || line === '---') continue;
    (day ? outro : intro).push(line);
  }
  return { groups, intro: intro.join('\n'), outro: outro.join('\n') };
}

function houseChurchCount() {
  return parseHouseChurches(PAGES['house-churches']?.body || '').groups.length;
}

function contactWithLinks(text) {
  const parts = text.split(/(\(\d{3}\)\s?\d{3}-\d{4})/);
  return parts.map((p, i) => (i % 2 ? h('a', { href: telUrl(p), class: 'tel' }, icon('phone'), p) : p));
}

async function renderHouseChurches(main) {
  const page = await getPage('house-churches');
  if (!page) return notFound(main);
  const { groups, intro, outro } = parseHouseChurches(page.body);
  if (!groups.length) return renderPage(main, 'house-churches');

  const days = [...new Set(groups.map((g) => g.day))];
  let activeDay = 'All';
  const search = h('input', { type: 'search', placeholder: 'Search by city or name', 'aria-label': 'Search house churches', oninput: draw });
  const chips = h('div', { class: 'chips', role: 'tablist' });
  const results = h('div', { class: 'hc-results' });
  const count = h('p', { class: 'hc-count' });

  function drawChips() {
    chips.replaceChildren(...['All', ...days].map((d) =>
      h('button', { type: 'button', class: d === activeDay ? 'chip active' : 'chip', role: 'tab', 'aria-selected': String(d === activeDay),
        onclick: () => { activeDay = d; drawChips(); draw(); } }, d)));
  }

  function draw() {
    const q = search.value.trim().toLowerCase();
    const list = groups.filter((g) => (activeDay === 'All' || g.day === activeDay)
      && (!q || `${g.name} ${g.city} ${g.contact}`.toLowerCase().includes(q)));
    count.textContent = `${list.length} ${list.length === 1 ? 'house church' : 'house churches'}`;
    const byDay = days.map((d) => [d, list.filter((g) => g.day === d)]).filter(([, l]) => l.length);
    results.replaceChildren(...(byDay.length ? byDay.map(([d, l]) => h('section', { class: 'hc-day' },
      h('h2', {}, d, h('span', {}, String(l.length))),
      h('div', { class: 'hc-grid' }, l.map((g) => h('article', { class: 'hc-card' },
        h('div', { class: 'hc-top' },
          h('span', { class: 'hc-time' }, icon('clock'), g.time),
          g.lang ? h('span', { class: 'tag tag-soft' }, g.lang) : null),
        h('h3', {}, g.name),
        h('p', { class: 'hc-city' }, icon('pin'), g.city),
        g.note ? h('p', { class: 'hc-note' }, g.note) : null,
        h('p', { class: 'hc-contact' }, contactWithLinks(g.contact)))))))
      : [h('div', { class: 'empty' }, icon('search'), h('p', {}, 'No house churches match that search.'),
        h('a', { href: '#/contact' }, 'Ask us to help you find one'))]));
  }

  drawChips();
  draw();
  main.append(
    pageHero('house-churches', page.title),
    h('div', { class: 'wrap page-body' },
      intro ? h('div', { class: 'prose lead reveal', html: md(intro) }) : null,
      h('div', { class: 'hc-toolbar' }, chips, h('label', { class: 'search' }, icon('search'), search)),
      count,
      results,
      h('div', { class: 'callout reveal' },
        h('div', {}, outro ? h('div', { html: md(outro) }) : null),
        btn('#/contact', 'Help me find one', 'btn'))));
}

// ── Leadership ──

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

async function renderLeadership(main) {
  const page = await getPage('leadership');
  if (!page) return notFound(main);
  const tmp = h('div', { html: md(page.body) });
  const table = tmp.querySelector('table');
  if (!table) return renderPage(main, 'leadership');

  // Columns are found by header text so "Photo" stays optional and can sit anywhere.
  const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim().toLowerCase());
  const col = (name, fallback) => { const i = heads.indexOf(name); return i >= 0 ? i : fallback; };
  const [iName, iRole, iPhoto] = [col('name', 0), col('role', 1), col('photo', -1)];
  const staff = [...table.querySelectorAll('tbody tr')].map((tr) => ({
    name: tr.cells[iName]?.textContent.trim() || '',
    role: tr.cells[iRole]?.textContent.trim() || '',
    photo: iPhoto >= 0 ? tr.cells[iPhoto]?.querySelector('img')?.getAttribute('src') : null,
  })).filter((p) => p.name);
  const teams = [...tmp.querySelectorAll('h3')].map((h3) => {
    let p = h3.nextElementSibling;
    while (p && p.nodeName !== 'P' && p.nodeName !== 'H3') p = p.nextElementSibling;
    return p?.nodeName === 'P' && p.textContent.includes('·')
      ? { title: h3.textContent, names: p.textContent.split('·').map((s) => s.trim()).filter(Boolean) } : null;
  }).filter(Boolean);
  const introP = tmp.querySelector('h2 + p');

  main.append(
    pageHero('leadership', page.title),
    h('div', { class: 'wrap page-body' },
      introP ? h('div', { class: 'prose lead reveal' }, introP) : null,
      sectionHead('Staff', 'Our team'),
      h('div', { class: 'people' }, staff.map(({ name, role, photo }, i) =>
        h('article', { class: `person reveal${photo ? ' has-photo' : ''}`, style: `--d:${(i % 4) * 70}ms` },
          photo
            ? h('div', { class: 'person-photo' }, h('img', { src: photo, alt: name, loading: 'lazy' }))
            : h('span', { class: 'avatar', 'data-hue': String(i % 5) }, initials(name)),
          h('div', { class: 'person-text' }, h('h3', {}, name), h('p', {}, role))))),
      sectionHead('Servant leaders', 'Elders, shepherds & deacons'),
      h('div', { class: 'teams' }, teams.map((t) =>
        h('section', { class: 'team reveal' },
          h('h3', {}, t.title),
          h('ul', { class: 'name-chips' }, t.names.map((n) => h('li', {}, n))))))));
}

// ── Events ──

async function renderEvents(main, { settings: s }) {
  const events = await upcomingEvents(200);
  const byMonth = new Map();
  for (const ev of events) {
    const key = fmtDate(ev.starts_at, { month: 'long', year: 'numeric' });
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key).push(ev);
  }
  main.append(
    pageHero('events', 'Events'),
    h('div', { class: 'wrap page-body' },
      events.length ? [...byMonth].map(([month, list]) =>
        h('section', { class: 'month' }, h('h2', { class: 'month-head' }, month), h('div', { class: 'event-list' }, list.map(eventCard))))
        : h('div', { class: 'empty big reveal' },
          icon('calendar'),
          h('h2', {}, 'Nothing posted just yet'),
          h('p', {}, 'New events are on their way. In the meantime, join us any Sunday at 9:30 AM or follow along online.'),
          h('div', { class: 'actions' }, btn('#/sundays', 'Plan your Sunday'), btn(s.instagram_url, 'Follow on Instagram', 'btn btn-outline', 'instagram')))));
}

// ── Prayer ──

async function renderPrayer(main, { settings }) {
  const page = await getPage('prayer');
  const form = h('form', { class: 'form-card form', onsubmit: submit },
    h('h2', {}, 'Share a prayer request'),
    h('div', { class: 'row' },
      h('label', {}, 'Your name', h('span', { class: 'opt' }, 'optional'), h('input', { name: 'name', autocomplete: 'name' })),
      h('label', {}, 'Phone or email', h('span', { class: 'opt' }, 'optional'), h('input', { name: 'contact', autocomplete: 'email' }))),
    h('label', {}, 'How can we pray for you?', h('textarea', { name: 'need', rows: 6, required: true })),
    h('label', { class: 'check' }, h('input', { type: 'checkbox', name: 'ok_to_share' }),
      h('span', {}, 'It’s okay to share this request with the church prayer team')),
    h('button', { class: 'btn btn-lg btn-block', type: 'submit' }, 'Send prayer request'));

  async function submit(e) {
    e.preventDefault();
    const f = new FormData(form);
    const button = form.querySelector('button[type=submit]');
    button.disabled = true;
    const { error } = await sb.from('nn_prayer').insert({
      name: f.get('name') || null,
      contact: f.get('contact') || null,
      need: f.get('need'),
      ok_to_share: f.get('ok_to_share') === 'on',
      source: 'web',
    });
    button.disabled = false;
    if (error) return fail(error);
    form.replaceWith(h('div', { class: 'form-card thanks' }, icon('heart', 'cta-icon'), h('h2', {}, 'Thank you'),
      h('p', {}, 'We received your request and will be praying with you.')));
    toast('Prayer request sent');
  }

  main.append(
    pageHero('prayer', page?.title || 'Prayer'),
    h('div', { class: 'wrap page-body' },
      h('div', { class: 'two-col' },
        h('div', { class: 'reveal' },
          h('div', { class: 'prose lead', html: md(page?.body || '') }),
          h('ul', { class: 'checks' },
            h('li', {}, icon('check'), 'Read only by our staff and prayer team'),
            h('li', {}, icon('check'), 'Share your name, or stay anonymous'),
            h('li', {}, icon('check'), 'Leave contact info if you’d like someone to reach out')),
          settings.church_center_prayer_url
            ? h('p', { class: 'muted' }, 'You can also fill out a prayer card on ',
              h('a', { href: settings.church_center_prayer_url, ...ext }, 'Church Center'), '.')
            : null),
        h('div', { class: 'reveal' }, form))));
}

// ── Give ──

function renderGive(main, { settings: s }) {
  const highlight = h('div', { class: 'give-panel reveal' },
    h('div', {},
      h('p', { class: 'eyebrow eyebrow-light' }, 'Text to give'),
      h('p', { class: 'give-number' }, s.text_to_give_number || ''),
      h('p', {}, 'Text any amount — like “$25” — and you’ll get a confirmation before anything is processed.')),
    h('div', { class: 'give-actions' },
      s.giving_url ? btn(s.giving_url, 'Give online', 'btn btn-light btn-lg')
        : h('p', { class: 'muted-light' }, 'Online giving link coming soon.'),
      s.text_to_give_number ? h('a', { class: 'btn btn-glass btn-lg', href: `sms:${s.text_to_give_number}` }, icon('message'), 'Open messages') : null));
  return renderPage(main, 'give', { after: highlight });
}

// ── Contact ──

async function renderContact(main, { settings: s }) {
  const page = await getPage('contact');
  const tile = (ic, label, value, href, extAttrs = {}) => h(href ? 'a' : 'div', { class: 'contact-tile', href, ...extAttrs },
    icon(ic, 'visit-icon'), h('div', {}, h('span', { class: 'visit-label' }, label), h('strong', {}, value)));
  main.append(
    pageHero('contact', page?.title || 'Contact'),
    h('div', { class: 'wrap page-body' },
      h('div', { class: 'contact-grid' },
        h('div', { class: 'contact-tiles reveal' },
          h('p', { class: 'lead-text' }, 'We’d love to hear from you! Reach out, stop by the office Monday–Thursday, or join us on a Sunday.'),
          s.address ? tile('pin', 'Visit', s.address, mapsUrl(s.address), ext) : null,
          s.phone ? tile('phone', 'Call', s.phone, telUrl(s.phone)) : null,
          s.contact_email ? tile('mail', 'Email', s.contact_email, `mailto:${s.contact_email}`) : null,
          tile('clock', 'Office hours', 'Monday–Thursday'),
          h('div', { class: 'actions' },
            btn(s.church_center_url, 'Church Center', 'btn'),
            btn(s.instagram_url, 'Instagram', 'btn btn-outline', 'instagram'),
            btn(s.youtube_url, 'YouTube', 'btn btn-outline', 'youtube'),
            btn(s.facebook_url, 'Facebook', 'btn btn-outline', 'facebook'))),
        s.address ? h('div', { class: 'map reveal' },
          h('iframe', { title: 'Map to Neighbors & Nations', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade',
            src: `https://maps.google.com/maps?q=${encodeURIComponent(s.address)}&z=15&output=embed` })) : null)));
}

export async function renderPublic(main, parts, state) {
  const slug = parts[0] || 'home';
  if (slug === 'home') return renderHome(main, state);
  if (slug === 'events') return renderEvents(main, state);
  if (slug === 'prayer') return renderPrayer(main, state);
  if (slug === 'give') return renderGive(main, state);
  if (slug === 'contact') return renderContact(main, state);
  if (slug === 'house-churches') return renderHouseChurches(main);
  if (slug === 'leadership') return renderLeadership(main);
  return renderPage(main, slug);
}
