import type { ReactNode } from "react";
import type { Roadmap } from "../lib/types";
import ResearchBadge, { ConfidenceStars } from "./ResearchBadge";

function MetaItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <div className="mt-1 break-words text-[14px] font-medium leading-snug text-zinc-800">
        {value}
      </div>
    </div>
  );
}

export default function ResearchPanel({ roadmap }: { roadmap: Roadmap }) {
  const patterns = roadmap.commonPatterns ?? [];
  const hasDetails = Boolean(roadmap.researchSummary) || patterns.length > 0;

  const metaItems: { label: string; value: ReactNode }[] = [
    roadmap.targetUser ? { label: "対象", value: roadmap.targetUser } : null,
    roadmap.goal ? { label: "ゴール", value: roadmap.goal } : null,
    roadmap.confidence != null
      ? {
          label: "信頼度",
          value: <ConfidenceStars value={roadmap.confidence} />,
        }
      : null,
    roadmap.sourceCount != null
      ? { label: "調査ソース", value: `${roadmap.sourceCount}件` }
      : null,
  ].flatMap((item) => (item ? [item] : []));

  return (
    <section className="rounded-xl border border-zinc-200 p-4 sm:p-5">
      <ResearchBadge sourceCount={roadmap.sourceCount} />

      {metaItems.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
          {metaItems.map((item) => (
            <MetaItem key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      )}

      {hasDetails && (
        <details open className="group mt-5 border-t border-zinc-200 pt-4">
          <summary className="cursor-pointer list-none text-[13px] text-zinc-600 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-1.5 hover:text-zinc-900">
              <span className="font-mono text-[11px] text-zinc-400 transition-transform group-open:rotate-90">
                ▸
              </span>
              信頼度について
            </span>
          </summary>

          {roadmap.researchSummary && (
            <div className="mt-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                要約
              </p>
              <p className="mt-2 whitespace-pre-wrap break-words text-[14px] leading-[1.85] text-zinc-600">
                {roadmap.researchSummary}
              </p>
            </div>
          )}

          {patterns.length > 0 && (
            <div className="mt-5">
              <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                共通パターン
              </p>
              <ul className="mt-2 space-y-1.5">
                {patterns.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3 text-[13px]">
                    <span className="text-zinc-700">{item.label}</span>
                    <span className="font-mono tabular-nums text-zinc-500">{item.rate}%</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </details>
      )}
    </section>
  );
}
