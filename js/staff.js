import { sb, h, esc, md, toast, fail, modal, fmtDate, fmtStamp, isoDate, nextSunday, weekOfMonth, loadSettings } from './lib.js';

// ── Auth helpers ──

async function signIn(email, password) {
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

async function signOut() {
  await sb.auth.signOut();
  location.hash = '#/';
}

function loginView(main) {
  const form = h('form', { class: 'card form', onsubmit },
    h('label', {}, 'Email', h('input', { name: 'email', type: 'email', required: true, autocomplete: 'email' })),
    h('label', {}, 'Password', h('input', { name: 'password', type: 'password', required: true, autocomplete: 'current-password' })),
    h('button', { class: 'btn', type: 'submit' }, 'Sign in'));

  async function onsubmit(e) {
    e.preventDefault();
    const f = new FormData(form);
    try {
      await signIn(f.get('email'), f.get('password'));
    } catch (err) {
      fail(err);
    }
  }

  main.append(h('div', { class: 'wrap staff-login' },
    h('h1', {}, 'Staff Portal'),
    h('p', {}, 'Sign in with your staff account to continue.'),
    form));
}

// ── Dashboard ──

const SECTIONS = [
  { slug: 'links',     icon: '🔗', label: 'Links Hub' },
  { slug: 'runsheets', icon: '📋', label: 'Run Sheets' },
  { slug: 'rotations', icon: '🔄', label: 'Rotations' },
  { slug: 'teaching',  icon: '📖', label: 'Teaching' },
  { slug: 'prayer',    icon: '🙏', label: 'Prayer' },
  { slug: 'people',    icon: '👤', label: 'New People' },
  { slug: 'care',      icon: '❤️', label: 'Care List' },
  { slug: 'meetings',  icon: '📝', label: 'Meeting Notes' },
  { slug: 'events',    icon: '📅', label: 'Events' },
  { slug: 'pages',     icon: '📄', label: 'Pages' },
  { slug: 'settings',  icon: '⚙️', label: 'Settings' },
];

function dashboard(main, state) {
  main.append(h('div', { class: 'wrap staff-dash' },
    h('h1', {}, `Welcome, ${state.staff?.name || 'staff'}`),
    h('div', { class: 'dash-grid' },
      SECTIONS.map((s) =>
        h('a', { class: 'dash-card', href: `#/staff/${s.slug}` },
          h('span', { class: 'dash-icon' }, s.icon),
          h('span', {}, s.label)))),
    h('div', { style: 'margin-top:32px' },
      h('button', { class: 'btn btn-ghost', onclick: signOut, style: 'color:var(--brand);border-color:var(--brand)' }, 'Sign out'))));
}

// ── Links hub ──

async function linksHub(main) {
  const { data, error } = await sb.from('nn_records')
    .select('*').eq('collection', 'links').order('sort');
  if (error) return fail(error);

  const search = h('input', { placeholder: 'Search links…', oninput: filter });
  const list = h('div', { class: 'event-list' });

  function render(items) {
    list.replaceChildren(...items.map((r) =>
      h('a', { class: 'event-card', href: r.data.url || '#', target: '_blank', rel: 'noopener', style: 'text-decoration:none' },
        h('div', {},
          h('h3', {}, r.data.title || '(untitled)'),
          h('div', { class: 'muted small' }, r.data.category || ''),
          r.data.description ? h('div', { class: 'muted small', style: 'margin-top:4px' }, r.data.description) : null))));
    if (!items.length) list.replaceChildren(h('p', { class: 'muted' }, 'No links found.'));
  }

  function filter() {
    const q = search.value.toLowerCase();
    const filtered = q ? data.filter((r) =>
      JSON.stringify(r.data).toLowerCase().includes(q)) : data;
    render(filtered);
  }

  render(data);
  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, 'Links Hub'),
    h('div', { class: 'staff-toolbar' }, search),
    list));
}

// ── Generic collection table ──

