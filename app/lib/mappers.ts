import type {
  DetailItem,
  DetailMap,
  DetailResource,
  Roadmap,
  RoadmapGroup,
  RoadmapNode,
} from "./types";

export type RoadmapRow = {
    id: string;
    title: string;
    description: string;
    author_id: string;
    author_name: string;
    author_initial: string;
    tags: string | null;
    likes: number;
    views: number;
    total_days: number;
    created_at: string;
    is_ai_research?: boolean | null;
    target_user?: string | null;
    goal?: string | null;
    estimated_duration?: string | null;
    estimated_hours?: string | null;
    difficulty?: string | null;
    source_count?: number | null;
    confidence?: number | null;
    source_breakdown?: Roadmap["sourceBreakdown"];
    common_patterns?: Roadmap["commonPatterns"];
    research_summary?: string | null;
    sources?: Roadmap["sources"];
};

export function toRoadmap(row: RoadmapRow): Roadmap {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        author: {
        id: row.author_id,
        name: row.author_name,
        initial: row.author_initial,
        },
        tags: row.tags
        ? row.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
        likes: row.likes,
        views: row.views,
        totalDays: row.total_days,
        createdAt: row.created_at.slice(0, 10),
        isAiResearch: Boolean(row.is_ai_research),
        targetUser: row.target_user ?? null,
        goal: row.goal ?? null,
        estimatedDuration: row.estimated_duration ?? null,
        estimatedHours: row.estimated_hours ?? null,
        difficulty: row.difficulty ?? null,
        sourceCount: row.source_count ?? null,
        confidence: row.confidence ?? null,
        sourceBreakdown: row.source_breakdown ?? null,
        commonPatterns: row.common_patterns ?? null,
        researchSummary: row.research_summary ?? null,
        sources: Array.isArray(row.sources) ? row.sources : null,
    };
}

export type RoadmapGroupRow = {
    id: string;
    roadmap_id: string;
    label: string | null;
    sort_order: number;
};

export type RoadmapNodeRow = {
    id: string;
    group_id: string;
    label: string;
    required: boolean;
    days: number;
    sort_order: number;
};

export function toRoadmapNode(row: RoadmapNodeRow): RoadmapNode {
    return {
        id: row.id,
        label: row.label,
        required: row.required,
        days: row.days,
    };
}

export function buildRoadmapGroups(
    groupRows: RoadmapGroupRow[],
    nodeRows: RoadmapNodeRow[],
): RoadmapGroup[] {
    const nodesByGroup = new Map<string, RoadmapNodeRow[]>();
    for (const node of nodeRows) {
        const list = nodesByGroup.get(node.group_id) ?? [];
        list.push(node);
        nodesByGroup.set(node.group_id, list);
    }

    return groupRows
        .slice()
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((group) => ({
            id: group.id,
            label: group.label,
            nodes: (nodesByGroup.get(group.id) ?? [])
                .slice()
                .sort((a, b) => a.sort_order - b.sort_order)
                .map(toRoadmapNode),
        }));
}

export function totalRequiredDays(groups: RoadmapGroup[]): number {
    return groups
        .flatMap((g) => g.nodes)
        .filter((n) => n.required)
        .reduce((sum, n) => sum + n.days, 0);
}

export type RoadmapDetailRow = {
    node_id: string;
    title: string;
    days: number;
    description: string;
    resources: DetailResource[] | null;
    criteria: (string | { text: string })[] | null;
    why?: string | null;
    tasks?: string[] | null;
    common_mistakes?: string[] | null;
    source_support_rate?: string | null;
    category?: string | null;
};

export function toDetailItem(row: RoadmapDetailRow): DetailItem {
    return {
        title: row.title,
        days: row.days,
        description: row.description,
        resources: Array.isArray(row.resources) ? row.resources : [],
        criteria: Array.isArray(row.criteria) ? row.criteria : [],
        why: row.why ?? null,
        tasks: Array.isArray(row.tasks) ? row.tasks : [],
        commonMistakes: Array.isArray(row.common_mistakes) ? row.common_mistakes : [],
        sourceSupportRate: row.source_support_rate ?? null,
        category: row.category ?? null,
    };
}

export function buildDetailMap(rows: RoadmapDetailRow[]): DetailMap {
    const map: DetailMap = {};
    for (const row of rows) {
        map[row.node_id] = toDetailItem(row);
    }
    return map;
}