create extension if not exists "pgcrypto";

create type media_type as enum ('movie', 'tv', 'book');
create type action_type as enum ('diary_entry', 'watchlist', 'like', 'rating_only');
create type list_visibility as enum ('public', 'private', 'unlisted');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,24}$'),
  display_name text,
  avatar_url text,
  bio text,
  top_four jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  external_media_id text not null,
  media_type media_type not null,
  action_type action_type not null,
  rating integer check (rating between 1 and 10),
  review_text text,
  date_consumed date,
  is_rewatch boolean not null default false,
  has_spoilers boolean not null default false,
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, external_media_id, media_type, action_type)
);

create table public.lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (length(title) between 1 and 120),
  description text,
  is_ranked boolean not null default false,
  visibility list_visibility not null default 'public',
  created_at timestamptz not null default now()
);

create table public.list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  external_media_id text not null,
  media_type media_type not null,
  rank_position integer,
  user_note text,
  created_at timestamptz not null default now()
);

create table public.follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table public.list_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  list_id uuid not null references public.lists(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, list_id)
);

create table public.list_comments (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.lists(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (length(trim(body)) > 0),
  created_at timestamptz not null default now()
);

create index logs_user_created_idx on public.logs(user_id, created_at desc);
create index logs_media_idx on public.logs(media_type, external_media_id);
create index lists_user_idx on public.lists(user_id, created_at desc);
create index lists_public_idx on public.lists(created_at desc) where visibility = 'public';
create index list_items_list_idx on public.list_items(list_id, rank_position);
create index follows_following_idx on public.follows(following_id);
create index comments_list_idx on public.list_comments(list_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_username text;
begin
  requested_username := coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1));
  requested_username := regexp_replace(requested_username, '[^A-Za-z0-9_]', '_', 'g');
  if length(requested_username) < 3 then
    requested_username := 'user_' || substr(new.id::text, 1, 8);
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_username)
  on conflict (username) do update set username = requested_username || '_' || substr(new.id::text, 1, 5);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.logs enable row level security;
alter table public.lists enable row level security;
alter table public.list_items enable row level security;
alter table public.follows enable row level security;
alter table public.list_likes enable row level security;
alter table public.list_comments enable row level security;

create policy "profiles are public" on public.profiles for select using (true);
create policy "users update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "logs are publicly readable" on public.logs for select using (true);
create policy "users insert own logs" on public.logs for insert with check (auth.uid() = user_id);
create policy "users update own logs" on public.logs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own logs" on public.logs for delete using (auth.uid() = user_id);

create policy "public lists readable" on public.lists for select using (visibility = 'public' or user_id = auth.uid());
create policy "users insert own lists" on public.lists for insert with check (auth.uid() = user_id);
create policy "users update own lists" on public.lists for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users delete own lists" on public.lists for delete using (auth.uid() = user_id);

create policy "read visible list items" on public.list_items for select using (
  exists (
    select 1 from public.lists
    where lists.id = list_items.list_id
    and (lists.visibility = 'public' or lists.user_id = auth.uid())
  )
);
create policy "owners insert list items" on public.list_items for insert with check (
  exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
);
create policy "owners update list items" on public.list_items for update using (
  exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
) with check (
  exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
);
create policy "owners delete list items" on public.list_items for delete using (
  exists (select 1 from public.lists where lists.id = list_items.list_id and lists.user_id = auth.uid())
);

create policy "follows readable" on public.follows for select using (true);
create policy "users follow as self" on public.follows for insert with check (auth.uid() = follower_id);
create policy "users unfollow as self" on public.follows for delete using (auth.uid() = follower_id);

create policy "list likes readable" on public.list_likes for select using (true);
create policy "users like as self" on public.list_likes for insert with check (
  auth.uid() = user_id and exists (select 1 from public.lists where lists.id = list_likes.list_id and lists.visibility = 'public')
);
create policy "users unlike as self" on public.list_likes for delete using (auth.uid() = user_id);

create policy "comments on public lists readable" on public.list_comments for select using (
  exists (select 1 from public.lists where lists.id = list_comments.list_id and lists.visibility = 'public')
);
create policy "users comment as self" on public.list_comments for insert with check (
  auth.uid() = user_id and exists (select 1 from public.lists where lists.id = list_comments.list_id and lists.visibility = 'public')
);
create policy "users delete own comments" on public.list_comments for delete using (auth.uid() = user_id);
