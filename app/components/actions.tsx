"use client";

import type { MouseEvent } from "react";
import { BookmarkIcon, ClockIcon, EyeIcon, HeartIcon } from "./icons";

//4つのページで同じ見た目・同じ大きさにするための共通パーツ

const actionBase =
  "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] tabular-nums transition-colors";
const metaBase =
  "flex items-center gap-1.5 px-2 py-1.5 text-[13px] tabular-nums text-zinc-500 dark:text-zinc-500";

export function LikeButton({
  active,
  count,
  onClick,
}: {
  active: boolean;
  count: number;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "いいねを取り消す" : "いいねする"}
      className={[
        actionBase,
        active
          ? "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-rose-500 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-rose-400",
      ].join(" ")}
    >
      <HeartIcon filled={active} />
      <span>{count}</span>
    </button>
  );
}

export function BookmarkButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "保存を取り消す" : "保存する"}
      className={[
        actionBase,
        active
          ? "text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/40"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-amber-500 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-amber-400",
      ].join(" ")}
    >
      <BookmarkIcon filled={active} />
      <span>{active ? "保存済み" : "保存"}</span>
    </button>
  );
}

export function ViewCount({ views }: { views: number }) {
  return (
    <span className={metaBase} title={`${views} 回閲覧`}>
      <EyeIcon />
      <span>{views >= 1000 ? `${(views / 1000).toFixed(1)}k` : views}</span>
    </span>
  );
}

export function DaysBadge({ days }: { days: number }) {
  return (
    <span
      className="flex items-center gap-1.5 rounded-md border border-zinc-200 px-2 py-1 text-[12px] tabular-nums text-zinc-600 dark:border-zinc-800 dark:text-zinc-400"
      title="必須ノードの合計日数"
    >
      <ClockIcon className="h-3.5 w-3.5" />
      必須 {days}日
    </span>
  );
}
