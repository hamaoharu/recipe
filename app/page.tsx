"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import type { MouseEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Roadmap } from "./lib/types";
import {
  getLikedIds,
  getBookmarkedIds,
  toggleLike as persistLike,
  toggleBookmark as persistBookmark,
  idsToRecord,
} from "./lib/likes";
import { fetchRoadmaps } from "./lib/roadmaps-db";
import { BookmarkButton, DaysBadge, LikeButton, ViewCount } from "./components/actions";

//文字列である"new"か"trend"のどちらかしか入らない型を定義
type SortMode = "new" | "trend";

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag") ?? "";

  //setSortの引数に入るのは"new"か"trend"のどちらかにしている
  //stateはジェネリクスを使って型を指定
  const [sort, setSort] = useState<SortMode>("new");

  //キーがstringで値がbooleanのオブジェクトを定義する組込みの型Record
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        setRoadmaps(await fetchRoadmaps());
      } catch (e) {
        console.error(e);
      }
    }
    loadRoadmaps();
  }, []);

  useEffect(() => {
    async function loadSocial() {
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedIds(),
        getBookmarkedIds(),
      ]);
      setLiked(idsToRecord(likedIds));
      setBookmarked(idsToRecord(bookmarkedIds));
    }
    loadSocial();
  }, []);

  const allRoadmaps = roadmaps;

  const allTags = useMemo(
    () => [...new Set(allRoadmaps.flatMap((r) => r.tags ?? []))],
    [allRoadmaps]
  );

  const toggleLike = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasLiked = !!liked[id];

    //先に画面を更新して、失敗したら元に戻す
    setLiked((prev) => ({ ...prev, [id]: !wasLiked }));
    setRoadmaps((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, likes: r.likes + (wasLiked ? -1 : 1) } : r
      )
    );

    const nowLiked = await persistLike(id, wasLiked);
    if (nowLiked === wasLiked) {
      setLiked((prev) => ({ ...prev, [id]: wasLiked }));
      setRoadmaps((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, likes: r.likes + (wasLiked ? 1 : -1) } : r
        )
      );
      if (!wasLiked) router.push("/login?next=/");
    }
  };

  //イベントオブジェクトには型定義
  const toggleBookmark = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasBookmarked = !!bookmarked[id];
    setBookmarked((prev) => ({ ...prev, [id]: !wasBookmarked }));

    const nowBookmarked = await persistBookmark(id, wasBookmarked);
    if (nowBookmarked === wasBookmarked) {
      setBookmarked((prev) => ({ ...prev, [id]: wasBookmarked }));
      if (!wasBookmarked) router.push("/login?next=/");
    }
  };

  const filtered = useMemo(() => {
  
    //型が推論できる
    let list = [...allRoadmaps];

    if (q) {
      const lower = q.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.description.toLowerCase().includes(lower) ||
          (r.tags ?? []).some((t) => t.toLowerCase().includes(lower))
      );
    }

    if (tagFilter) {
      list = list.filter((r) => (r.tags ?? []).includes(tagFilter));
    }

    if (sort === "trend") {
      list.sort((a, b) => b.likes - a.likes);
    } else {
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return list;
  }, [allRoadmaps, q, tagFilter, sort]);

  const handleTagClick = (tag: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tag") === tag) {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-8">
      <main className="min-w-0 flex-1">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
          <div className="flex gap-1 rounded-lg bg-zinc-100 p-1">
            {(
              [
                { value: "new", label: "新着" },
                { value: "trend", label: "トレンド" },

                //as constはvalueの型がstringになることを防ぐ SortModeとは無関係
              ] as const
            ).map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSort(tab.value)}
                aria-pressed={sort === tab.value}
                className={[
                  "rounded-md px-4 py-2 text-[14px] transition-colors",
                  sort === tab.value
                    ? "bg-white font-medium text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="font-mono text-[12px] text-zinc-500">
            {filtered.length} 件
            {q && (
              <span className="ml-2 text-zinc-500">
                「{q}」の検索結果
              </span>
            )}
            {tagFilter && (
              <span className="ml-2 text-zinc-500">#{tagFilter}</span>
            )}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-[15px] text-zinc-600">
              ロードマップが見つかりませんでした。
            </p>
            <p className="mt-1.5 text-[13px] text-zinc-500">
              検索条件を変えるか、最初の1件を投稿してみてください。
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((roadmap) => (
              <li
                key={roadmap.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
              >
                <div className="mb-2.5 flex items-center gap-2">
                  <Link
                    href={`/user/${roadmap.author.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 rounded-md py-0.5 transition-opacity hover:opacity-70"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 font-mono text-[11px] font-bold text-zinc-600">
                      {roadmap.author.initial}
                    </span>
                    <span className="text-[13px] text-zinc-600">
                      {roadmap.author.name}
                    </span>
                  </Link>
                  <span className="text-zinc-300">·</span>
                  <span className="text-[13px] text-zinc-500">
                    {roadmap.createdAt}
                  </span>
                </div>

                <Link href={`/roadmap/${roadmap.id}`} className="group block">
                  <h2 className="text-[18px] font-bold leading-snug tracking-tight text-zinc-900 group-hover:underline group-hover:underline-offset-4">
                    {roadmap.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-zinc-600">
                    {roadmap.description}
                  </p>
                </Link>

                {roadmap.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {roadmap.tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleTagClick(tag);
                        }}
                        aria-pressed={tagFilter === tag}
                        className={[
                          "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors",
                          tagFilter === tag
                            ? "border-zinc-800 bg-zinc-900 text-white"
                            : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
                        ].join(" ")}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-2">
                  <LikeButton
                    active={!!liked[roadmap.id]}
                    count={roadmap.likes}
                    onClick={(e) => toggleLike(e, roadmap.id)}
                  />
                  <BookmarkButton
                    active={!!bookmarked[roadmap.id]}
                    onClick={(e) => toggleBookmark(e, roadmap.id)}
                  />
                  <ViewCount views={roadmap.views} />
                  <span className="ml-auto">
                    <DaysBadge days={roadmap.totalDays} />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <aside className="hidden w-60 shrink-0 lg:block">
        <section className="rounded-xl border border-zinc-200 p-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            タグで絞り込む
          </p>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                aria-pressed={tagFilter === tag}
                className={[
                  "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors",
                  tagFilter === tag
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
                ].join(" ")}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-zinc-200 p-4">
          <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            急上昇
          </p>
          <ul className="space-y-1">
            {[...allRoadmaps]
              .sort((a, b) => b.views - a.views)
              .slice(0, 4)
              .map((r, i) => (
                <li key={r.id}>
                  <Link
                    href={`/roadmap/${r.id}`}
                    className="group flex items-start gap-2.5 rounded-md px-2 py-2 transition-colors hover:bg-zinc-100"
                  >
                    <span className="mt-px shrink-0 font-mono text-[12px] text-zinc-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-snug text-zinc-600 group-hover:text-zinc-900">
                      {r.title}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      </aside>
    </div>
  );
}

export default function TopPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
