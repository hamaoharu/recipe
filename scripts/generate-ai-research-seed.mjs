import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "supabase", "ai-research");
const out = join(root, "supabase", "007_seed_ai_research.sql");

function sqlStr(value) {
  if (value == null) return "null";
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  if (value == null) return "null";
  return `'${JSON.stringify(value).replaceAll("'", "''")}'::jsonb`;
}

const files = readdirSync(dir)
  .filter((name) => name.endsWith(".json") && !name.startsWith("_"))
  .sort();

if (files.length === 0) {
  throw new Error("no JSON in supabase/ai-research");
}

const roadmaps = [];
const groups = [];
const nodes = [];
const details = [];
const ids = [];

for (const file of files) {
  const data = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const id = data.id;
  ids.push(id);
  const totalDays = (data.groups ?? [])
    .flatMap((g) => g.nodes ?? [])
    .filter((n) => n.required !== false)
    .reduce((sum, n) => sum + Number(n.days ?? 0), 0);

  roadmaps.push(`  (
    ${sqlStr(id)},
    ${sqlStr(data.title)},
    ${sqlStr(data.description ?? data.summary ?? "")},
    'ai-research',
    'AI Research',
    'A',
    ${sqlStr((data.tags ?? []).join(","))},
    0,
    0,
    ${totalDays},
    now(),
    true,
    ${sqlStr(data.targetUser ?? null)},
    ${sqlStr(data.goal ?? null)},
    ${sqlStr(data.estimatedDuration ?? null)},
    ${sqlStr(data.estimatedHours ?? null)},
    ${sqlStr(data.difficulty ?? null)},
    ${Number(data.sourceCount ?? 0)},
    ${Number(data.confidence ?? 0)},
    ${sqlJson(data.sourceBreakdown ?? {})},
    ${sqlJson(data.commonPatterns ?? [])},
    ${sqlStr(data.researchSummary ?? "")},
    ${sqlJson(data.sources ?? [])}
  )`);

  (data.groups ?? []).forEach((group, gi) => {
    const gid = `${id}-g-${group.id ?? gi}`;
    groups.push(
      `  (${sqlStr(gid)}, ${sqlStr(id)}, ${sqlStr(group.label ?? null)}, ${gi})`,
    );
    (group.nodes ?? []).forEach((node, ni) => {
      const nid = `${id}-n-${node.id ?? ni}`;
      nodes.push(
        `  (${sqlStr(nid)}, ${sqlStr(gid)}, ${sqlStr(node.label)}, ${node.required !== false}, ${Number(node.days ?? 0)}, ${ni})`,
      );
      details.push(`  (
    ${sqlStr(nid)},
    ${sqlStr(node.title ?? node.label)},
    ${Number(node.days ?? 0)},
    ${sqlStr(node.description ?? "")},
    ${sqlJson(node.resources ?? [])},
    ${sqlJson(node.criteria ?? [])},
    ${sqlStr(node.why ?? null)},
    ${sqlJson(node.tasks ?? [])},
    ${sqlJson(node.commonMistakes ?? [])},
    ${sqlStr(node.sourceSupportRate ?? null)},
    ${sqlStr(node.category ?? null)}
  )`);
    });
  });
}

const idList = ids.map(sqlStr).join(", ");

const sql = `-- AI Research 投稿。006 を先に Run すること
-- SQL Editor でこのファイルをそのまま Run
-- 同じ id があれば作り直す

delete from public.roadmaps where id in (${idList});

insert into public.roadmaps (
  id, title, description, author_id, author_name, author_initial,
  tags, likes, views, total_days, created_at,
  is_ai_research, target_user, goal, estimated_duration, estimated_hours,
  difficulty, source_count, confidence, source_breakdown, common_patterns,
  research_summary, sources
) values
${roadmaps.join(",\n")};

insert into public.roadmap_groups (id, roadmap_id, label, sort_order) values
${groups.join(",\n")};

insert into public.roadmap_nodes (id, group_id, label, required, days, sort_order) values
${nodes.join(",\n")};

insert into public.roadmap_details (
  node_id, title, days, description, resources, criteria,
  why, tasks, common_mistakes, source_support_rate, category
) values
${details.join(",\n")};
`;

writeFileSync(out, sql);
console.log(`wrote ${out} (${ids.length} roadmaps)`);
