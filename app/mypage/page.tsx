"use client";

import { useState, useEffect, MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authorFromUser } from "../lib/auth";
import {
  deleteOwnAccount,
  deleteRoadmap,
  fetchRoadmapsByAuthor,
  fetchRoadmapsByIds,
} from "../lib/roadmaps-db";
import { createClient } from "../lib/supabase/client";
import { Author, Roadmap } from "../lib/types";
import ConfirmDialog from "../components/ConfirmDialog";
import RoadmapCard from "../components/RoadmapCard";
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
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

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

  const handleDeleteAccount = async () => {
    if (deletingAccount) return;
    setDeletingAccount(true);
    setAccountError(null);
    try {
      await deleteOwnAccount();
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (e) {
      console.error(e);
      setAccountError("退会に失敗しました。時間をおいて再度お試しください。");
      setDeletingAccount(false);
    }
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
      <div className="mb-8 flex items-start justify-between border-b border-zinc-200 pb-8">
        <div className="flex items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-200 font-mono text-[22px] font-bold text-zinc-700">
            {user.initial}
          </div>
          <div>
            {editing ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  maxLength={80}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditing(false); }}
                  className="rounded-sm border border-zinc-300 bg-zinc-50 px-2 py-1 text-[15px] text-zinc-900 focus:border-zinc-400 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={saveName}
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-[20px] font-bold tracking-tight text-zinc-900">
                  {user.name}
                </h1>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded-md border border-zinc-200 px-3 py-1 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                >
                  名前を変更
                </button>
              </div>
            )}
            <p className="mt-0.5 font-mono text-[12px] text-zinc-500">@{user.id}</p>
            <div className="mt-2 flex gap-5 text-[12px] text-zinc-500">
              <span>
                <span className="font-semibold text-zinc-600">{myRoadmaps.length}</span>
                {" "}投稿
              </span>
              <span>
                <span className="font-semibold text-zinc-600">{totalLikes}</span>
                {" "}いいね獲得
              </span>
              <span>
                <span className="font-semibold text-zinc-600">{likedRoadmaps.length}</span>
                {" "}いいね
              </span>
              <span>
                <span className="font-semibold text-zinc-600">{bookmarkedRoadmaps.length}</span>
                {" "}保存
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            ログアウト
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteAccountOpen(true);
              setAccountError(null);
            }}
            className="rounded-md px-3 py-2 text-[13px] text-zinc-400 hover:bg-red-50 hover:text-red-600"
          >
            退会する
          </button>
          {accountError && (
            <p className="max-w-[12rem] text-right text-[12px] text-red-600">{accountError}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex w-fit gap-1 rounded-lg bg-zinc-100 p-1">
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
                ? "bg-white font-medium text-zinc-900 shadow-sm"
                : "text-zinc-500 hover:text-zinc-800",
            ].join(" ")}
          >
            {t.label}
            <span className="ml-1.5 font-mono text-[12px] text-zinc-400">
              {t.id === "posts"     ? myRoadmaps.length
               : t.id === "likes"  ? likedRoadmaps.length
               : bookmarkedRoadmaps.length}
            </span>
          </button>
        ))}
      </div>

      {/* Roadmap list */}
      {tabRoadmaps.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-300 py-16 text-center">
          <p className="text-[15px] text-zinc-600">
            {tab === "posts"     && "まだ投稿がありません。"}
            {tab === "likes"     && "まだいいねした投稿がありません。"}
            {tab === "bookmarks" && "まだ保存した投稿がありません。"}
          </p>
          {tab === "posts" && (
            <Link
              href="/roadmap/new"
              className="mt-4 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-700"
            >
              投稿する
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {tabRoadmaps.map((roadmap) => (
            <RoadmapCard
              key={roadmap.id}
              roadmap={roadmap}
              liked={!!liked[roadmap.id]}
              bookmarked={!!bookmarked[roadmap.id]}
              onLike={(e) => toggleLike(e, roadmap.id)}
              onBookmark={(e) => toggleBookmark(e, roadmap.id)}
              footer={
                tab === "posts" ? (
                  <div className="mt-3 flex items-center gap-2">
                    <Link
                      href={`/roadmap/${roadmap.id}/edit`}
                      className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                    >
                      編集
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm(roadmap.id)}
                      className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                ) : null
              }
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={!!deleteConfirm}
        title="投稿を削除しますか？"
        description="削除すると元に戻せません。"
        onCancel={() => setDeleteConfirm(null)}
        onConfirm={() => {
          if (deleteConfirm) removeRoadmap(deleteConfirm);
        }}
      />
      <ConfirmDialog
        open={deleteAccountOpen}
        title="退会しますか？"
        description="アカウントと自分の投稿は削除され、元に戻せません。"
        confirmLabel={deletingAccount ? "削除中..." : "退会する"}
        confirmDisabled={deletingAccount}
        onCancel={() => {
          if (!deletingAccount) setDeleteAccountOpen(false);
        }}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
