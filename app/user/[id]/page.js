"use client";

import { use, useState } from "react";
import Link from "next/link";
import { ROADMAPS } from "../../lib/roadmaps";

export default function UserPage({ params }) {
  const { id: userId } = use(params);

  // Gather user info from roadmap data
  const userRoadmaps = ROADMAPS.filter((r) => r.author.id === userId);
  const author = userRoadmaps[0]?.author ?? {
    id: userId,
    name: userId,
    initial: userId[0]?.toUpperCase() ?? "U",
  };

  const [liked, setLiked] = useState({});
  const [bookmarked, setBookmarked] = useState({});

  const toggleLike = (e, id) => {
    e.preventDefault();
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleBookmark = (e, id) => {
    e.preventDefault();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      {/* Back */}
      <Link
        href="/"
        className="mb-8 block font-mono text-[12px] text-zinc-500 dark:text-zinc-600 transition-colors hover:text-zinc-700 dark:hover:text-zinc-300"
      >
        ← 一覧に戻る
      </Link>

      {/* Profile */}
      <div className="mb-10 flex items-center gap-5 border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[22px] font-bold text-zinc-700 dark:text-zinc-300">
          {author.initial}
        </div>
        <div>
          <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            {author.name}
          </h1>
          <p className="mt-1 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
            @{author.id}
          </p>
          <div className="mt-2 flex gap-4 text-[12px] text-zinc-500 dark:text-zinc-600">
            <span>
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">{userRoadmaps.length}</span>
              {" "}投稿
            </span>
            <span>
              <span className="font-semibold text-zinc-600 dark:text-zinc-400">
                {userRoadmaps.reduce((s, r) => s + r.likes, 0)}
              </span>
              {" "}いいね獲得
            </span>
          </div>
        </div>
      </div>

      {/* Roadmaps */}
      <section>
        <p className="mb-4 font-mono text-[11px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          投稿したロードマップ
        </p>

        {userRoadmaps.length === 0 ? (
          <p className="py-12 text-center text-[14px] text-zinc-500 dark:text-zinc-600">
            まだ投稿がありません。
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {userRoadmaps.map((roadmap) => (
              <li key={roadmap.id} className="py-5">
                <Link href={`/roadmap/${roadmap.id}`} className="group block">
                  <h2 className="text-[16px] font-bold leading-snug tracking-tight text-zinc-900 dark:text-zinc-100 group-hover:text-black dark:group-hover:text-white">
                    {roadmap.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                    {roadmap.description}
                  </p>
                </Link>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {roadmap.tags.map((tag) => (
                    <Link
                      key={tag}
                      href={`/?tag=${tag}`}
                      className="rounded-sm border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-600 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>

                {/* Meta */}
                <div className="mt-3 flex items-center gap-4 text-[12px] text-zinc-500 dark:text-zinc-600">
                  <button
                    type="button"
                    onClick={(e) => toggleLike(e, roadmap.id)}
                    className={[
                      "flex items-center gap-1 transition-colors",
                      liked[roadmap.id] ? "text-zinc-700 dark:text-zinc-300" : "hover:text-zinc-600 dark:hover:text-zinc-400",
                    ].join(" ")}
                  >
                    <span>{liked[roadmap.id] ? "♥" : "♡"}</span>
                    <span>{roadmap.likes + (liked[roadmap.id] ? 1 : 0)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => toggleBookmark(e, roadmap.id)}
                    className={[
                      "flex items-center gap-1 transition-colors",
                      bookmarked[roadmap.id] ? "text-zinc-700 dark:text-zinc-300" : "hover:text-zinc-600 dark:hover:text-zinc-400",
                    ].join(" ")}
                  >
                    <span>{bookmarked[roadmap.id] ? "★" : "☆"}</span>
                  </button>

                  <span className="flex items-center gap-1">
                    <span>👁</span>
                    <span>
                      {roadmap.views >= 1000
                        ? `${(roadmap.views / 1000).toFixed(1)}k`
                        : roadmap.views}
                    </span>
                  </span>
                  <span className="ml-auto font-mono text-[11px] text-zinc-500 dark:text-zinc-700">
                    必須 {roadmap.totalDays}日 · {roadmap.createdAt}
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
