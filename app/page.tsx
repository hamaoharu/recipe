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
import RoadmapCard from "./components/RoadmapCard";

//文字列である"new"か"trend"のどちらかしか入らない型を定義
type SortMode = "new" | "trend";

const PAGE_SIZE = 10;

function pageItems(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = new Set([1, total, current - 1, current, current + 1]);
  const nums = [...wanted].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items: (number | "ellipsis")[] = [];
  for (let i = 0; i < nums.length; i++) {
    if (i > 0 && nums[i] - nums[i - 1] > 1) items.push("ellipsis");
    items.push(nums[i]);
  }
  return items;
}

function FeedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag") ?? "";
  const researchFilter = searchParams.get("research") === "ai";
  const requestedPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

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

    if (researchFilter) {
      list = list.filter((r) => r.isAiResearch);
    }

    if (sort === "trend") {
      list.sort((a, b) => {
        if (a.isAiResearch !== b.isAiResearch) return a.isAiResearch ? -1 : 1;
        return b.likes - a.likes;
      });
    } else {
      list.sort((a, b) => {
        if (a.isAiResearch !== b.isAiResearch) return a.isAiResearch ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    return list;
  }, [allRoadmaps, q, tagFilter, researchFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pushQuery = (mutate: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutate(params);
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  const handleResearchClick = () => {
    pushQuery((params) => {
      if (params.get("research") === "ai") params.delete("research");
      else params.set("research", "ai");
      params.delete("page");
    });
  };

  const handleTagClick = (tag: string) => {
    pushQuery((params) => {
      if (params.get("tag") === tag) params.delete("tag");
      else params.set("tag", tag);
      params.delete("page");
    });
  };

  const handleSort = (value: SortMode) => {
    setSort(value);
    if (requestedPage > 1) {
      pushQuery((params) => {
        params.delete("page");
      });
    }
  };

  const handlePage = (next: number) => {
    pushQuery((params) => {
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-4 py-8 sm:px-6">
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
                onClick={() => handleSort(tab.value)}
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
            {filtered.length > 0 && totalPages > 1 && (
              <span className="ml-2 text-zinc-400">
                {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)}
              </span>
            )}
            {q && (
              <span className="ml-2 text-zinc-500">
                「{q}」の検索結果
              </span>
            )}
            {researchFilter && (
              <span className="ml-2 text-zinc-500">AI Research</span>
            )}
            {tagFilter && (
              <span className="ml-2 text-zinc-500">#{tagFilter}</span>
            )}
          </p>
        </div>

        <div className="mb-4 flex max-h-28 flex-wrap gap-2 overflow-y-auto lg:hidden">
            <button
              type="button"
              onClick={handleResearchClick}
              aria-pressed={researchFilter}
              className={[
                "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors",
                researchFilter
                  ? "border-zinc-800 bg-zinc-900 text-white"
                  : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
              ].join(" ")}
            >
              AI Research
            </button>
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
            {paged.map((roadmap) => (
              <RoadmapCard
                key={roadmap.id}
                roadmap={roadmap}
                liked={!!liked[roadmap.id]}
                bookmarked={!!bookmarked[roadmap.id]}
                onLike={(e) => toggleLike(e, roadmap.id)}
                onBookmark={(e) => toggleBookmark(e, roadmap.id)}
                activeTag={tagFilter}
                onTagClick={handleTagClick}
              />
            ))}
          </ul>
        )}

        {filtered.length > 0 && totalPages > 1 && (
          <nav
            aria-label="ページ"
            className="mt-8 flex flex-wrap items-center justify-center gap-1"
          >
            <button
              type="button"
              onClick={() => handlePage(page - 1)}
              disabled={page <= 1}
              className="rounded-md px-3 py-2 text-[13px] text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
            >
              前へ
            </button>
            {pageItems(page, totalPages).map((item, i) =>
              item === "ellipsis" ? (
                <span key={`e-${i}`} className="px-2 font-mono text-[13px] text-zinc-400">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => handlePage(item)}
                  aria-current={item === page ? "page" : undefined}
                  className={[
                    "min-w-9 rounded-md px-3 py-2 font-mono text-[13px]",
                    item === page
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-600 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  {item}
                </button>
              ),
            )}
            <button
              type="button"
              onClick={() => handlePage(page + 1)}
              disabled={page >= totalPages}
              className="rounded-md px-3 py-2 text-[13px] text-zinc-600 hover:bg-zinc-100 disabled:text-zinc-300 disabled:hover:bg-transparent"
            >
              次へ
            </button>
          </nav>
        )}
      </main>

      <aside className="hidden w-60 shrink-0 lg:block">
        <div className="space-y-4">
          <section className="rounded-xl border border-zinc-200 p-4">
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

          <section className="rounded-xl border border-zinc-200 p-4">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              タグで絞り込む
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleResearchClick}
                aria-pressed={researchFilter}
                className={[
                  "rounded-md border px-2.5 py-1 font-mono text-[12px] transition-colors",
                  researchFilter
                    ? "border-zinc-800 bg-zinc-900 text-white"
                    : "border-zinc-200 text-zinc-500 hover:border-zinc-400 hover:text-zinc-800",
                ].join(" ")}
              >
                AI Research
              </button>
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
        </div>
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
