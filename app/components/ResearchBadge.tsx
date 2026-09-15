function Stars({ value, className = "" }: { value: number; className?: string }) {
  const n = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <span
      className={`inline-flex tracking-[0.12em] ${className}`}
      aria-label={`信頼度 ${n} / 5`}
    >
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < n ? "text-zinc-800" : "text-zinc-300"}>
          ★
        </span>
      ))}
    </span>
  );
}

type ResearchBadgeProps = {
  sourceCount?: number | null;
  compact?: boolean;
};

export default function ResearchBadge({
  sourceCount,
  compact = false,
}: ResearchBadgeProps) {
  return (
    <div
      className={[
        "inline-flex flex-wrap items-center gap-x-2.5 gap-y-1 text-zinc-700",
        compact ? "text-[11px]" : "text-[12px]",
      ].join(" ")}
    >
      <span className="font-medium tracking-tight text-zinc-800">AI Research</span>
      {sourceCount != null && (
        <span className="font-mono tabular-nums text-zinc-500">
          {sourceCount} Sources
        </span>
      )}
    </div>
  );
}

export function ConfidenceStars({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return <Stars value={value} className={className} />;
}
