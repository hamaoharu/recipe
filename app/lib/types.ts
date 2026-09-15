export type Author = {
  id: string;
  name: string;
  initial: string;
};

export type ResearchPattern = {
  label: string;
  rate: number;
};

export type SourceBreakdown = {
  achieverBlogs?: number;
  expertArticles?: number;
  official?: number;
  educationMedia?: number;
  youtube?: number;
  reddit?: number;
};

export type ResearchSource = {
  title: string;
  url: string | null;
  kind: string;
};

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
  isAiResearch: boolean;
  targetUser: string | null;
  goal: string | null;
  estimatedDuration: string | null;
  estimatedHours: string | null;
  difficulty: string | null;
  sourceCount: number | null;
  confidence: number | null;
  sourceBreakdown: SourceBreakdown | null;
  commonPatterns: ResearchPattern[] | null;
  researchSummary: string | null;
  sources: ResearchSource[] | null;
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
  why: string | null;
  tasks: string[];
  commonMistakes: string[];
  sourceSupportRate: string | null;
  category: string | null;
};

export type DetailMap = Record<string, DetailItem>;

export type UserRoadmap = Roadmap & {
  groups: RoadmapGroup[];
  details: DetailMap;
};
