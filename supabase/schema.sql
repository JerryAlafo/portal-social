-- ============================================================
-- PORTAL — Supabase Schema (complete)
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE throughout
-- ============================================================

-- ============================================================
-- 1. EXTENSIONS
-- ============================================================

create extension if not exists "uuid-ossp";   -- uuid_generate_v4()
create extension if not exists "pg_trgm";     -- trigram indexes for fast text search

-- ============================================================
-- 2. TABLES
-- ============================================================

-- ----------------------------------------------------------
-- 2.1 Profiles (one row per auth.users entry)
-- ----------------------------------------------------------
create table if not exists profiles (
  id                   uuid        primary key references auth.users(id) on delete cascade,
  username             text        unique not null,
  display_name         text        not null,
  avatar_initials      text,
  avatar_url           text,
  cover_url            text,                         -- banner image on profile page
  bio                  text,
  location             text,
  website              text,
  role                 text        not null default 'member'
                                   check (role in ('member','mod','superuser')),
  level                int         not null default 1,
  is_online            boolean     not null default false,
  posts_count          int         not null default 0,
  followers_count      int         not null default 0,
  following_count      int         not null default 0,
  likes_received_count int         not null default 0,
  created_at           timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.2 Posts
-- ----------------------------------------------------------
create table if not exists posts (
  id             uuid        primary key default gen_random_uuid(),
  author_id      uuid        not null references profiles(id) on delete cascade,
  content        text        not null,
  category       text,
  image_url      text,
  is_spoiler     boolean     not null default false,
  is_sensitive   boolean     not null default false,
  likes_count    int         not null default 0,
  comments_count int         not null default 0,
  shares_count   int         not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.3 Post Likes  (many-to-many)
-- ----------------------------------------------------------
create table if not exists post_likes (
  post_id    uuid        not null references posts(id) on delete cascade,
  user_id    uuid        not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ----------------------------------------------------------
-- 2.4 Comments
-- ----------------------------------------------------------
create table if not exists comments (
  id         uuid        primary key default gen_random_uuid(),
  post_id    uuid        not null references posts(id) on delete cascade,
  author_id  uuid        not null references profiles(id) on delete cascade,
  parent_id  uuid        references comments(id) on delete cascade,
  content    text        not null,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.5 Follows
-- ----------------------------------------------------------
create table if not exists follows (
  follower_id  uuid        not null references profiles(id) on delete cascade,
  following_id uuid        not null references profiles(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ----------------------------------------------------------
-- 2.6 Conversations + Participants + Messages
-- ----------------------------------------------------------
create table if not exists conversations (
  id         uuid        primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists conversation_participants (
  conversation_id uuid        not null references conversations(id) on delete cascade,
  user_id         uuid        not null references profiles(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists messages (
  id              uuid        primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       uuid        not null references profiles(id) on delete cascade,
  content         text        not null,
  is_read         boolean     not null default false,
  created_at      timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.7 Notifications
-- ----------------------------------------------------------
create table if not exists notifications (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references profiles(id) on delete cascade,
  actor_id   uuid        references profiles(id) on delete set null,
  type       text        not null check (type in ('like','comment','follow','share','mention')),
  post_id    uuid        references posts(id) on delete cascade,
  is_read    boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.8 Events + Interests
-- ----------------------------------------------------------
create table if not exists events (
  id               uuid        primary key default gen_random_uuid(),
  title            text        not null,
  description      text,
  date             timestamptz not null,
  location         text,
  image_url        text,
  organizer_id     uuid        references profiles(id) on delete set null,
  interested_count int         not null default 0,
  going_count      int         not null default 0,
  date_color       text,
  created_at       timestamptz not null default now()
);

-- Tracks who clicked "interested" on an event
create table if not exists event_interests (
  event_id   uuid        not null references events(id) on delete cascade,
  user_id    uuid        not null references profiles(id) on delete cascade,
  type       text        not null default 'interested' check (type in ('interested','going')),
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);

-- ----------------------------------------------------------
-- 2.9 News
-- ----------------------------------------------------------
create table if not exists news (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  summary      text,
  image_url    text,
  category     text,
  source       text,
  source_url   text,
  published_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.10 Fan Fiction
-- ----------------------------------------------------------
create table if not exists fanfics (
  id           uuid        primary key default gen_random_uuid(),
  title        text        not null,
  synopsis     text,
  author_id    uuid        not null references profiles(id) on delete cascade,
  fandom       text,
  genre        text,
  language     text        not null default 'pt',
  cover_url    text,
  status       text        not null default 'ongoing' check (status in ('ongoing','complete','hiatus')),
  chapters     int         not null default 1,
  words        int         not null default 0,
  reads_count  int         not null default 0,
  likes_count  int         not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.11 Gallery
-- ----------------------------------------------------------
create table if not exists gallery_items (
  id          uuid        primary key default gen_random_uuid(),
  author_id   uuid        not null references profiles(id) on delete cascade,
  title       text,
  image_url   text        not null,
  category    text,
  likes_count int         not null default 0,
  created_at  timestamptz not null default now()
);

-- Gallery Likes (many-to-many)
create table if not exists gallery_likes (
  item_id    uuid        not null references gallery_items(id) on delete cascade,
  user_id    uuid        not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

-- ----------------------------------------------------------
-- 2.12 Trending Tags
-- ----------------------------------------------------------
create table if not exists trending_tags (
  id         uuid        primary key default gen_random_uuid(),
  tag        text        unique not null,
  post_count int         not null default 0,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------
-- 2.13 Post Tags  (many-to-many, links posts to trending_tags)
-- ----------------------------------------------------------
create table if not exists post_tags (
  post_id    uuid not null references posts(id) on delete cascade,
  tag        text not null,
  created_at timestamptz not null default now(),
  primary key (post_id, tag)
);

-- ============================================================
-- 3. INDEXES
-- ============================================================

-- Posts
create index if not exists idx_posts_author_id   on posts(author_id);
create index if not exists idx_posts_created_at  on posts(created_at desc);
create index if not exists idx_posts_category    on posts(category) where category is not null;
create index if not exists idx_posts_content_trgm on posts using gin(content gin_trgm_ops);

-- Post likes
create index if not exists idx_post_likes_user_id on post_likes(user_id);
create index if not exists idx_post_likes_post_id on post_likes(post_id);

-- Comments
create index if not exists idx_comments_post_id on comments(post_id);
create index if not exists idx_comments_parent_id on comments(parent_id) where parent_id is not null;

-- Follows
create index if not exists idx_follows_follower_id  on follows(follower_id);
create index if not exists idx_follows_following_id on follows(following_id);

-- Conversation participants
create index if not exists idx_conv_parts_user_id on conversation_participants(user_id);
create index if not exists idx_conv_parts_conv_id on conversation_participants(conversation_id);

-- Messages
create index if not exists idx_messages_conv_id     on messages(conversation_id, created_at asc);
create index if not exists idx_messages_sender_id   on messages(sender_id);
create index if not exists idx_messages_unread      on messages(conversation_id, is_read) where is_read = false;

-- Notifications
create index if not exists idx_notif_user_id   on notifications(user_id, created_at desc);
create index if not exists idx_notif_unread    on notifications(user_id, is_read) where is_read = false;

-- Profiles (text search)
create index if not exists idx_profiles_username_trgm     on profiles using gin(username gin_trgm_ops);
create index if not exists idx_profiles_display_name_trgm on profiles using gin(display_name gin_trgm_ops);

-- Post tags
create index if not exists idx_post_tags_tag on post_tags(tag);

-- Fanfics
create index if not exists idx_fanfics_author_id on fanfics(author_id);
create index if not exists idx_fanfics_updated   on fanfics(updated_at desc);

-- Gallery
create index if not exists idx_gallery_author_id on gallery_items(author_id);
create index if not exists idx_gallery_created   on gallery_items(created_at desc);

-- Gallery likes
create index if not exists idx_gallery_likes_user_id on gallery_likes(user_id);
create index if not exists idx_gallery_likes_item_id on gallery_likes(item_id);

-- ============================================================
-- 4. FUNCTIONS
-- ============================================================

-- ----------------------------------------------------------
-- 4.1 Like helpers (called via rpc from API routes)
-- ----------------------------------------------------------
create or replace function increment_likes(post_id uuid)
returns void language sql security definer as $$
  update posts set likes_count = likes_count + 1 where id = post_id;
$$;

create or replace function decrement_likes(post_id uuid)
returns void language sql security definer as $$
  update posts set likes_count = greatest(likes_count - 1, 0) where id = post_id;
$$;

create or replace function increment_shares(post_id uuid)
returns void language sql security definer as $$
  update posts set shares_count = shares_count + 1 where id = post_id;
$$;

-- ----------------------------------------------------------
-- 4.2 Get or create a 1-to-1 conversation between two users
-- Returns the conversation id. Creates one if it doesn't exist.
-- ----------------------------------------------------------
create or replace function get_or_create_conversation(user_a uuid, user_b uuid)
returns uuid language plpgsql security definer as $$
declare
  conv_id uuid;
begin
  -- Find existing conversation where both users are participants
  select cp1.conversation_id into conv_id
  from conversation_participants cp1
  join conversation_participants cp2
    on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = user_a
    and cp2.user_id = user_b
  limit 1;

  if conv_id is null then
    insert into conversations default values returning id into conv_id;
    insert into conversation_participants(conversation_id, user_id) values (conv_id, user_a);
    insert into conversation_participants(conversation_id, user_id) values (conv_id, user_b);
  end if;

  return conv_id;
end;
$$;

-- ----------------------------------------------------------
-- 4.3 Auto-update updated_at
-- ----------------------------------------------------------
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- ----------------------------------------------------------
-- 4.4 Update follower / following counts
-- ----------------------------------------------------------
create or replace function update_follow_counts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set following_count = following_count + 1 where id = NEW.follower_id;
    update profiles set followers_count = followers_count + 1 where id = NEW.following_id;
  elsif TG_OP = 'DELETE' then
    update profiles set following_count = greatest(following_count - 1, 0) where id = OLD.follower_id;
    update profiles set followers_count = greatest(followers_count - 1, 0) where id = OLD.following_id;
  end if;
  return null;
end;
$$;

-- ----------------------------------------------------------
-- 4.5 Update comment counts on posts
-- ----------------------------------------------------------
create or replace function update_comments_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update posts set comments_count = comments_count + 1 where id = NEW.post_id;
  elsif TG_OP = 'DELETE' then
    update posts set comments_count = greatest(comments_count - 1, 0) where id = OLD.post_id;
  end if;
  return null;
end;
$$;

-- ----------------------------------------------------------
-- 4.6 Update posts_count on author profile
-- ----------------------------------------------------------
create or replace function update_profile_posts_count()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    update profiles set posts_count = posts_count + 1 where id = NEW.author_id;
  elsif TG_OP = 'DELETE' then
    update profiles set posts_count = greatest(posts_count - 1, 0) where id = OLD.author_id;
  end if;
  return null;
end;
$$;

-- ----------------------------------------------------------
-- 4.7 Update likes_received_count on post author's profile
-- ----------------------------------------------------------
create or replace function update_profile_likes_received()
returns trigger language plpgsql as $$
declare
  v_author_id uuid;
begin
  if TG_OP = 'INSERT' then
    select author_id into v_author_id from posts where id = NEW.post_id;
    update profiles set likes_received_count = likes_received_count + 1 where id = v_author_id;
  elsif TG_OP = 'DELETE' then
    select author_id into v_author_id from posts where id = OLD.post_id;
    update profiles set likes_received_count = greatest(likes_received_count - 1, 0) where id = v_author_id;
  end if;
  return null;
end;
$$;

-- ----------------------------------------------------------
-- 4.8 Update event interested / going counts
-- ----------------------------------------------------------
create or replace function update_event_interest_counts()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'INSERT' then
    if NEW.type = 'interested' then
      update events set interested_count = interested_count + 1 where id = NEW.event_id;
    else
      update events set going_count = going_count + 1 where id = NEW.event_id;
    end if;
  elsif TG_OP = 'DELETE' then
    if OLD.type = 'interested' then
      update events set interested_count = greatest(interested_count - 1, 0) where id = OLD.event_id;
    else
      update events set going_count = greatest(going_count - 1, 0) where id = OLD.event_id;
    end if;
  end if;
  return null;
end;
$$;

-- ============================================================
-- 5. TRIGGERS
-- ============================================================

-- updated_at on posts
drop trigger if exists trg_posts_updated_at on posts;
create trigger trg_posts_updated_at
  before update on posts
  for each row execute function touch_updated_at();

-- updated_at on fanfics
drop trigger if exists trg_fanfics_updated_at on fanfics;
create trigger trg_fanfics_updated_at
  before update on fanfics
  for each row execute function touch_updated_at();

-- follower / following counts
drop trigger if exists on_follow_change on follows;
create trigger on_follow_change
  after insert or delete on follows
  for each row execute function update_follow_counts();

-- comment counts
drop trigger if exists on_comment_change on comments;
create trigger on_comment_change
  after insert or delete on comments
  for each row execute function update_comments_count();

-- profile posts_count
drop trigger if exists on_post_change on posts;
create trigger on_post_change
  after insert or delete on posts
  for each row execute function update_profile_posts_count();

-- profile likes_received_count
drop trigger if exists on_post_like_change on post_likes;
create trigger on_post_like_change
  after insert or delete on post_likes
  for each row execute function update_profile_likes_received();

-- event interest counts
drop trigger if exists on_event_interest_change on event_interests;
create trigger on_event_interest_change
  after insert or delete on event_interests
  for each row execute function update_event_interest_counts();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================

alter table profiles                 enable row level security;
alter table posts                    enable row level security;
alter table post_likes               enable row level security;
alter table comments                 enable row level security;
alter table follows                  enable row level security;
alter table conversations            enable row level security;
alter table conversation_participants enable row level security;
alter table messages                 enable row level security;
alter table notifications            enable row level security;
alter table events                   enable row level security;
alter table event_interests          enable row level security;
alter table news                     enable row level security;
alter table fanfics                  enable row level security;
alter table gallery_items            enable row level security;
alter table gallery_likes            enable row level security;
alter table trending_tags            enable row level security;
alter table post_tags                enable row level security;

-- NOTE: All API routes use the service_role key (bypasses RLS).
-- These policies protect against direct client-side access.

-- ----------------------------------------------------------
-- Profiles
-- ----------------------------------------------------------
drop policy if exists "profiles_select" on profiles;
drop policy if exists "profiles_insert" on profiles;
drop policy if exists "profiles_update" on profiles;

create policy "profiles_select" on profiles
  for select to authenticated using (true);

-- Insert is done server-side in /api/auth/register (service role),
-- but allow just in case a direct call is needed:
create policy "profiles_insert" on profiles
  for insert to authenticated with check (auth.uid() = id);

create policy "profiles_update" on profiles
  for update to authenticated using (auth.uid() = id);

-- ----------------------------------------------------------
-- Posts
-- ----------------------------------------------------------
drop policy if exists "posts_select" on posts;
drop policy if exists "posts_insert" on posts;
drop policy if exists "posts_update" on posts;
drop policy if exists "posts_delete" on posts;

create policy "posts_select" on posts
  for select to authenticated using (true);

create policy "posts_insert" on posts
  for insert to authenticated with check (auth.uid() = author_id);

create policy "posts_update" on posts
  for update to authenticated using (auth.uid() = author_id);

create policy "posts_delete" on posts
  for delete to authenticated using (auth.uid() = author_id);

-- ----------------------------------------------------------
-- Post Likes
-- ----------------------------------------------------------
drop policy if exists "post_likes_select" on post_likes;
drop policy if exists "post_likes_insert" on post_likes;
drop policy if exists "post_likes_delete" on post_likes;

create policy "post_likes_select" on post_likes
  for select to authenticated using (true);

create policy "post_likes_insert" on post_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "post_likes_delete" on post_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------
-- Comments
-- ----------------------------------------------------------
drop policy if exists "comments_select" on comments;
drop policy if exists "comments_insert" on comments;
drop policy if exists "comments_update" on comments;
drop policy if exists "comments_delete" on comments;

create policy "comments_select" on comments
  for select to authenticated using (true);

create policy "comments_insert" on comments
  for insert to authenticated with check (auth.uid() = author_id);

create policy "comments_update" on comments
  for update to authenticated using (auth.uid() = author_id);

create policy "comments_delete" on comments
  for delete to authenticated using (auth.uid() = author_id);

-- ----------------------------------------------------------
-- Follows
-- ----------------------------------------------------------
drop policy if exists "follows_select" on follows;
drop policy if exists "follows_insert" on follows;
drop policy if exists "follows_delete" on follows;

create policy "follows_select" on follows
  for select to authenticated using (true);

create policy "follows_insert" on follows
  for insert to authenticated with check (auth.uid() = follower_id);

create policy "follows_delete" on follows
  for delete to authenticated using (auth.uid() = follower_id);

-- ----------------------------------------------------------
-- Conversations
-- ----------------------------------------------------------
drop policy if exists "conversations_select" on conversations;
drop policy if exists "conversations_insert" on conversations;

create policy "conversations_select" on conversations
  for select to authenticated
  using (exists (
    select 1 from conversation_participants
    where conversation_id = conversations.id and user_id = auth.uid()
  ));

create policy "conversations_insert" on conversations
  for insert to authenticated with check (true);

-- ----------------------------------------------------------
-- Conversation Participants
-- ----------------------------------------------------------
drop policy if exists "conv_parts_select" on conversation_participants;
drop policy if exists "conv_parts_insert" on conversation_participants;

create policy "conv_parts_select" on conversation_participants
  for select to authenticated
  using (user_id = auth.uid() or exists (
    select 1 from conversation_participants cp2
    where cp2.conversation_id = conversation_participants.conversation_id
      and cp2.user_id = auth.uid()
  ));

create policy "conv_parts_insert" on conversation_participants
  for insert to authenticated with check (true);

-- ----------------------------------------------------------
-- Messages
-- ----------------------------------------------------------
drop policy if exists "messages_select" on messages;
drop policy if exists "messages_insert" on messages;
drop policy if exists "messages_update" on messages;

create policy "messages_select" on messages
  for select to authenticated
  using (exists (
    select 1 from conversation_participants
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  ));

create policy "messages_insert" on messages
  for insert to authenticated
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from conversation_participants
      where conversation_id = messages.conversation_id and user_id = auth.uid()
    )
  );

-- Allow marking messages as read
create policy "messages_update" on messages
  for update to authenticated
  using (exists (
    select 1 from conversation_participants
    where conversation_id = messages.conversation_id and user_id = auth.uid()
  ));

-- ----------------------------------------------------------
-- Notifications
-- ----------------------------------------------------------
drop policy if exists "notif_select" on notifications;
drop policy if exists "notif_insert" on notifications;
drop policy if exists "notif_update" on notifications;

create policy "notif_select" on notifications
  for select to authenticated using (user_id = auth.uid());

-- Notifications are created server-side, but allow authenticated inserts:
create policy "notif_insert" on notifications
  for insert to authenticated with check (true);

create policy "notif_update" on notifications
  for update to authenticated using (user_id = auth.uid());

-- ----------------------------------------------------------
-- Events
-- ----------------------------------------------------------
drop policy if exists "events_select" on events;
drop policy if exists "events_insert" on events;

create policy "events_select" on events
  for select to authenticated using (true);

create policy "events_insert" on events
  for insert to authenticated with check (auth.uid() = organizer_id);

-- ----------------------------------------------------------
-- Event Interests
-- ----------------------------------------------------------
drop policy if exists "event_interests_select" on event_interests;
drop policy if exists "event_interests_insert" on event_interests;
drop policy if exists "event_interests_delete" on event_interests;

create policy "event_interests_select" on event_interests
  for select to authenticated using (true);

create policy "event_interests_insert" on event_interests
  for insert to authenticated with check (auth.uid() = user_id);

create policy "event_interests_delete" on event_interests
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------
-- News (read-only for members; insert via service role)
-- ----------------------------------------------------------
drop policy if exists "news_select" on news;
create policy "news_select" on news
  for select to authenticated using (true);

-- ----------------------------------------------------------
-- Fanfics
-- ----------------------------------------------------------
drop policy if exists "fanfics_select" on fanfics;
drop policy if exists "fanfics_insert" on fanfics;
drop policy if exists "fanfics_update" on fanfics;
drop policy if exists "fanfics_delete" on fanfics;

create policy "fanfics_select" on fanfics
  for select to authenticated using (true);

create policy "fanfics_insert" on fanfics
  for insert to authenticated with check (auth.uid() = author_id);

create policy "fanfics_update" on fanfics
  for update to authenticated using (auth.uid() = author_id);

create policy "fanfics_delete" on fanfics
  for delete to authenticated using (auth.uid() = author_id);

-- ----------------------------------------------------------
-- Gallery
-- ----------------------------------------------------------
drop policy if exists "gallery_select" on gallery_items;
drop policy if exists "gallery_insert" on gallery_items;
drop policy if exists "gallery_delete" on gallery_items;

create policy "gallery_select" on gallery_items
  for select to authenticated using (true);

create policy "gallery_insert" on gallery_items
  for insert to authenticated with check (auth.uid() = author_id);

create policy "gallery_delete" on gallery_items
  for delete to authenticated using (auth.uid() = author_id);

-- Gallery Likes
-- ----------------------------------------------------------
drop policy if exists "gallery_likes_select" on gallery_likes;
drop policy if exists "gallery_likes_insert" on gallery_likes;
drop policy if exists "gallery_likes_delete" on gallery_likes;

create policy "gallery_likes_select" on gallery_likes
  for select to authenticated using (true);

create policy "gallery_likes_insert" on gallery_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "gallery_likes_delete" on gallery_likes
  for delete to authenticated using (auth.uid() = user_id);

-- ----------------------------------------------------------
-- Trending Tags + Post Tags (public read)
-- ----------------------------------------------------------
drop policy if exists "trending_select" on trending_tags;
create policy "trending_select" on trending_tags
  for select to authenticated using (true);

drop policy if exists "post_tags_select" on post_tags;
create policy "post_tags_select" on post_tags
  for select to authenticated using (true);

-- ============================================================
-- 7. STORAGE BUCKETS + POLICIES
-- ============================================================

-- Create public buckets (safe to re-run)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 5242880,  array['image/jpeg','image/png','image/webp']),
  ('covers',  'covers',  true, 8388608,  array['image/jpeg','image/png','image/webp']),
  ('posts',   'posts',   true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']),
  ('gallery', 'gallery', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  public             = excluded.public,
  file_size_limit    = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage RLS (objects table lives in the storage schema)
-- Files are organised as: {bucket}/{user_id}/{timestamp}.{ext}
-- The first folder segment is always the uploader's user id.

-- Anyone authenticated can read public buckets
drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read" on storage.objects
  for select to authenticated
  using (bucket_id in ('avatars','covers','posts','gallery'));

-- Authenticated users can only upload into their own folder
drop policy if exists "storage_user_upload" on storage.objects;
create policy "storage_user_upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('avatars','covers','posts','gallery') and
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can replace/update their own files
drop policy if exists "storage_user_update" on storage.objects;
create policy "storage_user_update" on storage.objects
  for update to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);

-- Users can delete their own files
drop policy if exists "storage_user_delete" on storage.objects;
create policy "storage_user_delete" on storage.objects
  for delete to authenticated
  using ((storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================
-- 8. SEED DATA  (sample content — remove for production)
-- ============================================================

-- Trending tags (upsert — safe to re-run)
insert into trending_tags (tag, post_count) values
  ('DemonSlayer',     4200),
  ('Frieren',         3800),
  ('JujutsuKaisen',   2900),
  ('AnimeSpring2026', 2100),
  ('Cosplay',         1700),
  ('Nendoroid',       1200),
  ('Isekai',           987),
  ('Shonen',           876),
  ('SoloLeveling',     756),
  ('BlueLock',         643),
  ('Manga',            598),
  ('AMV',              412)
on conflict (tag) do update set post_count = excluded.post_count, updated_at = now();

-- Sample events (upsert via title — not truly safe without unique, kept for dev)
insert into events (title, description, date, location, interested_count, going_count, date_color)
  select 'Viewing Party — Solo Leveling S2',
         'Viewing party online em conjunto para o ultimo episodio de Solo Leveling S2.',
         now() + interval '4 days',
         'Online',
         128, 34, '#fcb45c'
  where not exists (select 1 from events where title = 'Viewing Party — Solo Leveling S2');

insert into events (title, description, date, location, interested_count, going_count, date_color)
  select 'Lisboa Anime Fest 2026',
         'O maior evento de anime em Portugal. Cosplay, paineis, merchan e muito mais.',
         now() + interval '10 days',
         'Lisboa, Portugal',
         342, 89, '#fc5c7d'
  where not exists (select 1 from events where title = 'Lisboa Anime Fest 2026');

-- Sample news
insert into news (title, summary, category, source, published_at)
  select 'Demon Slayer: Infinity Castle Arc estreia em Julho',
         'O arco mais esperado chega finalmente aos ecras com uma producao cinematografica de 3 partes.',
         'Anime', 'Crunchyroll News', now() - interval '2 hours'
  where not exists (select 1 from news where title = 'Demon Slayer: Infinity Castle Arc estreia em Julho');

insert into news (title, summary, category, source, published_at)
  select 'One Piece: Manga atinge capitulo 1150',
         'Oda-sensei continua a surpreender depois de mais de 25 anos com uma reviravolta inesperada.',
         'Manga', 'Viz Media', now() - interval '5 hours'
  where not exists (select 1 from news where title = 'One Piece: Manga atinge capitulo 1150');

insert into news (title, summary, category, source, published_at)
  select 'Frieren: Edicao especial Blu-ray com cenas ineditas',
         'A serie ganha edicao coleccionador com making-of exclusivo e storyboards originais.',
         'Coleccionaveis', 'Nippon Animation', now() - interval '1 day'
  where not exists (select 1 from news where title = 'Frieren: Edicao especial Blu-ray com cenas ineditas');
