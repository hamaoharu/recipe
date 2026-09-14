import { createClient } from "@supabase/supabase-js";
import {
  buildRoadmapGroups,
  toRoadmap,
  type RoadmapGroupRow,
  type RoadmapNodeRow,
  type RoadmapRow,
} from "./mappers";
import type { Roadmap, RoadmapGroup } from "./types";

//OG画像など、Cookieなしで公開データを読むとき用
function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

export async function fetchPublicRoadmap(
  id: string,
): Promise<{ roadmap: Roadmap; groups: RoadmapGroup[] } | null> {
  const supabase = createPublicClient();

  const { data: row, error } = await supabase
    .from("roadmaps")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !row) return null;

  const { data: groupRows } = await supabase
    .from("roadmap_groups")
    .select("*")
    .eq("roadmap_id", id)
    .order("sort_order");

  const groups = (groupRows ?? []) as RoadmapGroupRow[];
  if (groups.length === 0) {
    return { roadmap: toRoadmap(row as RoadmapRow), groups: [] };
  }

  const { data: nodeRows } = await supabase
    .from("roadmap_nodes")
    .select("*")
    .in(
      "group_id",
      groups.map((g) => g.id),
    )
    .order("sort_order");

  return {
    roadmap: toRoadmap(row as RoadmapRow),
    groups: buildRoadmapGroups(groups, (nodeRows ?? []) as RoadmapNodeRow[]),
  };
}
