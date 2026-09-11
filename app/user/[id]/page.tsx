"use client";

import { MouseEvent, use, useState, useEffect } from "react";
import Link from "next/link";
import { fetchRoadmapsByAuthor } from "../../lib/roadmaps-db";
import type { Roadmap } from "../../lib/types";
import {
  getLikedIds,
  getBookmarkedIds,
  toggleLike as persistLike,
  toggleBookmark as persistBookmark,
  idsToRecord,
} from "../../lib/likes";
import { BookmarkButton, DaysBadge, LikeButton, ViewCount } from "../../components/actions";

//[id]がparams.idに代入される
//params使う時のテンプレ
export default function UserPage({ params }:{params: Promise<{id: string}>}) {
  const { id: userId } = use(params);

  const [userRoadmaps, setUserRoadmaps] = useState<Roadmap[]>([]);

  useEffect(() => {
    async function loadRoadmaps() {
      try {
        setUserRoadmaps(await fetchRoadmapsByAuthor(userId));
      } catch (e) {
        console.error(e);
      }
    }
    loadRoadmaps();
  }, [userId]);

  //無ければ止めてundefinedになる
  const author = userRoadmaps[0]?.author ?? {
    id: userId,
    name: userId,
    initial: userId[0]?.toUpperCase() ?? "U",
  };


  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

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

  const toggleLike = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasLiked = !!liked[id];
    setLiked((prev) => ({ ...prev, [id]: !wasLiked }));
    setUserRoadmaps((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, likes: r.likes + (wasLiked ? -1 : 1) } : r
      )
    );

    const nowLiked = await persistLike(id, wasLiked);
    if (nowLiked === wasLiked) {
      setLiked((prev) => ({ ...prev, [id]: wasLiked }));
      setUserRoadmaps((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, likes: r.likes + (wasLiked ? 1 : -1) } : r
        )
      );
    }
  };
  const toggleBookmark = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasBookmarked = !!bookmarked[id];
    setBookmarked((prev) => ({ ...prev, [id]: !wasBookmarked }));

    const nowBookmarked = await persistBookmark(id, wasBookmarked);
    if (nowBookmarked === wasBookmarked) {
      setBookmarked((prev) => ({ ...prev, [id]: wasBookmarked }));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {/* Back */}
      <Link
        href="/"
        className="mb-8 block font-mono text-[12px] text-zinc-500 transition-colors hover:text-zinc-700"
      >
        ← 一覧に戻る
      </Link>

      {/* Profile */}
      <div className="mb-10 flex items-center gap-5 border-b border-zinc-200 pb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 font-mono text-[22px] font-bold text-zinc-700">
          {author.initial}
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">
            {author.name}
          </h1>
          <p className="mt-1 font-mono text-[12px] text-zinc-500">
            @{author.id}
          </p>
          <div className="mt-2 flex gap-4 text-[12px] text-zinc-500">
            <span>
              <span className="font-semibold text-zinc-600">{userRoadmaps.length}</span>
              {" "}投稿
            </span>
            <span>
              <span className="font-semibold text-zinc-600">
                {userRoadmaps.reduce((s, r) => s + r.likes, 0)}
              </span>
              {" "}いいね獲得
            </span>
          </div>
        </div>
      </div>

      {/* Roadmaps */}
      <section>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          投稿したロードマップ
        </p>

        {userRoadmaps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
            <p className="text-[15px] text-zinc-600">
              まだ投稿がありません。
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {userRoadmaps.map((roadmap) => (
              <li
                key={roadmap.id}
                className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300"
              >
                <Link href={`/roadmap/${roadmap.id}`} className="group block">
                  <h2 className="text-[18px] font-bold leading-snug tracking-tight text-zinc-900 group-hover:underline group-hover:underline-offset-4">
                    {roadmap.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-zinc-600">
                    {roadmap.description}
                  </p>
                </Link>

                {/* Tags */}
                {roadmap.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {roadmap.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/?tag=${tag}`}
                        className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                )}

                {/* Meta */}
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
      </section>
    </div>
  );
}
