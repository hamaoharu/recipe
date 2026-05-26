"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROADMAPS } from "../lib/roadmaps";

const TABS = [
  { id: "posts",     label: "投稿" },
  { id: "likes",     label: "いいね" },
  { id: "bookmarks", label: "保存" },
];

const MOCK_LIKED_IDS      = ["nextjs-fullstack", "python-data"];
const MOCK_BOOKMARKED_IDS = ["frontend", "devops"];

export default function MyPage() {
  const router = useRouter();
  const [user, setUser]       = useState(null);
  const [tab, setTab]         = useState("posts");
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [liked, setLiked]         = useState({});
  const [bookmarked, setBookmarked] = useState({});
  const [userRoadmaps, setUserRoadmaps] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // roadmap id awaiting confirm

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recipe_user");
      if (!saved) { router.push("/"); return; }
      const u = JSON.parse(saved);
      setUser(u);
      setNameInput(u.name);
    } catch {
      router.push("/");
    }
  }, [router]);

  // Load user-created roadmaps from localStorage
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("user_roadmaps") ?? "[]");
      setUserRoadmaps(saved);
    } catch {}
  }, []);

  if (!user) return null;

  // Roadmap lists per tab
  // "投稿" = user-created (localStorage) only
  const myRoadmaps         = userRoadmaps;
  const likedRoadmaps      = ROADMAPS.filter((r) => MOCK_LIKED_IDS.includes(r.id));
  const bookmarkedRoadmaps = ROADMAPS.filter((r) => MOCK_BOOKMARKED_IDS.includes(r.id));

  const tabRoadmaps = {
    posts:     myRoadmaps,
    likes:     likedRoadmaps,
    bookmarks: bookmarkedRoadmaps,
  }[tab];

  const totalLikes = myRoadmaps.reduce((s, r) => s + (r.likes ?? 0), 0);

  // Delete a user-created roadmap
  const deleteRoadmap = (id) => {
    const updated = userRoadmaps.filter((r) => r.id !== id);
    setUserRoadmaps(updated);
    localStorage.setItem("user_roadmaps", JSON.stringify(updated));
    setDeleteConfirm(null);
  };

  const saveName = () => {
    if (!nameInput.trim()) return;
    const updated = { ...user, name: nameInput.trim() };
    localStorage.setItem("recipe_user", JSON.stringify(updated));
    setUser(updated);
    setEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("recipe_user");
    router.push("/");
  };

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

      {/* Profile card */}
      <div className="mb-8 flex items-start justify-between border-b border-zinc-800 pb-8">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-800 font-mono text-[22px] font-bold text-zinc-300">
            {user.initial}
          </div>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  className="rounded-sm border border-zinc-600 bg-zinc-900 px-2 py-1 text-[15px] text-zinc-100 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="text-[13px] text-zinc-400 hover:text-zinc-100"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-[13px] text-zinc-700 hover:text-zinc-400"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-tight text-zinc-100">
                  {user.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="text-[12px] text-zinc-700 transition-colors hover:text-zinc-400"
                >
                  編集
                </button>
              </div>
            )}
            <p className="mt-0.5 font-mono text-[12px] text-zinc-600">@{user.id}</p>
            <div className="mt-2 flex gap-5 text-[12px] text-zinc-600">
              <span>
                <span className="font-semibold text-zinc-400">{myRoadmaps.length}</span>
                {" "}投稿
              </span>
              <span>
                <span className="font-semibold text-zinc-400">{totalLikes}</span>
                {" "}いいね獲得
              </span>
              <span>
                <span className="font-semibold text-zinc-400">{MOCK_LIKED_IDS.length}</span>
                {" "}いいね
              </span>
              <span>
                <span className="font-semibold text-zinc-400">{MOCK_BOOKMARKED_IDS.length}</span>
                {" "}保存
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="text-[12px] text-zinc-700 transition-colors hover:text-zinc-400"
        >
          ログアウト
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex border-b border-zinc-800">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={[
              "px-5 py-2 text-[13px] transition-colors",
              tab === t.id
                ? "border-b-2 border-zinc-300 font-medium text-zinc-100"
                : "text-zinc-500 hover:text-zinc-300",
            ].join(" ")}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[11px] text-zinc-700">
              {t.id === "posts"     ? myRoadmaps.length
               : t.id === "likes"  ? likedRoadmaps.length
               : bookmarkedRoadmaps.length}
            </span>
          </button>
        ))}
      </div>

      {/* Roadmap list */}
      {tabRoadmaps.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-[14px] text-zinc-600">
            {tab === "posts"     && "まだ投稿がありません。"}
            {tab === "likes"     && "まだいいねした投稿がありません。"}
            {tab === "bookmarks" && "まだ保存した投稿がありません。"}
          </p>
          {tab === "posts" && (
            <Link
              href="/roadmap/new"
              className="mt-4 inline-block rounded-sm bg-zinc-100 px-4 py-2 text-[13px] font-medium text-zinc-900 hover:bg-white"
            >
              投稿する
            </Link>
          )}
        </div>
      ) : (
        <ul className="divide-y divide-zinc-900">
          {tabRoadmaps.map((roadmap) => (
            <li key={roadmap.id} className="py-5">
              {/* Author */}
              <div className="mb-2 flex items-center gap-2">
                <Link
                  href={`/user/${roadmap.author.id}`}
                  className="flex items-center gap-2 transition-opacity hover:opacity-70"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 font-mono text-[10px] font-bold text-zinc-400">
                    {roadmap.author.initial}
                  </span>
                  <span className="text-[12px] text-zinc-500 hover:text-zinc-300">
                    {roadmap.author.name}
                  </span>
                </Link>
                <span className="text-[12px] text-zinc-800">·</span>
                <span className="text-[12px] text-zinc-700">{roadmap.createdAt}</span>
              </div>

              {/* Title + description */}
              <Link href={`/roadmap/${roadmap.id}`} className="group block">
                <h2 className="text-[16px] font-bold leading-snug tracking-tight text-zinc-100 group-hover:text-white">
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
                    className="rounded-sm border border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-600 transition-colors hover:border-zinc-600 hover:text-zinc-400"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>

              {/* Meta */}
              <div className="mt-3 flex items-center gap-4 text-[12px] text-zinc-600">
                <button
                  type="button"
                  onClick={(e) => toggleLike(e, roadmap.id)}
                  className={[
                    "flex items-center gap-1 transition-colors",
                    liked[roadmap.id] ? "text-zinc-300" : "hover:text-zinc-400",
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
                    bookmarked[roadmap.id] ? "text-zinc-300" : "hover:text-zinc-400",
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
                <span className="ml-auto font-mono text-[11px] text-zinc-700">
                  必須 {roadmap.totalDays}日
                </span>
              </div>

              {/* Delete for own posts */}
              {tab === "posts" && (
                <div className="mt-3 flex items-center gap-4">
                  {deleteConfirm === roadmap.id ? (
                    <>
                      <span className="text-[12px] text-zinc-500">本当に削除しますか？</span>
                      <button
                        type="button"
                        onClick={() => deleteRoadmap(roadmap.id)}
                        className="text-[12px] text-red-600 transition-colors hover:text-red-400"
                      >
                        削除する
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="text-[12px] text-zinc-700 transition-colors hover:text-zinc-400"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(roadmap.id)}
                      className="text-[12px] text-zinc-700 transition-colors hover:text-red-700"
                    >
                      削除
                    </button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
