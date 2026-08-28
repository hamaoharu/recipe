import type { Roadmap, RoadmapGroup, RoadmapNode } from "./types";

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