async function collectionTable(main, collection, title, columns) {
  const { data, error } = await sb.from('nn_records')
    .select('*').eq('collection', collection).order('sort');
  if (error) return fail(error);

  const rows = (data || []).map((r) =>
    h('tr', {}, ...columns.map((c) =>
      h('td', {}, c.render ? c.render(r.data[c.key], r) : esc(r.data[c.key] ?? '')))));

  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, title),
    h('div', { class: 'data-table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {}, ...columns.map((c) => h('th', {}, c.label)))),
        h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: columns.length, class: 'muted' }, 'No records yet.')))))));
}

// ── Prayer requests (staff view) ──

async function prayerList(main) {
  const { data, error } = await sb.from('nn_prayer')
    .select('*').order('created_at', { ascending: false }).limit(100);
  if (error) return fail(error);

  const rows = (data || []).map((r) => h('tr', {},
    h('td', {}, fmtDate(r.request_date || r.created_at)),
    h('td', {}, esc(r.name || '—')),
    h('td', {}, esc(r.need)),
    h('td', {}, h('span', {
      class: 'muted small',
      style: r.status === 'open' ? 'color:var(--accent);font-weight:600' : '',
    }, r.status)),
    h('td', { class: 'muted small' }, r.ok_to_share ? 'Yes' : 'No')));

  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, 'Prayer Requests'),
    h('div', { class: 'data-table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Date'), h('th', {}, 'Name'), h('th', {}, 'Request'),
          h('th', {}, 'Status'), h('th', {}, 'Shareable'))),
        h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'No prayer requests.')))))));
}

// ── Events (staff view) ──

async function eventsList(main) {
  const { data, error } = await sb.from('nn_events')
    .select('*').order('starts_at', { ascending: false }).limit(100);
  if (error) return fail(error);

  const rows = (data || []).map((r) => h('tr', {},
    h('td', {}, fmtDate(r.starts_at)),
    h('td', {}, esc(r.title)),
    h('td', {}, esc(r.location || '')),
    h('td', {}, r.is_public ? 'Public' : 'Staff'),
    h('td', { class: 'muted small' }, esc(r.category || ''))));

  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, 'Events'),
    h('div', { class: 'data-table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Date'), h('th', {}, 'Title'), h('th', {}, 'Location'),
          h('th', {}, 'Visibility'), h('th', {}, 'Category'))),
        h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'No events.')))))));
}

// ── Pages (staff view) ──

async function pagesList(main) {
  const { data, error } = await sb.from('nn_pages')
    .select('*').order('sort');
  if (error) return fail(error);

  const rows = (data || []).map((r) => h('tr', {},
    h('td', {}, h('a', { href: `#/${r.slug}` }, esc(r.title))),
    h('td', {}, esc(r.slug)),
    h('td', {}, r.is_public ? 'Public' : 'Staff'),
    h('td', {}, r.show_in_nav ? 'Yes' : '—'),
    h('td', { class: 'muted small' }, fmtStamp(r))));

  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, 'Pages'),
    h('div', { class: 'data-table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {},
          h('th', {}, 'Title'), h('th', {}, 'Slug'), h('th', {}, 'Visibility'),
          h('th', {}, 'Nav'), h('th', {}, 'Updated'))),
        h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: 5, class: 'muted' }, 'No pages.')))))));
}

// ── Settings (staff view) ──

async function settingsView(main) {
  const settings = await loadSettings();
  const keys = Object.keys(settings).sort();
  const rows = keys.map((k) => h('tr', {},
    h('td', { style: 'font-weight:500' }, esc(k)),
    h('td', {}, esc(settings[k] || ''))));

  main.append(h('div', { class: 'wrap staff-section' },
    h('h2', {}, 'Site Settings'),
    h('div', { class: 'data-table-wrap' },
      h('table', { class: 'data-table' },
        h('thead', {}, h('tr', {}, h('th', {}, 'Key'), h('th', {}, 'Value'))),
        h('tbody', {}, rows.length ? rows : h('tr', {}, h('td', { colspan: 2, class: 'muted' }, 'No settings configured yet.')))))));
}

