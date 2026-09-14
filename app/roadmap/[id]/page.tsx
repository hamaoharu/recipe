"use client";

import { use, useState, useEffect, useRef, ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../../components/ConfirmDialog";
import ShareMenu from "../../components/ShareMenu";
import { CameraIcon } from "../../components/icons";
import { captureRoadmapImage } from "../../lib/capture-roadmap";
import { downloadDataUrl } from "../../lib/share";
import { totalRequiredDays } from "../../lib/mappers";
import {
  deleteRoadmap,
  fetchRoadmapBundle,
  incrementViews,
} from "../../lib/roadmaps-db";
import { createClient } from "../../lib/supabase/client";
import { BookmarkButton, LikeButton } from "../../components/actions";
import { safeHttpUrl } from "../../lib/urls";
import type {
  DetailMap,
  Roadmap,
  RoadmapGroup,
  RoadmapNode,
} from "../../lib/types";
import {
  getLikedIds,
  getBookmarkedIds,
  toggleLike as persistLike,
  toggleBookmark as persistBookmark,
} from "../../lib/likes";

type NodeBoxProps = {
  node: RoadmapNode;
  selected: string | null;

  //関数の型だけ指定する書き方
  onClick: (nodeId: string) => void;
}


// ── Sub-components ────────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-5 w-px bg-zinc-300"/>
      <svg width="10"height="6"viewBox="0 0 10 6"fill="none"className="text-zinc-500">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="h-3 w-px bg-zinc-300"/>
    </div>
  );
}

function NodeBox({ node, selected, onClick }: NodeBoxProps) {
  const isSelected = selected === node.id;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      aria-pressed={isSelected}
      className={[
        "rounded-lg px-3.5 py-3 text-left transition-colors duration-100",
        node.required ? "border" : "border border-dashed",
        isSelected
          ? "border-zinc-500 bg-zinc-100"
          : node.required
            ? "border-zinc-200 bg-zinc-50 hover:border-zinc-400 hover:bg-zinc-100"
            : "border-zinc-300 bg-white hover:border-zinc-400 hover:bg-zinc-50",
      ].join(" ")}
    >
      <div className="flex items-end justify-between gap-2">
        <p className={[
          "break-words text-[14px] font-semibold leading-snug",
          isSelected ?"text-zinc-900":"text-zinc-700",
        ].join(" ")}>
          {node.label}
        </p>
        <p className={[
          "shrink-0 font-mono text-[11px] tabular-nums",
          isSelected ?"text-zinc-600":"text-zinc-500",
        ].join(" ")}>{node.days}日</p>
      </div>
    </button>
  );
}

