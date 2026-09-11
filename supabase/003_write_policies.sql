-- 投稿・いいね・保存をアプリから書き込めるようにする
-- SQL Editor でそのまま Run

-- ── 1. いいね / 保存テーブル ──────────────────────────────────────────────

create table if not exists public.roadmap_likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id text not null references public.roadmaps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, roadmap_id)
);

create table if not exists public.roadmap_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  roadmap_id text not null references public.roadmaps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, roadmap_id)
);

alter table public.roadmap_likes enable row level security;
alter table public.roadmap_bookmarks enable row level security;

drop policy if exists "Anyone can read roadmap_likes" on public.roadmap_likes;
create policy "Anyone can read roadmap_likes"
on public.roadmap_likes for select to anon, authenticated using (true);

drop policy if exists "Users manage own likes" on public.roadmap_likes;
create policy "Users manage own likes"
on public.roadmap_likes for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users read own bookmarks" on public.roadmap_bookmarks;
create policy "Users read own bookmarks"
on public.roadmap_bookmarks for select to authenticated
using (user_id = auth.uid());

drop policy if exists "Users manage own bookmarks" on public.roadmap_bookmarks;
create policy "Users manage own bookmarks"
on public.roadmap_bookmarks for all to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- ── 2. likes カウントを自動更新するトリガー ───────────────────────────────

create or replace function public.sync_roadmap_likes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'INSERT') then
    update public.roadmaps set likes = likes + 1 where id = new.roadmap_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.roadmaps set likes = greatest(likes - 1, 0) where id = old.roadmap_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists roadmap_likes_sync on public.roadmap_likes;
create trigger roadmap_likes_sync
after insert or delete on public.roadmap_likes
for each row execute function public.sync_roadmap_likes();

-- ── 3. 閲覧数を増やす関数 ─────────────────────────────────────────────────

create or replace function public.increment_roadmap_views(p_roadmap_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.roadmaps set views = views + 1 where id = p_roadmap_id;
$$;

grant execute on function public.increment_roadmap_views(text) to anon, authenticated;

-- ── 4. roadmaps の書き込みポリシー ────────────────────────────────────────
-- author_id にログインユーザーの uid を入れる想定

drop policy if exists "Users insert own roadmaps" on public.roadmaps;
create policy "Users insert own roadmaps"
on public.roadmaps for insert to authenticated
with check (author_id = auth.uid()::text);

drop policy if exists "Users update own roadmaps" on public.roadmaps;
create policy "Users update own roadmaps"
on public.roadmaps for update to authenticated
using (author_id = auth.uid()::text)
with check (author_id = auth.uid()::text);

drop policy if exists "Users delete own roadmaps" on public.roadmaps;
create policy "Users delete own roadmaps"
on public.roadmaps for delete to authenticated
using (author_id = auth.uid()::text);

-- ── 5. 子テーブルの書き込みポリシー（親の持ち主だけ） ─────────────────────

drop policy if exists "Users manage own roadmap_groups" on public.roadmap_groups;
create policy "Users manage own roadmap_groups"
on public.roadmap_groups for all to authenticated
using (
  exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_groups.roadmap_id
      and r.author_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from public.roadmaps r
    where r.id = roadmap_groups.roadmap_id
      and r.author_id = auth.uid()::text
  )
);

drop policy if exists "Users manage own roadmap_nodes" on public.roadmap_nodes;
create policy "Users manage own roadmap_nodes"
on public.roadmap_nodes for all to authenticated
using (
  exists (
    select 1 from public.roadmap_groups g
    join public.roadmaps r on r.id = g.roadmap_id
    where g.id = roadmap_nodes.group_id
      and r.author_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from public.roadmap_groups g
    join public.roadmaps r on r.id = g.roadmap_id
    where g.id = roadmap_nodes.group_id
      and r.author_id = auth.uid()::text
  )
);

drop policy if exists "Users manage own roadmap_details" on public.roadmap_details;
create policy "Users manage own roadmap_details"
on public.roadmap_details for all to authenticated
using (
  exists (
    select 1 from public.roadmap_nodes n
    join public.roadmap_groups g on g.id = n.group_id
    join public.roadmaps r on r.id = g.roadmap_id
    where n.id = roadmap_details.node_id
      and r.author_id = auth.uid()::text
  )
)
with check (
  exists (
    select 1 from public.roadmap_nodes n
    join public.roadmap_groups g on g.id = n.group_id
    join public.roadmaps r on r.id = g.roadmap_id
    where n.id = roadmap_details.node_id
      and r.author_id = auth.uid()::text
  )
);
