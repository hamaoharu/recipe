-- 公開前の安全側の設定。SQL Editor でそのまま Run
-- 失敗したらその文だけ教えてください

-- ── 1. 誰でも読める範囲を明示 ─────────────────────────────────────────────

drop policy if exists "Anyone can read roadmaps" on public.roadmaps;
create policy "Anyone can read roadmaps"
on public.roadmaps for select to anon, authenticated using (true);

drop policy if exists "Anyone can read roadmap_groups" on public.roadmap_groups;
create policy "Anyone can read roadmap_groups"
on public.roadmap_groups for select to anon, authenticated using (true);

drop policy if exists "Anyone can read roadmap_nodes" on public.roadmap_nodes;
create policy "Anyone can read roadmap_nodes"
on public.roadmap_nodes for select to anon, authenticated using (true);

-- いいねの行（誰が押したか）は本人だけ。件数は roadmaps.likes を見る
drop policy if exists "Anyone can read roadmap_likes" on public.roadmap_likes;
drop policy if exists "Users read own likes" on public.roadmap_likes;
create policy "Users read own likes"
on public.roadmap_likes for select to authenticated
using (user_id = auth.uid());

-- ── 2. likes / views / author_id をクライアントから書き換えられなくする ───
-- 閲覧数といいね数の更新は、下の SECURITY DEFINER 関数だけが行う

revoke update on table public.roadmaps from anon, authenticated;
grant update (
  title,
  description,
  tags,
  total_days,
  author_name,
  author_initial
) on table public.roadmaps to authenticated;

-- 新規投稿で likes / views を盛れないようにする
drop policy if exists "Users insert own roadmaps" on public.roadmaps;
create policy "Users insert own roadmaps"
on public.roadmaps for insert to authenticated
with check (
  author_id = auth.uid()::text
  and coalesce(likes, 0) = 0
  and coalesce(views, 0) = 0
  and char_length(title) between 1 and 200
  and char_length(coalesce(description, '')) <= 20000
);

drop policy if exists "Users update own roadmaps" on public.roadmaps;
create policy "Users update own roadmaps"
on public.roadmaps for update to authenticated
using (author_id = auth.uid()::text)
with check (
  author_id = auth.uid()::text
  and char_length(title) between 1 and 200
  and char_length(coalesce(description, '')) <= 20000
);

-- ── 3. ログイン中の閲覧は1日1回まで数える ─────────────────────────────────

create table if not exists public.roadmap_view_dedup (
  roadmap_id text not null references public.roadmaps(id) on delete cascade,
  viewer_id uuid not null,
  viewed_on date not null,
  primary key (roadmap_id, viewer_id, viewed_on)
);

alter table public.roadmap_view_dedup enable row level security;
revoke all on table public.roadmap_view_dedup from public, anon, authenticated;

drop function if exists public.increment_roadmap_views(text);

