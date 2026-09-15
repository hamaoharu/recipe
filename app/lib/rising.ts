import type { Roadmap } from "./types";

function ageDays(createdAt: string): number {
  const t = Date.parse(
    createdAt.length <= 10 ? `${createdAt}T00:00:00Z` : createdAt,
  );
  if (Number.isNaN(t)) return 0;
  return Math.max(0, (Date.now() - t) / 86_400_000);
}

/** いいねを厚く見た反応数を、経過日数で減衰させる。累計人気ではなく直近の伸び用。 */
export function risingScore(roadmap: Pick<Roadmap, "likes" | "views" | "createdAt">): number {
  const points = Math.max(0, roadmap.likes) * 3 + Math.max(0, roadmap.views);
  return points / (ageDays(roadmap.createdAt) + 1) ** 1.5;
}

export function compareRising(a: Roadmap, b: Roadmap): number {
  const byScore = risingScore(b) - risingScore(a);
  if (byScore !== 0) return byScore;
  const byDate = b.createdAt.localeCompare(a.createdAt);
  if (byDate !== 0) return byDate;
  if (b.likes !== a.likes) return b.likes - a.likes;
  if (b.views !== a.views) return b.views - a.views;
  return a.id.localeCompare(b.id);
}
