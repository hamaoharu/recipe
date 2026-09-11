-- roadmap_details: ノード詳細（右パネル）
-- SQL Editor でこのファイルをそのまま Run

create table if not exists public.roadmap_details (
  node_id text primary key references public.roadmap_nodes(id) on delete cascade,
  title text not null,
  days int4 not null default 0,
  description text not null default '',
  resources jsonb not null default '[]'::jsonb,
  criteria jsonb not null default '[]'::jsonb
);

alter table public.roadmap_details enable row level security;

drop policy if exists "Anyone can read roadmap_details" on public.roadmap_details;
create policy "Anyone can read roadmap_details"
on public.roadmap_details
for select
to anon, authenticated
using (true);
