import {
  buildDetailMap,
  buildRoadmapGroups,
  toRoadmap,
  type RoadmapDetailRow,
  type RoadmapGroupRow,
  type RoadmapNodeRow,
  type RoadmapRow,
} from "./mappers";
import { createClient } from "./supabase/client";
import type { Author, DetailItem, Roadmap, RoadmapGroup } from "./types";

export async function fetchRoadmaps(): Promise<Roadmap[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as RoadmapRow[]).map(toRoadmap);
}

export async function fetchRoadmapsByAuthor(
  authorId: string,
): Promise<Roadmap[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("author_id", authorId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as RoadmapRow[]).map(toRoadmap);
}

export async function fetchRoadmapsByIds(ids: string[]): Promise<Roadmap[]> {
  if (ids.length === 0) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("roadmaps")
    .select("*")
    .in("id", ids);
  if (error) throw error;
  return ((data ?? []) as RoadmapRow[]).map(toRoadmap);
}

export type RoadmapDetailBundle = {
  roadmap: Roadmap | null;
  groups: RoadmapGroup[];
  details: Record<string, DetailItem>;
};

export async function fetchRoadmapBundle(
  id: string,
): Promise<RoadmapDetailBundle> {
  const supabase = createClient();

  const { data: roadmapRow, error: roadmapError } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (roadmapError) throw roadmapError;

  const roadmap = roadmapRow ? toRoadmap(roadmapRow as RoadmapRow) : null;

  const { data: groupRows, error: groupsError } = await supabase
    .from("roadmap_groups")
    .select("*")
    .eq("roadmap_id", id)
    .order("sort_order");
  if (groupsError) throw groupsError;

  const groups = (groupRows ?? []) as RoadmapGroupRow[];
  if (groups.length === 0) return { roadmap, groups: [], details: {} };

  const { data: nodeRows, error: nodesError } = await supabase
    .from("roadmap_nodes")
    .select("*")
    .in(
      "group_id",
      groups.map((g) => g.id),
    )
    .order("sort_order");
  if (nodesError) throw nodesError;

  const nodes = (nodeRows ?? []) as RoadmapNodeRow[];
  const builtGroups = buildRoadmapGroups(groups, nodes);

  if (nodes.length === 0) {
    return { roadmap, groups: builtGroups, details: {} };
  }

  const { data: detailRows, error: detailsError } = await supabase
    .from("roadmap_details")
    .select("*")
    .in(
      "node_id",
      nodes.map((n) => n.id),
    );
  if (detailsError) throw detailsError;

  return {
    roadmap,
    groups: builtGroups,
    details: buildDetailMap((detailRows ?? []) as RoadmapDetailRow[]),
  };
}

export async function incrementViews(id: string): Promise<void> {
  const supabase = createClient();
  await supabase.rpc("increment_roadmap_views", { p_roadmap_id: id });
}

export async function deleteRoadmap(id: string): Promise<void> {
  const supabase = createClient();
  // 子テーブルは on delete cascade で一緒に消える
  const { error } = await supabase.from("roadmaps").delete().eq("id", id);
  if (error) throw error;
}

//タイトルから URL 用の id を作る。日本語だけの場合は空になるので接頭辞で補う
function toSlug(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 8);
  return base ? `${base}-${suffix}` : `roadmap-${suffix}`;
}

export type NewRoadmapInput = {
  title: string;
  description: string;
  tags: string[];
  author: Author;
  groups: {
    id: string;
    label: string | null;
    nodes: {
      id: string;
      label: string;
      required: boolean;
      days: number;
      description: string;
      resources: { label: string; url: string | null; note: string }[];
      criteria: string[];
    }[];
  }[];
};

export async function createRoadmap(input: NewRoadmapInput): Promise<string> {
  const supabase = createClient();
  const id = toSlug(input.title);

  const totalDays = input.groups
    .flatMap((g) => g.nodes)
    .filter((n) => n.required)
    .reduce((sum, n) => sum + n.days, 0);

  const { error: roadmapError } = await supabase.from("roadmaps").insert({
    id,
    title: input.title,
    description: input.description,
    author_id: input.author.id,
    author_name: input.author.name,
    author_initial: input.author.initial,
    tags: input.tags.join(","),
    likes: 0,
    views: 0,
    total_days: totalDays,
  });
  if (roadmapError) throw roadmapError;

  if (input.groups.length === 0) return id;

  const { error: groupsError } = await supabase.from("roadmap_groups").insert(
    input.groups.map((g, i) => ({
      id: `${id}-${g.id}`,
      roadmap_id: id,
      label: g.label,
      sort_order: i,
    })),
  );
  if (groupsError) throw groupsError;

  const nodeRows = input.groups.flatMap((g) =>
    g.nodes.map((n, i) => ({
      id: `${id}-${n.id}`,
      group_id: `${id}-${g.id}`,
      label: n.label,
      required: n.required,
      days: n.days,
      sort_order: i,
    })),
  );
  if (nodeRows.length === 0) return id;

  const { error: nodesError } = await supabase
    .from("roadmap_nodes")
    .insert(nodeRows);
  if (nodesError) throw nodesError;

  const detailRows = input.groups.flatMap((g) =>
    g.nodes.map((n) => ({
      node_id: `${id}-${n.id}`,
      title: n.label,
      days: n.days,
      description: n.description,
      resources: n.resources,
      criteria: n.criteria,
    })),
  );

  const { error: detailsError } = await supabase
    .from("roadmap_details")
    .insert(detailRows);
  if (detailsError) throw detailsError;

  return id;
}