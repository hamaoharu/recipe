"use client";

import { use, useState, useEffect, ReactNode, type MouseEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ConfirmDialog from "../../components/ConfirmDialog";
import ShareMenu from "../../components/ShareMenu";
import { totalRequiredDays } from "../../lib/mappers";
import {
  deleteRoadmap,
  fetchRoadmapBundle,
  incrementViews,
} from "../../lib/roadmaps-db";
import { createClient } from "../../lib/supabase/client";
import { BookmarkButton, LikeButton } from "../../components/actions";
import { safeHttpUrl } from "../../lib/urls";
import ResearchBadge from "../../components/ResearchBadge";
import ResearchPanel from "../../components/ResearchPanel";
import { supportRateCopy } from "../../lib/research";
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
  showDays: boolean;

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

function NodeBox({ node, selected, showDays, onClick }: NodeBoxProps) {
  const isSelected = selected === node.id;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      aria-pressed={isSelected}
      className={[
        "w-full min-w-0 rounded-lg px-3.5 py-3 text-left transition-colors duration-100",
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
        {showDays && (
          <p className={[
            "shrink-0 font-mono text-[11px] tabular-nums",
            isSelected ?"text-zinc-600":"text-zinc-500",
          ].join(" ")}>{node.days}日</p>
        )}
      </div>
    </button>
  );
}

function nodesLayoutClass(count: number) {
  if (count <= 1) return "flex";
  return [
    "grid gap-2",
    count === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  ].join(" ");
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
    isAiResearch: false,
    targetUser: null,
    goal: null,
    estimatedDuration: null,
    estimatedHours: null,
    difficulty: null,
    sourceCount: null,
    confidence: null,
    sourceBreakdown: null,
    commonPatterns: null,
    researchSummary: null,
    sources: null,
  };
  const showDays = !meta.isAiResearch;

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


  const handleSelect = (nodeId: string) =>
    setSelected((prev) => (prev === nodeId ? null : nodeId));

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetNodeId, setSheetNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (selected) {
      setSheetNodeId(selected);
      return;
    }
    setSheetOpen(false);
  }, [selected]);

  useEffect(() => {
    if (!selected || !sheetNodeId) return;
    const frame = requestAnimationFrame(() => setSheetOpen(true));
    return () => cancelAnimationFrame(frame);
  }, [selected, sheetNodeId]);

  useEffect(() => {
    if (selected || sheetOpen || !sheetNodeId) return;
    const timer = window.setTimeout(() => setSheetNodeId(null), 300);
    return () => window.clearTimeout(timer);
  }, [selected, sheetOpen, sheetNodeId]);

  const isOwner = !!currentUserId && roadmap?.author.id === currentUserId;
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const router = useRouter();

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

  const overviewBody = (
    <>
      {meta.isAiResearch ? (
        <ResearchPanel roadmap={meta} />
      ) : (
        <>
          <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.85] text-zinc-600">
            {meta.description || "ノードをタップすると詳細が表示されます。"}
          </p>
          <div className="mt-6 rounded-xl border border-zinc-200 p-4 sm:p-5">
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
                    <div className="w-20 shrink-0 sm:w-28">
                      <p className="truncate font-mono text-[11px] text-zinc-500">
                        {g.label ?? req[0].label}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center gap-2">
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
        </>
      )}
    </>
  );

  const overviewPanel = (
    <div className="px-4 py-6 sm:px-8 lg:px-10 lg:py-10">
      <h2 className="text-[20px] font-bold tracking-tight text-zinc-900">
        {meta.title}
      </h2>
      <div className="mt-4">{overviewBody}</div>
    </div>
  );

  const nodeDetail = (nodeId: string) => {
    const item = activeDetails[nodeId];
    const rate = supportRateCopy(item?.sourceSupportRate);
    const criteriaLabel = meta.isAiResearch || (item?.criteria.length ?? 0) > 0
      ? "クリア条件"
      : "クリア基準";

    return (
    <article className="px-4 pb-8 text-[15px] leading-[1.8] text-zinc-700 sm:px-8 lg:px-10 lg:py-10">
      <div className="mb-3 flex items-center justify-end lg:hidden">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="rounded-md px-3 py-1.5 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
        >
          閉じる
        </button>
      </div>
      <div className="flex items-baseline justify-between gap-4 border-b-2 border-zinc-300 pb-2">
        <h2 className="text-[20px] font-bold tracking-tight text-zinc-900">
          {item?.title ?? nodeId}
        </h2>
        {showDays && item?.days ? (
          <span className="shrink-0 font-mono text-[13px] text-zinc-500">
            {item.days}<span className="ml-0.5 text-zinc-500">日</span>
          </span>
        ) : null}
      </div>

      {item ? (
        <>
          {item.category && (
            <p className="mt-3 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
              {item.category}
            </p>
          )}

          {rate && (
            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <p className="text-[14px] font-semibold text-zinc-800">
                採用率 {rate.percent}
              </p>
              {rate.detail && (
                <p className="mt-0.5 text-[13px] text-zinc-500">{rate.detail}</p>
              )}
            </div>
          )}

          {item.why && (
            <DetailSection label="なぜ必要なのか">
              <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.85] text-zinc-600">
                {item.why}
              </p>
            </DetailSection>
          )}

          {item.tasks.length > 0 && (
            <DetailSection label="実施内容">
              <ul className="space-y-3">
                {item.tasks.map((task, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-[1.75] text-zinc-600">
                    <span className="mt-[3px] shrink-0 font-mono text-[11px] text-zinc-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{task}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}

          {!item.why && item.description && (
            <p className="mt-5 whitespace-pre-wrap break-words text-[15px] leading-[1.85] text-zinc-600">
              {item.description}
            </p>
          )}

          {item.resources.length > 0 && (
            <DetailSection label="推奨リソース">
              <ul className="space-y-4">
                {item.resources.map((r, i) => {
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
          )}

          {item.criteria.length > 0 && (
            <DetailSection label={criteriaLabel}>
              <ul className="space-y-3">
                {item.criteria.map((c, i) => (
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
          )}

          {item.commonMistakes.length > 0 && (
            <DetailSection label="よくある失敗">
              <ul className="space-y-3">
                {item.commonMistakes.map((mistake, i) => (
                  <li key={i} className="flex gap-3 text-[15px] leading-[1.75] text-zinc-600">
                    <span className="mt-[3px] shrink-0 font-mono text-[11px] text-zinc-400">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="whitespace-pre-wrap break-words">{mistake}</span>
                  </li>
                ))}
              </ul>
            </DetailSection>
          )}
        </>
      ) : (
        <p className="mt-6 text-[14px] text-zinc-500">このノードの詳細は準備中です。</p>
      )}
    </article>
    );
  };

  return (
    <div
      className="flex min-h-0 flex-col text-zinc-700 lg:h-[calc(100vh-var(--header-height))] lg:flex-row lg:overflow-hidden"
      onClick={() => setSelected(null)}
    >
      {/* ── Left: roadmap ── */}
      <aside className="flex w-full flex-col border-zinc-200 lg:h-full lg:w-[60%] lg:shrink-0 lg:overflow-y-auto lg:border-r">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-8 lg:px-10 lg:py-10">

          {/* Back + meta */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-wrap items-center gap-1">
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
            <div className="flex flex-wrap items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
              />
            </div>
          </div>

          <div className="bg-white">
          {/* Title + author */}
          <div className="mb-2">
            <h1 className="break-words text-[24px] font-bold leading-snug tracking-tight text-zinc-900">
              {meta.title}
            </h1>
            {meta.isAiResearch && (
              <div className="mt-3">
                <ResearchBadge sourceCount={meta.sourceCount} />
              </div>
            )}
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

          <div className="mt-5 lg:hidden">{overviewBody}</div>

          <div className="mb-8 mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-4">
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
            {showDays && (
              <p className="font-mono text-[12px] text-zinc-500">
                <span className="text-zinc-600">{activeTotalDays} 日</span>
              </p>
            )}
          </div>

          {/* Groups */}
          {activeGroups.map((group, gi) => (
            <div key={group.id} className="flex flex-col items-center">
              {group.label && (
                <p className="mb-2 self-start font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                  {group.label}
                </p>
              )}
              <div className={`w-full ${nodesLayoutClass(group.nodes.length)}`}>
                {group.nodes.map((node) => (
                  <NodeBox
                    key={node.id}
                    node={node}
                    selected={selected}
                    showDays={showDays}
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

      <div
        className="hidden h-full w-[40%] shrink-0 overflow-y-auto lg:block"
        onClick={(e) => e.stopPropagation()}
      >
        {!selected ? overviewPanel : nodeDetail(selected)}
      </div>

      {sheetNodeId && (
        <>
          <div
            className={[
              "fixed inset-0 z-40 bg-black/25 transition-opacity duration-300 lg:hidden",
              "motion-reduce:transition-none",
              sheetOpen ? "opacity-100" : "pointer-events-none opacity-0",
            ].join(" ")}
            onClick={() => setSelected(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="ノードの詳細"
            className={[
              "fixed inset-x-0 bottom-0 z-50 max-h-[65vh] overflow-y-auto rounded-t-2xl border-t border-zinc-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_30px_rgba(0,0,0,0.12)] lg:hidden",
              "transform-gpu transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none",
              sheetOpen ? "translate-y-0" : "translate-y-full",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white pt-2">
              <div className="flex justify-center">
                <span className="h-1 w-10 rounded-full bg-zinc-300" />
              </div>
            </div>
            {nodeDetail(sheetNodeId)}
          </div>
        </>
      )}

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
