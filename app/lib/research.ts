import type { SourceBreakdown } from "./types";

export const SOURCE_BREAKDOWN_LABELS: Record<keyof SourceBreakdown, string> = {
  achieverBlogs: "達成者ブログ",
  expertArticles: "専門家記事",
  official: "公式情報",
  educationMedia: "教育メディア",
  youtube: "YouTube",
  reddit: "Reddit",
};

export function breakdownEntries(breakdown: SourceBreakdown | null | undefined) {
  if (!breakdown) return [];
  return (Object.keys(SOURCE_BREAKDOWN_LABELS) as (keyof SourceBreakdown)[])
    .map((key) => ({
      key,
      label: SOURCE_BREAKDOWN_LABELS[key],
      count: breakdown[key] ?? 0,
    }))
    .filter((item) => item.count > 0);
}

export function supportRateCopy(raw: string | null | undefined) {
  if (!raw) return null;
  const fraction = raw.match(/(\d+)\s*\/\s*(\d+)/);
  const percent = raw.match(/(\d+)\s*%/);
  return {
    percent: percent ? `${percent[1]}%` : raw,
    detail: fraction ? `${fraction[2]}件中${fraction[1]}件が推奨` : null,
  };
}