create or replace function public.increment_roadmap_views(p_roadmap_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  inserted int;
begin
  if not exists (select 1 from public.roadmaps where id = p_roadmap_id) then
    return;
  end if;

  if uid is not null then
    insert into public.roadmap_view_dedup (roadmap_id, viewer_id, viewed_on)
    values (p_roadmap_id, uid, (timezone('utc', now()))::date)
    on conflict do nothing;
    get diagnostics inserted = row_count;
    if inserted = 0 then
      return;
    end if;
  end if;

  update public.roadmaps set views = views + 1 where id = p_roadmap_id;
end;
$$;

revoke all on function public.increment_roadmap_views(text) from public;
grant execute on function public.increment_roadmap_views(text) to anon, authenticated;

-- ── 4. 編集を1本のトランザクションにする ─────────────────────────────────

create or replace function public.save_roadmap_content(
  p_id text,
  p_title text,
  p_description text,
  p_tags text,
  p_total_days integer,
  p_groups jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  g jsonb;
  n jsonb;
  gi int := 0;
  ni int;
  gid text;
  nid text;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (
    select 1 from public.roadmaps r
    where r.id = p_id and r.author_id = auth.uid()::text
  ) then
    raise exception 'not allowed';
  end if;
  if char_length(coalesce(p_title, '')) = 0 or char_length(p_title) > 200 then
    raise exception 'invalid title';
  end if;
  if char_length(coalesce(p_description, '')) > 20000 then
    raise exception 'invalid description';
  end if;

  update public.roadmaps
  set
    title = p_title,
    description = p_description,
    tags = p_tags,
    total_days = greatest(p_total_days, 0)
  where id = p_id;

  delete from public.roadmap_groups where roadmap_id = p_id;

  for g in select value from jsonb_array_elements(coalesce(p_groups, '[]'::jsonb))
  loop
    gid := p_id || '-' || coalesce(g->>'id', gi::text);
    insert into public.roadmap_groups (id, roadmap_id, label, sort_order)
    values (gid, p_id, nullif(g->>'label', ''), gi);

    ni := 0;
    for n in select value from jsonb_array_elements(coalesce(g->'nodes', '[]'::jsonb))
    loop
      nid := p_id || '-' || coalesce(n->>'id', ni::text);
      insert into public.roadmap_nodes (id, group_id, label, required, days, sort_order)
      values (
        nid,
        gid,
        left(coalesce(n->>'label', ''), 200),
        coalesce((n->>'required')::boolean, true),
        least(greatest(coalesce((n->>'days')::int, 0), 0), 365),
        ni
      );
      insert into public.roadmap_details (node_id, title, days, description, resources, criteria)
      values (
        nid,
        left(coalesce(n->>'label', ''), 200),
        least(greatest(coalesce((n->>'days')::int, 0), 0), 365),
        left(coalesce(n->>'description', ''), 20000),
        (
          select coalesce(jsonb_agg(elem order by ord), '[]'::jsonb)
          from (
            select
              ord,
              jsonb_build_object(
              'label', left(coalesce(r->>'label', ''), 200),
              'url', case
                when coalesce(r->>'url', '') ~* '^https?://[^[:space:]]+$' then r->>'url'
                else null
              end,
              'note', left(coalesce(r->>'note', ''), 2000)
            ) as elem
            from jsonb_array_elements(coalesce(n->'resources', '[]'::jsonb))
              with ordinality as t(r, ord)
            where ord <= 30
          ) s
        ),
        (
          select coalesce(jsonb_agg(to_jsonb(left(c #>> '{}', 500)) order by ord), '[]'::jsonb)
          from (
            select ord, c
            from jsonb_array_elements(coalesce(n->'criteria', '[]'::jsonb))
              with ordinality as t(c, ord)
            where ord <= 30
          ) s
        )
      );
      ni := ni + 1;
    end loop;
    gi := gi + 1;
  end loop;
end;
$$;

revoke all on function public.save_roadmap_content(text, text, text, text, integer, jsonb) from public;
grant execute on function public.save_roadmap_content(text, text, text, text, integer, jsonb) to authenticated;

-- ── 5. 新規投稿も1本のトランザクション ───────────────────────────────────

create or replace function public.create_roadmap_full(
  p_id text,
  p_title text,
  p_description text,
  p_tags text,
  p_author_name text,
  p_author_initial text,
  p_total_days integer,
  p_groups jsonb
)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if char_length(coalesce(p_title, '')) = 0 or char_length(p_title) > 200 then
    raise exception 'invalid title';
  end if;

  insert into public.roadmaps (
    id, title, description, author_id, author_name, author_initial,
    tags, likes, views, total_days
  ) values (
    p_id,
    p_title,
    left(coalesce(p_description, ''), 20000),
    auth.uid()::text,
    left(coalesce(p_author_name, 'user'), 80),
    left(coalesce(p_author_initial, 'U'), 1),
    p_tags,
    0,
    0,
    greatest(p_total_days, 0)
  );

  perform public.save_roadmap_content(
    p_id, p_title, left(coalesce(p_description, ''), 20000),
    p_tags, greatest(p_total_days, 0), p_groups
  );

  return p_id;
end;
$$;

revoke all on function public.create_roadmap_full(text, text, text, text, text, text, integer, jsonb) from public;
grant execute on function public.create_roadmap_full(text, text, text, text, text, text, integer, jsonb) to authenticated;

-- ── 6. 退会（自分の投稿と認証ユーザーを消す） ─────────────────────────────

create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  delete from public.roadmaps where author_id = uid::text;
  delete from public.roadmap_likes where user_id = uid;
  delete from public.roadmap_bookmarks where user_id = uid;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_own_account() from public;
grant execute on function public.delete_own_account() to authenticated;
