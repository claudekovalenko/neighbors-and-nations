-- Neighbors & Nations Christian Church website schema (Supabase / Postgres).
-- Every table is prefixed nn_ so it can share a Supabase project with other apps.
-- Access model:
--   * Public visitors (anon): read published pages, public events, public records,
--     site settings; submit prayer requests.
--   * Staff (signed in AND listed in nn_staff): read/write everything.
--   * Admins (nn_staff.role = 'admin'): additionally manage the staff list.

create table if not exists public.nn_staff (
  email      text primary key check (email = lower(email)),
  name       text,
  role       text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

create or replace function public.nn_is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.nn_staff
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

create or replace function public.nn_is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.nn_staff
    where email = lower(coalesce(auth.jwt() ->> 'email', '')) and role = 'admin'
  );
$$;

create or replace function public.nn_touch() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  new.updated_by := coalesce(auth.jwt() ->> 'email', new.updated_by);
  return new;
end;
$$;

-- Key/value site settings (address, service times, Church Center links, ...).
create table if not exists public.nn_settings (
  key        text primary key,
  value      text,
  updated_at timestamptz not null default now(),
  updated_by text
);

-- Editable pages (markdown). is_public = false pages are staff-only docs.
create table if not exists public.nn_pages (
  slug        text primary key,
  title       text not null,
  body        text not null default '',
  is_public   boolean not null default true,
  show_in_nav boolean not null default false,
  sort        int not null default 0,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create table if not exists public.nn_events (
  id          bigint generated always as identity primary key,
  title       text not null,
  starts_at   timestamptz not null,
  ends_at     timestamptz,
  all_day     boolean not null default false,
  location    text,
  description text,
  category    text,
  is_public   boolean not null default true,
  updated_at  timestamptz not null default now(),
  updated_by  text
);

create table if not exists public.nn_prayer (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  request_date      date not null default current_date,
  name              text,
  contact           text,
  need              text not null,
  followups         text,
  notes             text,
  status            text not null default 'open' check (status in ('open', 'answered', 'archived')),
  source            text not null default 'staff' check (source in ('staff', 'web')),
  ok_to_share       boolean not null default false,
  updated_at        timestamptz not null default now(),
  updated_by        text
);

-- Generic, flexible records. `collection` names a list (links, contacts,
-- new_people, care, sunday_rotation, staff_roles, teaching, meetings,
-- run_sheets, missions...). Column layout per collection lives in js/staff.js.
create table if not exists public.nn_records (
  id         bigint generated always as identity primary key,
  collection text not null,
  data       jsonb not null default '{}'::jsonb,
  sort       int not null default 0,
  is_public  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by text
);
create index if not exists nn_records_collection_idx on public.nn_records (collection, sort);
create index if not exists nn_events_starts_idx on public.nn_events (starts_at);

do $$
declare t text;
begin
  foreach t in array array['nn_settings', 'nn_pages', 'nn_events', 'nn_prayer', 'nn_records'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before insert or update on public.%I
                    for each row execute function public.nn_touch()', t, t);
  end loop;
end $$;

alter table public.nn_staff    enable row level security;
alter table public.nn_settings enable row level security;
alter table public.nn_pages    enable row level security;
alter table public.nn_events   enable row level security;
alter table public.nn_prayer   enable row level security;
alter table public.nn_records  enable row level security;

-- nn_staff
drop policy if exists nn_staff_read on public.nn_staff;
create policy nn_staff_read on public.nn_staff for select to authenticated
  using (public.nn_is_staff());
drop policy if exists nn_staff_admin on public.nn_staff;
create policy nn_staff_admin on public.nn_staff for all to authenticated
  using (public.nn_is_admin()) with check (public.nn_is_admin());

-- nn_settings
drop policy if exists nn_settings_read on public.nn_settings;
create policy nn_settings_read on public.nn_settings for select to anon, authenticated using (true);
drop policy if exists nn_settings_write on public.nn_settings;
create policy nn_settings_write on public.nn_settings for all to authenticated
  using (public.nn_is_staff()) with check (public.nn_is_staff());

-- nn_pages
drop policy if exists nn_pages_read on public.nn_pages;
create policy nn_pages_read on public.nn_pages for select to anon, authenticated
  using (is_public or public.nn_is_staff());
drop policy if exists nn_pages_write on public.nn_pages;
create policy nn_pages_write on public.nn_pages for all to authenticated
  using (public.nn_is_staff()) with check (public.nn_is_staff());

-- nn_events
drop policy if exists nn_events_read on public.nn_events;
create policy nn_events_read on public.nn_events for select to anon, authenticated
  using (is_public or public.nn_is_staff());
drop policy if exists nn_events_write on public.nn_events;
create policy nn_events_write on public.nn_events for all to authenticated
  using (public.nn_is_staff()) with check (public.nn_is_staff());

-- nn_prayer: anyone may submit a request; only staff can read or manage.
drop policy if exists nn_prayer_submit on public.nn_prayer;
create policy nn_prayer_submit on public.nn_prayer for insert to anon, authenticated
  with check (source = 'web' and status = 'open' and followups is null and notes is null);
drop policy if exists nn_prayer_staff on public.nn_prayer;
create policy nn_prayer_staff on public.nn_prayer for all to authenticated
  using (public.nn_is_staff()) with check (public.nn_is_staff());

-- nn_records
drop policy if exists nn_records_read on public.nn_records;
create policy nn_records_read on public.nn_records for select to anon, authenticated
  using (is_public or public.nn_is_staff());
drop policy if exists nn_records_write on public.nn_records;
create policy nn_records_write on public.nn_records for all to authenticated
  using (public.nn_is_staff()) with check (public.nn_is_staff());
