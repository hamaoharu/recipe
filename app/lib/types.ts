export type Author = {
    id: string;
    name: string;
    initial: string;
}

//トップページで使っている型
//詳細ページでの地図データは含まない
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