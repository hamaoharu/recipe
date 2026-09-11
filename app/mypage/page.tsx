"use client";

import { useState, useEffect, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authorFromUser } from "../lib/auth";
import {
  deleteRoadmap,
  fetchRoadmapsByAuthor,
  fetchRoadmapsByIds,
} from "../lib/roadmaps-db";
import { createClient } from "../lib/supabase/client";
import { Author, Roadmap } from "../lib/types";
import { BookmarkButton, DaysBadge, LikeButton, ViewCount } from "../components/actions";
import {
  getLikedIds,
  getBookmarkedIds,
  idsToRecord,
  toggleLike as persistLike,
  toggleBookmark as persistBookmark,
} from "../lib/likes";

const TABS = [
  { id: "posts",     label: "投稿" },
  { id: "likes",     label: "いいね" },
  { id: "bookmarks", label: "保存" },
];

export default function MyPage() {
  const router = useRouter();

  type TabId = "posts" | "likes" | "bookmarks";

  //ジェネリクスは初期値よりも広い型をJSに教える
  const [user, setUser]       = useState<Author | null>(null);
  const [tab, setTab]         = useState<TabId>("posts");
  const [editing, setEditing] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [liked, setLiked]         = useState<Record<string, boolean>>({});
  const [bookmarked, setBookmarked] = useState<Record<string, boolean>>({});

  //| nullが必要なのは初期値がnullの時だけ
  const [userRoadmaps, setUserRoadmaps] = useState<Roadmap[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login?next=/mypage");
        return;
      }
      const author = authorFromUser(data.session.user);
      setUser(author);
      setNameInput(author.name);
    }
    loadUser();
  }, [router]);

  const [likedRoadmaps, setLikedRoadmaps] = useState<Roadmap[]>([]);
  const [bookmarkedRoadmaps, setBookmarkedRoadmaps] = useState<Roadmap[]>([]);

  useEffect(() => {
    if (!user) return;

    async function loadRoadmaps() {
      try {
        const [mine, likedIds, bookmarkedIds] = await Promise.all([
          fetchRoadmapsByAuthor(user!.id),
          getLikedIds(),
          getBookmarkedIds(),
        ]);
        setUserRoadmaps(mine);
        setLiked(idsToRecord(likedIds));
        setBookmarked(idsToRecord(bookmarkedIds));

        const [likedList, bookmarkedList] = await Promise.all([
          fetchRoadmapsByIds(likedIds),
          fetchRoadmapsByIds(bookmarkedIds),
        ]);
        setLikedRoadmaps(likedList);
        setBookmarkedRoadmaps(bookmarkedList);
      } catch (e) {
        console.error(e);
      }
    }
    loadRoadmaps();
  }, [user]);

  if (!user) return null;

  const myRoadmaps = userRoadmaps;

  //オブジェクトの定義と取得を同時にしている
  //tabRoadmapsはオブジェクトではなく配列 一時的なオブジェクトを利用しているだけ
  const tabRoadmaps = {
    posts:     myRoadmaps,
    likes:     likedRoadmaps,
    bookmarks: bookmarkedRoadmaps,
  }[tab];

  //sumと今の値を引数で受け取る
  const totalLikes = myRoadmaps.reduce((s, r) => s + (r.likes ?? 0), 0);

  const removeRoadmap = async (id: string) => {
    try {
      await deleteRoadmap(id);
      setUserRoadmaps((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
    }
    setDeleteConfirm(null);
  };

  const saveName = async () => {
    if (!nameInput.trim() || !user) return;
    const name = nameInput.trim();
    const initial = name.slice(0, 1).toUpperCase();
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: { name, initial },
    });
    if (error) return;

    //投稿側にも著者名を持たせているので合わせて更新する
    await supabase
      .from("roadmaps")
      .update({ author_name: name, author_initial: initial })
      .eq("author_id", user.id);

    setUser({ ...user, name, initial });
    setUserRoadmaps((prev) =>
      prev.map((r) => ({ ...r, author: { ...r.author, name, initial } })),
    );
    setEditing(false);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  const toggleLike = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasLiked = !!liked[id];
    setLiked((prev) => ({ ...prev, [id]: !wasLiked }));

    const nowLiked = await persistLike(id, wasLiked);
    if (nowLiked === wasLiked) {
      setLiked((prev) => ({ ...prev, [id]: wasLiked }));
    } else if (wasLiked) {
      setLikedRoadmaps((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const toggleBookmark = async (e: MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const wasBookmarked = !!bookmarked[id];
    setBookmarked((prev) => ({ ...prev, [id]: !wasBookmarked }));

    const nowBookmarked = await persistBookmark(id, wasBookmarked);
    if (nowBookmarked === wasBookmarked) {
      setBookmarked((prev) => ({ ...prev, [id]: wasBookmarked }));
    } else if (wasBookmarked) {
      setBookmarkedRoadmaps((prev) => prev.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">

      {/* Profile card */}
      <div className="mb-8 flex items-start justify-between border-b border-zinc-200 dark:border-zinc-800 pb-8">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[22px] font-bold text-zinc-700 dark:text-zinc-300">
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
                  className="rounded-sm border border-zinc-300 bg-zinc-50 px-2 py-1 text-[15px] text-zinc-900 focus:border-zinc-400 focus:outline-none dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  {user.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
                >
                  名前を変更
                </button>
              </div>
            )}
            <p className="mt-0.5 font-mono text-[12px] text-zinc-500 dark:text-zinc-600">@{user.id}</p>
            <div className="mt-2 flex gap-5 text-[12px] text-zinc-500 dark:text-zinc-600">
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">{myRoadmaps.length}</span>
                {" "}投稿
              </span>
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">{totalLikes}</span>
                {" "}いいね獲得
              </span>
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">{likedRoadmaps.length}</span>
                {" "}いいね
              </span>
              <span>
                <span className="font-semibold text-zinc-600 dark:text-zinc-400">{bookmarkedRoadmaps.length}</span>
                {" "}保存
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          ログアウト
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"

            //tab.idがstringと広げて解釈されるのを防ぐ
            onClick={() => setTab(t.id as TabId)}
            aria-pressed={tab === t.id}
            className={[
              "rounded-md px-4 py-2 text-[14px] transition-colors",
              tab === t.id
                ? "bg-white font-medium text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300",
            ].join(" ")}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[12px] text-zinc-400 dark:text-zinc-500">
              {t.id === "posts"     ? myRoadmaps.length
               : t.id === "likes"  ? likedRoadmaps.length
               : bookmarkedRoadmaps.length}
            </span>
          </button>
        ))}
      </div>

      {/* Roadmap list */}
      {tabRoadmaps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-800">
          <p className="text-[15px] text-zinc-600 dark:text-zinc-400">
            {tab === "posts"     && "まだ投稿がありません。"}
            {tab === "likes"     && "まだいいねした投稿がありません。"}
            {tab === "bookmarks" && "まだ保存した投稿がありません。"}
          </p>
          {tab === "posts" && (
            <Link
              href="/roadmap/new"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              投稿する
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {tabRoadmaps.map((roadmap) => (
            <li
              key={roadmap.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
            >
              {/* Author */}
              <div className="mb-2 flex items-center gap-2">
                <Link
                  href={`/user/${roadmap.author.id}`}
                  className="flex items-center gap-2 transition-opacity hover:opacity-70"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                    {roadmap.author.initial}
                  </span>
                  <span className="text-[12px] text-zinc-500 hover:text-zinc-700 dark:text-zinc-300">
                    {roadmap.author.name}
                  </span>
                </Link>
                <span className="text-[12px] text-zinc-400 dark:text-zinc-800">·</span>
                <span className="text-[12px] text-zinc-500 dark:text-zinc-700">{roadmap.createdAt}</span>
              </div>

              {/* Title + description */}
              <Link href={`/roadmap/${roadmap.id}`} className="group block">
                <h2 className="text-[18px] font-bold leading-snug tracking-tight text-zinc-900 group-hover:underline group-hover:underline-offset-4 dark:text-zinc-100">
                  {roadmap.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-400">
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
                      className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-200"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Meta */}
              <div className="mt-3 flex items-center gap-1 border-t border-zinc-100 pt-2 dark:border-zinc-900">
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

              {/* Delete for own posts */}
              {tab === "posts" && (
                <div className="mt-3 flex items-center gap-4">
                  {deleteConfirm === roadmap.id ? (
                    <>
                      <span className="text-[13px] text-zinc-600 dark:text-zinc-400">
                        本当に削除しますか？
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRoadmap(roadmap.id)}
                        className="rounded-md bg-red-600 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-red-500"
                      >
                        削除する
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(null)}
                        className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
                      >
                        キャンセル
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href={`/roadmap/${roadmap.id}/edit`}
                        className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-zinc-600 dark:hover:text-zinc-100"
                      >
                        編集
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirm(roadmap.id)}
                        className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      >
                        削除
                      </button>
                    </>
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