// ── Router ──

export async function renderStaff(main, parts, state) {
  if (!state.session) return loginView(main);
  if (!state.staff) {
    main.append(h('div', { class: 'wrap staff-login' },
      h('h1', {}, 'Access denied'),
      h('p', {}, 'Your account is not on the staff list. Ask an admin to add you.'),
      h('button', { class: 'btn btn-ghost', onclick: signOut, style: 'margin-top:16px;color:var(--brand);border-color:var(--brand)' }, 'Sign out')));
    return;
  }

  const section = parts[0] || '';
  switch (section) {
    case '': return dashboard(main, state);
    case 'links': return linksHub(main);
    case 'runsheets': return collectionTable(main, 'run_sheets', 'Sunday Run Sheets', [
      { key: 'date', label: 'Date', render: (v) => fmtDate(v) },
      { key: 'service', label: 'Service' },
      { key: 'worship_leader', label: 'Worship' },
      { key: 'speaker', label: 'Speaker' },
      { key: 'notes', label: 'Notes' },
    ]);
    case 'rotations': return collectionTable(main, 'sunday_rotation', 'Sunday Rotations', [
      { key: 'role', label: 'Role' },
      { key: 'week_1', label: 'Week 1' },
      { key: 'week_2', label: 'Week 2' },
      { key: 'week_3', label: 'Week 3' },
      { key: 'week_4', label: 'Week 4' },
      { key: 'week_5', label: 'Week 5' },
    ]);
    case 'teaching': return collectionTable(main, 'teaching', 'Teaching Schedule', [
      { key: 'date', label: 'Date', render: (v) => fmtDate(v) },
      { key: 'speaker', label: 'Speaker' },
      { key: 'series', label: 'Series' },
      { key: 'title', label: 'Title' },
      { key: 'notes', label: 'Notes' },
    ]);
    case 'prayer': return prayerList(main);
    case 'people': return collectionTable(main, 'new_people', 'New People', [
      { key: 'date', label: 'Date', render: (v) => fmtDate(v) },
      { key: 'name', label: 'Name' },
      { key: 'contact', label: 'Contact' },
      { key: 'notes', label: 'Notes' },
      { key: 'status', label: 'Status' },
    ]);
    case 'care': return collectionTable(main, 'care', 'Care List', [
      { key: 'name', label: 'Name' },
      { key: 'need', label: 'Need' },
      { key: 'assigned_to', label: 'Assigned To' },
      { key: 'status', label: 'Status' },
      { key: 'notes', label: 'Notes' },
    ]);
    case 'meetings': return collectionTable(main, 'meetings', 'Staff Meeting Notes', [
      { key: 'date', label: 'Date', render: (v) => fmtDate(v) },
      { key: 'facilitator', label: 'Facilitator' },
      { key: 'attendees', label: 'Attendees' },
      { key: 'notes', label: 'Notes' },
    ]);
    case 'events': return eventsList(main);
    case 'pages': return pagesList(main);
    case 'settings': return settingsView(main);
    case 'account':
      main.append(h('div', { class: 'wrap staff-login' },
        h('h1', {}, 'Set your password'),
        h('p', {}, 'If you followed a password-recovery link, set a new password below.'),
        h('form', { class: 'card form', onsubmit: async (e) => {
          e.preventDefault();
          const pw = e.target.elements.password.value;
          const { error } = await sb.auth.updateUser({ password: pw });
          if (error) return fail(error);
          toast('Password updated');
          location.hash = '#/staff';
        }},
          h('label', {}, 'New password', h('input', { name: 'password', type: 'password', required: true, minLength: 8 })),
          h('button', { class: 'btn', type: 'submit' }, 'Update password'))));
      return;
    default:
      main.append(h('div', { class: 'wrap' },
        h('h1', {}, 'Not found'),
        h('p', {}, h('a', { href: '#/staff' }, 'Back to dashboard'))));
  }
}
