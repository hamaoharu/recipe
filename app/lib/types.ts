export type Author = {
  id: string;
  name: string;
  initial: string;
};

// 一覧・カード用（地図データは含まない）
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
};

export type RoadmapNode = {
  id: string;
  label: string;
  required: boolean;
  days: number;
};

export type RoadmapGroup = {
  id: string;
  label: string | null;
  nodes: RoadmapNode[];
};

export type DetailResource = {
  label: string;
  url: string | null;
  note: string;
};

export type DetailCriterion = string | { text: string };

export type DetailItem = {
  title: string;
  days: number;
  description: string;
  resources: DetailResource[];
  criteria: DetailCriterion[];
};

export type DetailMap = Record<string, DetailItem>;

// ユーザー投稿用（地図 + 詳細つき）
export type UserRoadmap = Roadmap & {
  groups: RoadmapGroup[];
  details: DetailMap;
};
