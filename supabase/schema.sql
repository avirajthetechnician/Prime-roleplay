-- PRIME ROLEPLAY COMMUNITY FORUM
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  avatar_url text,
  role text not null default 'player' check (role in ('player','moderator','admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_categories (
  slug text primary key,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_threads (
  id uuid primary key default gen_random_uuid(),
  category text not null references public.forum_categories(slug) on update cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 140),
  body text not null check (char_length(body) between 1 and 10000),
  is_pinned boolean not null default false,
  is_locked boolean not null default false,
  view_count integer not null default 0,
  reply_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.forum_posts (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.forum_threads(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists forum_threads_created_idx on public.forum_threads(created_at desc);
create index if not exists forum_threads_category_idx on public.forum_threads(category, created_at desc);
create index if not exists forum_posts_thread_idx on public.forum_posts(thread_id, created_at);

insert into public.forum_categories(slug,name,description,sort_order) values
('announcements','Announcements','Official Prime Roleplay news, updates and maintenance.',1),
('general','General Discussion','Talk about the city, community and anything Prime.',2),
('roleplay','Roleplay','Characters, stories, factions and in-city discussion.',3),
('guides','Guides & Tutorials','Share tips and learn how to master the city.',4),
('support','Support','Questions, technical help and account support.',5),
('suggestions','Suggestions','Ideas that could make Prime Roleplay better.',6)
on conflict (slug) do nothing;

alter table public.forum_categories enable row level security;
alter table public.forum_threads enable row level security;
alter table public.forum_posts enable row level security;
alter table public.profiles enable row level security;

drop policy if exists "public read categories" on public.forum_categories;
create policy "public read categories" on public.forum_categories for select using (true);

drop policy if exists "public read threads" on public.forum_threads;
create policy "public read threads" on public.forum_threads for select using (true);

drop policy if exists "authenticated create threads" on public.forum_threads;
create policy "authenticated create threads" on public.forum_threads for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "authors update threads" on public.forum_threads;
create policy "authors update threads" on public.forum_threads for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "authors delete threads" on public.forum_threads;
create policy "authors delete threads" on public.forum_threads for delete to authenticated using (author_id = auth.uid());

drop policy if exists "public read posts" on public.forum_posts;
create policy "public read posts" on public.forum_posts for select using (true);

drop policy if exists "authenticated create posts" on public.forum_posts;
create policy "authenticated create posts" on public.forum_posts for insert to authenticated with check (author_id = auth.uid());

drop policy if exists "authors update posts" on public.forum_posts;
create policy "authors update posts" on public.forum_posts for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists "authors delete posts" on public.forum_posts;
create policy "authors delete posts" on public.forum_posts for delete to authenticated using (author_id = auth.uid());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid());

-- Automatically create a profile when a user registers.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', 'player_' || substr(new.id::text,1,8)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(coalesce(new.email,''),'@',1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Keep reply_count accurate.
create or replace function public.sync_forum_reply_count()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    update public.forum_threads set reply_count = reply_count + 1, updated_at = now() where id = new.thread_id;
  elsif tg_op = 'DELETE' then
    update public.forum_threads set reply_count = greatest(reply_count - 1, 0), updated_at = now() where id = old.thread_id;
  end if;
  return coalesce(new, old);
end;
$$;

drop trigger if exists forum_reply_count_trigger on public.forum_posts;
create trigger forum_reply_count_trigger
after insert or delete on public.forum_posts
for each row execute procedure public.sync_forum_reply_count();

-- View used by the forum page. It exposes display names but no email addresses.
create or replace view public.forum_thread_list as
select t.id,t.title,t.category,t.author_id,t.created_at,t.updated_at,t.reply_count,t.view_count,
       c.name as category_name,
       coalesce(p.display_name,p.username,'Prime Member') as author_name
from public.forum_threads t
join public.forum_categories c on c.slug=t.category
left join public.profiles p on p.id=t.author_id;

grant select on public.forum_thread_list to anon, authenticated;
