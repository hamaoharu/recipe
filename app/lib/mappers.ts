import { Roadmap } from "./types";

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