-- Create gallery_likes table
create table if not exists gallery_likes (
  item_id    uuid        not null references gallery_items(id) on delete cascade,
  user_id    uuid        not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (item_id, user_id)
);

-- Enable RLS
alter table gallery_likes enable row level security;

-- Create indexes
create index if not exists idx_gallery_likes_user_id on gallery_likes(user_id);
create index if not exists idx_gallery_likes_item_id on gallery_likes(item_id);

-- RLS Policies
drop policy if exists "gallery_likes_select" on gallery_likes;
drop policy if exists "gallery_likes_insert" on gallery_likes;
drop policy if exists "gallery_likes_delete" on gallery_likes;

create policy "gallery_likes_select" on gallery_likes
  for select to authenticated using (true);

create policy "gallery_likes_insert" on gallery_likes
  for insert to authenticated with check (auth.uid() = user_id);

create policy "gallery_likes_delete" on gallery_likes
  for delete to authenticated using (auth.uid() = user_id);
