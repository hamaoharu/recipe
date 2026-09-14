import type { Metadata } from "next";
import type { ReactNode } from "react";
import { fetchPublicRoadmap } from "../../lib/roadmaps-public";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchPublicRoadmap(id);
  const title = data?.roadmap.title ?? "ロードマップ";
  const description =
    data?.roadmap.description || "recipe で公開されている学習ロードマップ";

  return {
    title: `${title} — recipe`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function RoadmapLayout({ children }: { children: ReactNode }) {
  return children;
}
