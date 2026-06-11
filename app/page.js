"use client";

import { Suspense, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ROADMAPS, ALL_TAGS } from "./lib/roadmaps";


function FeedContent() {
  //機能に特化したオブジェクトを返す
  const router = useRouter();
  const searchParams = useSearchParams();

  //検索ワードを取得
  //再レンダーされるたびに実行される
  const q = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag") ?? "";

  //state管理
  const [sort, setSort] = useState("new");
  const [liked, setLiked] = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [userRoadmaps, setUserRoadmaps] = useState([]);

  //ローカルストレージからuser_roadmapsを取得
  //ローカルストレージは文字列保存のためjsに戻す作業が必要
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("user_roadmaps") ?? "[]");
      setUserRoadmaps(saved);
    } catch {}
  }, []);

  //自分のデータとサンプルデータを一つの配列に格納するためにスプレッド
  //自分のロードマップが更新された時のみ実行される
  const allRoadmaps = useMemo(() => [...userRoadmaps, ...ROADMAPS], [userRoadmaps]);

  //全てのロードマップのタグを取得し、配列を平らにする。重複するものを消す(new set)。そして配列に戻す。
  const allTags = useMemo(
    () => [...new Set(allRoadmaps.flatMap((r) => r.tags ?? []))],
    [allRoadmaps]
  );

  //ブックマークを切り替える
  //set関数はprevを受けとり、prevの値を更新して返す
  const toggleBookmark = (e, id) => {
    e.preventDefault();
    setBookmarked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  //フィルタリングされたロードマップを返す
  const filtered = useMemo(() => {
    //allRoadmapsをコピー
    let list = [...allRoadmaps];

    if (q) {
      const lower = q.toLowerCase();

      //filterは条件がtrueのrを配列に格納して返す
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(lower) ||
          r.description.toLowerCase().includes(lower) ||

          //tags配列の要素にqが含まれているかどうかを確認してbooleanを返す
          //filterはbooleanを待っているのでsomeを使用
          (r.tags ?? []).some((t) => t.toLowerCase().includes(lower))
      );
    }
    
    //tagによるフィルタリング
    if (tagFilter) {
      list = list.filter((r) => (r.tags ?? []).includes(tagFilter));
    }

    if (sort === "trend") {
      list.sort((a, b) => b.likes - a.likes);
    } else {

      //Dateオブジェクトを作成して比較
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return list;
  }, [allRoadmaps, q, tagFilter, sort]);

  const handleTagClick = (tag) => {

    //URLSearchParamsはURLのクエリを読み書きするインスタンス
    //q,tagをキー値ペアで保存する
    const params = new URLSearchParams(searchParams.toString());
    if (params.get("tag") === tag) {
      params.delete("tag");
    } else {
      params.set("tag", tag);
    }
    const query = params.toString();
    router.push(query ? `/?${query}` : "/");
  };

  //いいねを切り替える
  const toggleLike = (e, id) => {
    e.preventDefault();
    setLiked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="mx-auto flex w-full max-w-5xl gap-10 px-6 py-8">
      {/* ── Feed ── */}
      <main className="min-w-0 flex-1">
        {/* Sort tabs + result info */}
        <div className="mb-5 flex items-center justify-between border-b border-zinc-200 pb-3 dark:border-zinc-800">
          <div className="flex gap-0">
            {[
              { value: "new", label: "新着" },
              { value: "trend", label: "トレンド" },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSort(tab.value)}
                className={[
                  "px-4 py-1.5 text-[13px] transition-colors",
                  sort === tab.value
                    ? "border-b-2 border-zinc-800 font-medium text-zinc-900 dark:border-zinc-300 dark:text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-700">
            {filtered.length} 件
            {q && (
              <span className="ml-2 text-zinc-500 dark:text-zinc-600">
                「{q}」の検索結果
              </span>
            )}
            {tagFilter && (
              <span className="ml-2 text-zinc-500 dark:text-zinc-600">#{tagFilter}</span>
            )}
          </p>
        </div>

        {/* Card list */}
        {filtered.length === 0 ? (
          <p className="py-16 text-center text-[14px] text-zinc-500 dark:text-zinc-600">
            ロードマップが見つかりませんでした。
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-900">
            {filtered.map((roadmap) => (
              <li key={roadmap.id} className="py-5">
                {/* Author + date */}
                <div className="mb-2 flex items-center gap-2">
                  <Link
                    href={`/user/${roadmap.author.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 transition-opacity hover:opacity-70"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 font-mono text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {roadmap.author.initial}
                    </span>
                    <span className="text-[12px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
                      {roadmap.author.name}
                    </span>
                  </Link>
                  <span className="text-[12px] text-zinc-300 dark:text-zinc-800">·</span>
                  <span className="text-[12px] text-zinc-500 dark:text-zinc-700">
                    {roadmap.createdAt}
                  </span>
                </div>

                {/* Title + description */}
                <Link href={`/roadmap/${roadmap.id}`} className="group block">
                  <h2 className="text-[16px] font-bold leading-snug tracking-tight text-zinc-900 group-hover:text-black dark:text-zinc-100 dark:group-hover:text-white">
                    {roadmap.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-zinc-500">
                    {roadmap.description}
                  </p>
                </Link>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {roadmap.tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(e) => { e.preventDefault(); handleTagClick(tag); }}
                      className={[
                        "rounded-sm border px-1.5 py-0.5 font-mono text-[11px] transition-colors",
                        tagFilter === tag
                          ? "border-zinc-600 text-zinc-800 dark:border-zinc-400 dark:text-zinc-300"
                          : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-600 dark:hover:border-zinc-600 dark:hover:text-zinc-400",
                      ].join(" ")}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>

                {/* Meta: like / bookmark / views / days */}
                <div className="mt-3 flex items-center gap-4 text-[12px] text-zinc-500 dark:text-zinc-600">
                  <button
                    type="button"
                    onClick={(e) => toggleLike(e, roadmap.id)}
                    className={[
                      "flex items-center gap-1 transition-colors",
                      liked[roadmap.id] ? "text-zinc-800 dark:text-zinc-300" : "hover:text-zinc-700 dark:hover:text-zinc-400",
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
                      bookmarked[roadmap.id] ? "text-zinc-800 dark:text-zinc-300" : "hover:text-zinc-700 dark:hover:text-zinc-400",
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
                  <span className="ml-auto font-mono text-zinc-500 dark:text-zinc-700">
                    必須 {roadmap.totalDays}日
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* ── Sidebar ── */}
      <aside className="hidden w-56 shrink-0 lg:block">
        {/* Tag list */}
        <section>
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
            タグで絞り込む
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleTagClick(tag)}
                className={[
                  "rounded-sm border px-2 py-1 font-mono text-[11px] transition-colors",
                  tagFilter === tag
                    ? "border-zinc-600 text-zinc-800 dark:border-zinc-400 dark:text-zinc-300"
                    : "border-zinc-300 text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-600 dark:hover:border-zinc-600 dark:hover:text-zinc-400",
                ].join(" ")}
              >
                #{tag}
              </button>
            ))}
          </div>
        </section>

        {/* Trending */}
        <section className="mt-8">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
            急上昇
          </p>
          <ul className="space-y-3">
            {[...allRoadmaps]
              .sort((a, b) => b.views - a.views)
              .slice(0, 4)
              .map((r, i) => (
                <li key={r.id}>
                  <Link
                    href={`/roadmap/${r.id}`}
                    className="group flex items-start gap-2.5"
                  >
                    <span className="mt-px shrink-0 font-mono text-[11px] text-zinc-500 dark:text-zinc-700">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[13px] leading-snug text-zinc-600 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-zinc-200">
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

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TopPage() {
  return (
    <Suspense>
      <FeedContent />
    </Suspense>
  );
}
