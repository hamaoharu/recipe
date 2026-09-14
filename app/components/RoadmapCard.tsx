"use client";

import type { MouseEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Roadmap } from "../lib/types";
import { BookmarkButton, DaysBadge, LikeButton, ViewCount } from "./actions";
import ShareMenu from "./ShareMenu";

type RoadmapCardProps = {
  roadmap: Roadmap;
  liked: boolean;
  bookmarked: boolean;
  onLike: (e: MouseEvent<HTMLButtonElement>) => void;
  onBookmark: (e: MouseEvent<HTMLButtonElement>) => void;
  showAuthor?: boolean;
  activeTag?: string;
  onTagClick?: (tag: string) => void;
  footer?: ReactNode;
};

function isInteractive(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest("a, button, input, textarea, select, [role='dialog']"));
}

export default function RoadmapCard({
  roadmap,
  liked,
  bookmarked,
  onLike,
  onBookmark,
  showAuthor = true,
  activeTag,
  onTagClick,
  footer,
}: RoadmapCardProps) {
  const router = useRouter();

  return (
    <li
      className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
      onClick={(e) => {
        if (isInteractive(e.target)) return;
        router.push(`/roadmap/${roadmap.id}`);
      }}
    >
      {showAuthor && (
        <div className="mb-2.5 flex items-center gap-2">
          <Link
            href={`/user/${roadmap.author.id}`}
            className="flex items-center gap-2 rounded-md py-0.5 transition-opacity hover:opacity-70"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 font-mono text-[11px] font-bold text-zinc-600">
              {roadmap.author.initial}
            </span>
            <span className="text-[13px] text-zinc-600">{roadmap.author.name}</span>
          </Link>
          <span className="text-zinc-300">·</span>
          <span className="text-[13px] text-zinc-500">{roadmap.createdAt}</span>
        </div>
      )}

      <h2 className="text-[18px] font-bold leading-snug tracking-tight text-zinc-900">
        {roadmap.title}
      </h2>
      <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-zinc-600">
        {roadmap.description}
      </p>

      {roadmap.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {roadmap.tags.map((tag) =>
            onTagClick ? (
              <button
                key={tag}
                type="button"
                onClick={() => onTagClick(tag)}
                aria-pressed={activeTag === tag}
                className={[
                  "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors",
                  activeTag === tag
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
                ].join(" ")}
              >
                #{tag}
              </button>
            ) : (
              <Link
                key={tag}
                href={`/?tag=${encodeURIComponent(tag)}`}
                className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800"
              >
                #{tag}
              </Link>
            ),
          )}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-2">
        <LikeButton active={liked} count={roadmap.likes} onClick={onLike} />
        <BookmarkButton active={bookmarked} onClick={onBookmark} />
        <ShareMenu roadmapId={roadmap.id} title={roadmap.title} compact />
        <ViewCount views={roadmap.views} />
        <span className="ml-auto">
          <DaysBadge days={roadmap.totalDays} />
        </span>
      </div>

      {footer}
    </li>
  );
}
