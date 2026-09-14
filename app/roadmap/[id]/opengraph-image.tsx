import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { fetchPublicRoadmap } from "../../lib/roadmaps-public";

export const alt = "recipe のロードマップ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadJpFont(): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(
      "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-jp@5.2.5/japanese-700-normal.woff",
    );
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await fetchPublicRoadmap(id);
  const font = await loadJpFont();

  const title = data?.roadmap.title ?? "Roadmap";
  const groups = (data?.groups ?? []).slice(0, 5);
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: "56px 64px 48px",
          fontFamily: font ? "Noto Sans JP" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src={logoSrc} alt="" width={44} height={44} style={{ borderRadius: 10 }} />
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 48,
            fontWeight: 700,
            color: "#18181b",
            lineHeight: 1.2,
          }}
        >
          {title.length > 40 ? `${title.slice(0, 40)}…` : title}
        </div>
        <div
          style={{
            marginTop: 36,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            flex: 1,
          }}
        >
          {groups.map((group) => (
            <div key={group.id} style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {group.nodes.slice(0, 6).map((node) => (
                <div
                  key={node.id}
                  style={{
                    display: "flex",
                    border: node.required ? "2px solid #3f3f46" : "2px dashed #a1a1aa",
                    borderRadius: 8,
                    padding: "8px 14px",
                    fontSize: 20,
                    color: "#3f3f46",
                  }}
                >
                  {node.label.length > 16 ? `${node.label.slice(0, 16)}…` : node.label}
                </div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#71717a", fontSize: 22 }}>
          <span>学習ロードマップ</span>
          <span>recipe で見る</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [
            {
              name: "Noto Sans JP",
              data: font,
              style: "normal",
              weight: 700,
            },
          ]
        : [],
    },
  );
}
