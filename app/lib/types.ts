export type Author = {
    id: string;
    name: string;
    initial: string;
}

export type Roadmap = {
    id: string;
    title: string;
    description: string;
    author: Author;
    tags: string[];
    likes: number;
    views: number;
    totalDays: number;
    createdAt: string;
}