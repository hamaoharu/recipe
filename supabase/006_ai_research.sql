-- AI Research 用の列。ユーザー投稿では空のままでよい
-- SQL Editor で Run

alter table public.roadmaps
  add column if not exists is_ai_research boolean not null default false,
  add column if not exists target_user text,
  add column if not exists goal text,
  add column if not exists estimated_duration text,
  add column if not exists estimated_hours text,
  add column if not exists difficulty text,
  add column if not exists source_count integer,
  add column if not exists confidence integer,
  add column if not exists source_breakdown jsonb,
  add column if not exists common_patterns jsonb,
  add column if not exists research_summary text,
  add column if not exists sources jsonb;

alter table public.roadmap_details
  add column if not exists why text,
  add column if not exists tasks jsonb not null default '[]'::jsonb,
  add column if not exists common_mistakes jsonb not null default '[]'::jsonb,
  add column if not exists source_support_rate text,
  add column if not exists category text;
