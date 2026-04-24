-- ============================================================
-- PORTAL — Admin Tables
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================================

-- ----------------------------------------------------------
-- Reported Posts (para denúncias de conteúdo)
-- ----------------------------------------------------------
create table if not exists reported_posts (
  id            uuid        primary key default gen_random_uuid(),
  post_id       uuid        not null references posts(id) on delete cascade,
  reporter_id   uuid        not null references profiles(id) on delete cascade,
  reason        text        not null check (reason in ('spam', 'explicit', 'harassment', 'other')),
  description  text,
  status        text        not null default 'pending' check (status in ('pending', 'reviewed', 'dismissed', 'deleted')),
  reviewed_by   uuid        references profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists idx_reported_posts_status on reported_posts(status);
create index if not exists idx_reported_posts_post_id on reported_posts(post_id);

-- ----------------------------------------------------------
-- Announcements (anúnciosFixed do administrador)
-- ----------------------------------------------------------
create table if not exists announcements (
  id          uuid        primary key default gen_random_uuid(),
  title       text        not null,
  content     text,
  status      text        not null default 'draft' check (status in ('draft', 'published', 'archived')),
  pinned      boolean     not null default false,
  author_id   uuid        references profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists idx_announcements_status on announcements(status);
create index if not exists idx_announcements_created on announcements(created_at desc);

-- ----------------------------------------------------------
-- Banned Users (para banimentos)
-- ----------------------------------------------------------
create table if not exists banned_users (
  id           uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references profiles(id) on delete cascade,
  reason      text,
  banned_by   uuid        not null references profiles(id),
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists idx_banned_users_user_id on banned_users(user_id);

-- RLS
alter table reported_posts enable row level security;
alter table announcements enable row level security;
alter table banned_users enable row level security;

-- Reported Posts policies (only mods/superusers can read)
drop policy if exists "reported_posts_select" on reported_posts;
create policy "reported_posts_select" on reported_posts
  for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('mod', 'superuser')
    )
  );

-- Announcements policies (public read, auth write)
drop policy if exists "announcements_select" on announcements;
drop policy if exists "announcements_insert" on announcements;

create policy "announcements_select" on announcements
  for select to authenticated using (status = 'published');

create policy "announcements_insert" on announcements
  for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('mod', 'superuser')
    )
  );

create policy "announcements_update" on announcements
  for update to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('mod', 'superuser')
    )
  );

-- Banned Users policies (admin only)
drop policy if exists "banned_users_select" on banned_users;
create policy "banned_users_select" on banned_users
  for select to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('superuser')
    )
  );

create policy "banned_users_insert" on banned_users
  for insert to authenticated
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'superuser'
    )
  );

drop policy if exists "banned_users_delete" on banned_users;
create policy "banned_users_delete" on banned_users
  for delete to authenticated
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'superuser'
    )
  );