function DetailSection({ label, children }:{ label: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="border-b border-zinc-200 pb-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {label}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

//Promise 後で値が来る型 Promise<T> はあとで Tが来る
export default function RoadmapDetailPage({ params }:{ params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [groups, setGroups] = useState<RoadmapGroup[]>([]);
  const [details, setDetails] = useState<DetailMap>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFromDb() {
      setLoading(true);
      try {
        const bundle = await fetchRoadmapBundle(id);
        setRoadmap(bundle.roadmap);
        setGroups(bundle.groups);
        setDetails(bundle.details);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadFromDb();
  }, [id]);

  //閲覧数は表示のたびに1回だけ増やす
  useEffect(() => {
    incrementViews(id).catch(() => {});
  }, [id]);

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      setCurrentUserId(data.session?.user.id ?? null);
    }
    loadUser();
  }, []);

  const activeGroups = groups;
  const activeDetails = details;
  const activeTotalDays = roadmap?.totalDays || totalRequiredDays(groups);

  const meta = roadmap ?? {
    id: "unknown",
    title: "Roadmap",
    description: "",
    author: { id: "unknown", name: "anonymous", initial: "A" },
    tags: [],
    likes: 0,
    views: 0,
    totalDays: 0,
    createdAt: "",
  };

  const [selected, setSelected] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  useEffect(() => {
    async function loadSocial() {
      const [likedIds, bookmarkedIds] = await Promise.all([
        getLikedIds(),
        getBookmarkedIds(),
      ]);
      setLiked(likedIds.includes(id));
      setBookmarked(bookmarkedIds.includes(id));
    }
    loadSocial();
  }, [id]);


  const handleSelect = (nodeId: string) => setSelected((prev) => (prev === nodeId ? null : nodeId));

  const isOwner = !!currentUserId && roadmap?.author.id === currentUserId;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [savingImage, setSavingImage] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const handleSaveMap = async (e: MouseEvent) => {
    e.stopPropagation();
    if (!mapRef.current) return;
    setSavingImage(true);
    try {
      const url = await captureRoadmapImage(mapRef.current, meta.title);
      downloadDataUrl(url, `${meta.title || "roadmap"}.png`);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingImage(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteRoadmap(id);
      router.push("/");
    } catch (e) {
      console.error(e);
      setDeleteConfirm(false);
    }
  };

  const handleToggleLike = async () => {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setRoadmap((prev) =>
      prev ? { ...prev, likes: prev.likes + (wasLiked ? -1 : 1) } : prev
    );

    const nowLiked = await persistLike(id, wasLiked);
    if (nowLiked === wasLiked) {
      setLiked(wasLiked);
      setRoadmap((prev) =>
        prev ? { ...prev, likes: prev.likes + (wasLiked ? 1 : -1) } : prev
      );
      if (!wasLiked) router.push(`/login?next=/roadmap/${id}`);
    }
  };

  const handleToggleBookmark = async () => {
    const wasBookmarked = bookmarked;
    setBookmarked(!wasBookmarked);

    const nowBookmarked = await persistBookmark(id, wasBookmarked);
    if (nowBookmarked === wasBookmarked) {
      setBookmarked(wasBookmarked);
      if (!wasBookmarked) router.push(`/login?next=/roadmap/${id}`);
    }
  };

  if (loading) {
    return (
      <div
        className="flex items-center justify-center text-zinc-500"
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        読み込み中...
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 text-zinc-500"
        style={{ height: "calc(100vh - var(--header-height))" }}
      >
        <p className="text-[16px] font-medium text-zinc-800">ページが見つかりません</p>
        <Link href="/" className="text-[14px] text-zinc-600 underline underline-offset-4">
          トップへ戻る
        </Link>
      </div>
    );
  }

  return (
    <div
      className="flex overflow-hidden text-zinc-700"
      style={{ height: "calc(100vh - var(--header-height))" }}
      onClick={() => setSelected(null)}
    >
      {/* ── Left 60%: roadmap ── */}
      <aside className="flex h-full w-[60%] shrink-0 flex-col overflow-y-auto border-r border-zinc-200">
        <div className="mx-auto w-full max-w-2xl px-10 py-10">

          {/* Back + meta */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Link
                href="/"
                className="rounded-md px-2 py-1.5 font-mono text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                ← 一覧に戻る
              </Link>
              {isOwner && (
                <>
                  <Link
                    href={`/roadmap/${id}/edit`}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded-md border border-zinc-200 px-3 py-1.5 text-[13px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
                  >
                    編集
                  </Link>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true); }}
                    className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    削除
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-1">
              <LikeButton
                active={liked}
                count={meta.likes}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleLike();
                }}
              />
              <BookmarkButton
                active={bookmarked}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleBookmark();
                }}
              />
              <ShareMenu
                roadmapId={id}
                title={meta.title}
                captureTarget={mapRef}
              />
              <button
                type="button"
                onClick={handleSaveMap}
                disabled={savingImage}
                className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50"
              >
                <CameraIcon />
                {savingImage ? "保存中..." : "図を保存"}
              </button>
            </div>
          </div>

          <div ref={mapRef} className="bg-white">
          {/* Title + author */}
          <div className="mb-2">
            <h1 className="break-words text-[24px] font-bold leading-snug tracking-tight text-zinc-900">
              {meta.title}
            </h1>
            <div className="mt-3 flex items-center gap-2 text-[13px] text-zinc-500">
              <Link
                href={`/user/${meta.author.id}`}
                className="flex items-center gap-2 rounded-md py-0.5 transition-opacity hover:opacity-70"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 font-mono text-[11px] font-bold text-zinc-600">
                  {meta.author.initial}
                </span>
                <span className="text-zinc-600">{meta.author.name}</span>
              </Link>
              {meta.createdAt && (
                <>
                  <span className="text-zinc-300">·</span>
                  <span>{meta.createdAt}</span>
                </>
              )}
            </div>
            {(meta.tags ?? []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {(meta.tags ?? []).map((tag) => (
                  <Link
                    key={tag}
                    href={`/?tag=${encodeURIComponent(tag)}`}
                    className="rounded-md border border-zinc-200 px-2.5 py-1 font-mono text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-800"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Days + legend */}
          <div className="mb-8 mt-4 flex items-center justify-between border-t border-zinc-200 pt-4">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-zinc-400"/>
                必須
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-dashed border-zinc-400"/>
                任意
              </span>
            </div>
            <p className="font-mono text-[12px] text-zinc-500">
              <span className="text-zinc-600">{activeTotalDays} 日</span>
            </p>
          </div>

          {/* Groups */}
          {activeGroups.map((group, gi) => (
            <div key={group.id} className="flex flex-col items-center">
              {group.label && (
                <p className="mb-2 self-start font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className={[
                "w-full",
                group.nodes.length === 1 ? "flex" : "grid gap-2",
                group.nodes.length === 2 ? "grid-cols-2" : "",
                group.nodes.length >= 3 ? "grid-cols-3" : "",
              ].join(" ")}>
                {group.nodes.map((node) => (
                  <NodeBox
                    key={node.id}
                    node={node}
                    selected={selected}
                    onClick={handleSelect}
                  />
                ))}
              </div>
              {gi < activeGroups.length - 1 && <Connector />}
            </div>
          ))}
          </div>

          <div className="h-16" />
        </div>
      </aside>

      {/* ── Right 40%: detail / overview ── */}
      <div className="h-full w-[40%] shrink-0 overflow-y-auto">
        {!selected ? (
          /* Overview */
          <div className="px-10 py-10">
            <h2 className="text-[20px] font-bold tracking-tight text-zinc-900">
              {meta.title}
            </h2>
            <p className="mt-4 whitespace-pre-wrap break-words text-[15px] leading-[1.85] text-zinc-600">
              {meta.description || "ノードをクリックすると詳細が表示されます。"}
            </p>

            {/* Timeline bar chart */}
            <div className="mt-8 rounded-xl border border-zinc-200 p-5">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                全体スケジュール（必須ルート）
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[32px] font-bold leading-none text-zinc-900">
                  {activeTotalDays}
                </span>
                <span className="text-[13px] text-zinc-500">日</span>
                <span className="ml-1 text-[13px] text-zinc-500">
                  ≈ {Math.round(activeTotalDays / 30)} ヶ月
                </span>
              </div>
              <p className="mt-2 text-[12px] text-zinc-500">
                1〜2時間/日で学習した場合の目安。
              </p>
              <div className="mt-5 space-y-2">
                {activeGroups.map((g) => {
                  const req = g.nodes.filter((n) => n.required);
                  if (req.length === 0) return null;
                  const total = req.reduce((s, n) => s + n.days, 0);
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <p className="truncate font-mono text-[11px] text-zinc-500">
                          {g.label ?? req[0].label}
                        </p>
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="h-1.5 rounded-full bg-zinc-300"
                          style={{ width: `${activeTotalDays ? Math.round((total / activeTotalDays) * 100) : 0}%`, minWidth: "4px" }}
                        />
                        <span className="shrink-0 font-mono text-[10px] text-zinc-500">
                          {total}日
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Node detail */
          <article className="px-10 py-10 text-[15px] leading-[1.8] text-zinc-700">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-zinc-300 pb-2">
              <h2 className="text-[20px] font-bold tracking-tight text-zinc-900">
                {activeDetails[selected]?.title ?? selected}
              </h2>
              {activeDetails[selected]?.days && (
                <span className="shrink-0 font-mono text-[13px] text-zinc-500">
                  {activeDetails[selected].days}<span className="ml-0.5 text-zinc-500">日</span>
                </span>
              )}
            </div>

            {activeDetails[selected] ? (
              <>
                <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-[1.85] text-zinc-600">
                  {activeDetails[selected].description}
                </p>

                <DetailSection label="推奨リソース">
                  <ul className="space-y-4">
                    {activeDetails[selected].resources.map((r, i) => {
                      const href = safeHttpUrl(r.url);
                      return (
                      <li key={i} className="border-b border-zinc-200 pb-4 last:border-b-0 last:pb-0">
                        <p className="text-[14px] font-semibold text-zinc-800">
                          {href ? (
                            <a href={href} target="_blank" rel="noopener noreferrer"
                              className="underline decoration-zinc-700 underline-offset-2 hover:decoration-zinc-400">
                              {r.label}
                            </a>
                          ) : r.label}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-[14px] text-zinc-500">
                          {r.note}
                        </p>
                      </li>
                      );
                    })}
                  </ul>
                </DetailSection>

                <DetailSection label="クリア基準">
                  <ul className="space-y-3">
                    {activeDetails[selected].criteria.map((c, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-[1.75] text-zinc-600">
                        <span className="mt-[3px] shrink-0 font-mono text-[11px] text-zinc-400">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="whitespace-pre-wrap break-words">
                          {typeof c === "string" ? c : c.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              </>
            ) : (
              <p className="mt-6 text-[14px] text-zinc-500">このノードの詳細は準備中です。</p>
            )}
          </article>
        )}
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title="投稿を削除しますか？"
        description="削除すると元に戻せません。"
        onCancel={() => setDeleteConfirm(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
