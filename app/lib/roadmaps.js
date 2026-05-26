export const ROADMAPS = [
  {
    id: "frontend",
    title: "Frontend Developer",
    description:
      "HTML/CSS/JS から React/TypeScript まで、フロントエンドエンジニアになるための完全ロードマップ。roadmap.sh をベースに実務目線で再構築。",
    author: { id: "shogo", name: "shogoLog", initial: "S" },
    tags: ["Frontend", "React", "JavaScript", "TypeScript"],
    likes: 142,
    views: 3241,
    totalDays: 119,
    createdAt: "2026-04-10",
  },
  {
    id: "backend-node",
    title: "Backend Developer (Node.js)",
    description:
      "Node.js + Express + PostgreSQL で実務対応のバックエンドを構築するロードマップ。REST API 設計から本番デプロイまでカバー。",
    author: { id: "devjohn", name: "devJohn", initial: "D" },
    tags: ["Backend", "Node.js", "Express", "PostgreSQL"],
    likes: 89,
    views: 1872,
    totalDays: 90,
    createdAt: "2026-04-22",
  },
  {
    id: "nextjs-fullstack",
    title: "Next.js フルスタック開発",
    description:
      "App Router, Server Actions, Prisma, Vercel を使ったモダンなフルスタック開発ロードマップ。実案件レベルの構成を想定。",
    author: { id: "mika", name: "mikadev", initial: "M" },
    tags: ["Next.js", "Fullstack", "React", "Prisma"],
    likes: 234,
    views: 5120,
    totalDays: 75,
    createdAt: "2026-03-15",
  },
  {
    id: "devops",
    title: "DevOps エンジニア",
    description:
      "CI/CD, Docker, Kubernetes, AWS を使ったインフラ・DevOps エンジニアへのロードマップ。ゼロからの構築手順を網羅。",
    author: { id: "yamada", name: "yamadaOps", initial: "Y" },
    tags: ["DevOps", "Docker", "AWS", "Kubernetes"],
    likes: 67,
    views: 1340,
    totalDays: 180,
    createdAt: "2026-05-01",
  },
  {
    id: "python-data",
    title: "Python データサイエンス",
    description:
      "Python, pandas, scikit-learn, PyTorch を使ったデータサイエンス・機械学習ロードマップ。数学の基礎から実装まで。",
    author: { id: "tanaka", name: "tanaka_ds", initial: "T" },
    tags: ["Python", "DataScience", "MachineLearning"],
    likes: 198,
    views: 4210,
    totalDays: 150,
    createdAt: "2026-02-28",
  },
  {
    id: "ios-dev",
    title: "iOS アプリ開発",
    description:
      "Swift と SwiftUI で iOS アプリを作れるようになるためのロードマップ。App Store リリースまでのフルルート。",
    author: { id: "kobayashi", name: "kobakoba", initial: "K" },
    tags: ["iOS", "Swift", "SwiftUI", "Mobile"],
    likes: 45,
    views: 890,
    totalDays: 120,
    createdAt: "2026-05-10",
  },
];

export const ALL_TAGS = [
  ...new Set(ROADMAPS.flatMap((r) => r.tags)),
];

export function getRoadmap(id) {
  return ROADMAPS.find((r) => r.id === id) ?? null;
}
