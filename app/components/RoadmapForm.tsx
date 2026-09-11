"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import Link from "next/link";

type EditResource = {
  id: string;
  label: string;
  url: string;
  note: string;
};

type EditCriterion = {
  id: string;
  text: string;
};

type EditNode = {
  id: string;
  label: string;
  required: boolean;
  days: string;
  nodeDescription: string;
  resources: EditResource[];
  criteria: EditCriterion[];
};

type EditGroup = {
  id: string;
  label: string;
  nodes: EditNode[];
};

type FormErrors = {
  title?: string;
  nodes?: string;
  submit?: string;
};

//親（新規作成 / 編集）に渡す、整形済みの入力値
export type RoadmapFormResult = {
  title: string;
  description: string;
  tags: string[];
  groups: {
    id: string;
    label: string | null;
    nodes: {
      id: string;
      label: string;
      required: boolean;
      days: number;
      description: string;
      resources: { label: string; url: string | null; note: string }[];
      criteria: string[];
    }[];
  }[];
};

//36進数でランダムな文字列を生成する関数
const uid = () => Math.random().toString(36).slice(2, 9);

//1ノードあたりの日数の上限。integer 列に収める意味もある
const MAX_DAYS = 365;

//半角数字だけを受け取り、上限を超えたら切り詰める
function sanitizeDays(raw: string): string {
  const digits = raw.replace(/[^0-9]/g, "").replace(/^0+(?=\d)/, "").slice(0, 4);
  if (digits === "") return "";
  return String(Math.min(Number(digits), MAX_DAYS));
}

function parseDays(raw: string): number {
  const n = Number(sanitizeDays(raw));
  return Number.isFinite(n) ? Math.min(n, MAX_DAYS) : 0;
}

const newNode = (): EditNode => ({
  id: uid(),
  label: "",
  required: true,
  days: "",
  nodeDescription: "",
  resources: [{ id: uid(), label: "", url: "", note: "" }],
  criteria: [{ id: uid(), text: "" }],
});

const newGroup = (): EditGroup => ({ id: uid(), label: "", nodes: [newNode()] });

//DBから読んだ値をフォームの状態に変換する。idは新しく振り直す
export function toEditGroups(result: RoadmapFormResult["groups"]): EditGroup[] {
  if (result.length === 0) return [newGroup()];

  return result.map((g) => ({
    id: uid(),
    label: g.label ?? "",
    nodes:
      g.nodes.length > 0
        ? g.nodes.map((n) => ({
            id: uid(),
            label: n.label,
            required: n.required,
            days: String(n.days),
            nodeDescription: n.description,
            resources:
              n.resources.length > 0
                ? n.resources.map((r) => ({
                    id: uid(),
                    label: r.label,
                    url: r.url ?? "",
                    note: r.note,
                  }))
                : [{ id: uid(), label: "", url: "", note: "" }],
            criteria:
              n.criteria.length > 0
                ? n.criteria.map((text) => ({ id: uid(), text }))
                : [{ id: uid(), text: "" }],
          }))
        : [newNode()],
  }));
}

// ── 高さが中身に合わせて伸びるテキストエリア ─────────────────────────────────
type AutoTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  //タイトルなど改行させたくない欄で使う
  singleLine?: boolean;
  ariaLabel?: string;
  onClick?: (e: React.MouseEvent<HTMLTextAreaElement>) => void;
};

function AutoTextarea({
  value,
  onChange,
  placeholder,
  className = "",
  singleLine = false,
  ariaLabel,
  onClick,
}: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  //中身が変わるたびに高さを測り直す
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      aria-label={ariaLabel}
      placeholder={placeholder}
      onClick={onClick}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (singleLine && e.key === "Enter") e.preventDefault();
      }}
      className={`resize-none overflow-hidden ${className}`}
    />
  );
}

// ── 小さすぎない削除ボタン ───────────────────────────────────────────────────
function RemoveButton({
  onClick,
  label,
  children,
  className = "",
}: {
  onClick: () => void;
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        "flex shrink-0 items-center justify-center gap-1 rounded-sm px-2 py-1.5 text-[12px] leading-none text-zinc-500",
        "transition-colors hover:bg-red-50 hover:text-red-600 dark:text-zinc-500 dark:hover:bg-red-950/40 dark:hover:text-red-400",
        className,
      ].join(" ")}
    >
      {children ?? <span aria-hidden>✕</span>}
    </button>
  );
}

// ── ノードカード ─────────────────────────────────────────────────────────────
type NodeEditCardProps = {
  node: EditNode;
  selected: string | null;
  invalid: boolean;
  onSelect: (id: string) => void;
  onUpdate: (nid: string, field: string, val: string | boolean) => void;
  onRemove: (nid: string) => void;
  canRemove: boolean;
};

function NodeEditCard({
  node,
  selected,
  invalid,
  onSelect,
  onUpdate,
  onRemove,
  canRemove,
}: NodeEditCardProps) {
  const isSelected = selected === node.id;
  const hasDetail =
    node.nodeDescription.trim() !== "" ||
    node.resources.some((r) => r.label.trim() !== "") ||
    node.criteria.some((c) => c.text.trim() !== "");

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      className={[
        "group relative flex flex-col rounded-sm border transition-colors duration-100",
        node.required ? "border-solid" : "border-dashed",
        invalid
          ? "border-red-400 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20"
          : isSelected
            ? "border-zinc-500 bg-zinc-100 dark:border-zinc-400 dark:bg-zinc-900"
            : "border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <div className="flex items-start gap-1 px-3 pt-2.5">
        <AutoTextarea
          value={node.label}
          onChange={(val) => onUpdate(node.id, "label", val)}
          onClick={(e) => e.stopPropagation()}
          placeholder="ノード名"
          singleLine
          ariaLabel="ノード名"
          className={[
            "min-w-0 flex-1 break-words bg-transparent text-[13px] font-semibold leading-snug",
            "placeholder:text-zinc-400 focus:outline-none dark:placeholder:text-zinc-700",
            isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-600 dark:text-zinc-400",
          ].join(" ")}
        />
        {canRemove && (
          <RemoveButton
            onClick={() => onRemove(node.id)}
            label={`ノード「${node.label || "無題"}」を削除`}
            className="-mr-1 -mt-1"
          />
        )}
      </div>

      <div className="mt-1 flex items-center justify-between px-3 pb-2.5">
        <label
          className="flex cursor-pointer items-center gap-1.5 py-1 text-[11px] text-zinc-500 dark:text-zinc-500"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={node.required}
            onChange={(e) => onUpdate(node.id, "required", e.target.checked)}
            className="h-3.5 w-3.5 accent-zinc-500"
          />
          必須
        </label>
        <div
          className="flex items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            inputMode="numeric"
            value={node.days}
            onChange={(e) => onUpdate(node.id, "days", sanitizeDays(e.target.value))}
            placeholder="0"
            aria-label={`日数（最大${MAX_DAYS}日）`}
            title={`1ノードあたり最大 ${MAX_DAYS} 日まで`}
            className="w-14 rounded-sm bg-transparent px-1 py-1 text-right font-mono text-[12px] text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-400 dark:placeholder:text-zinc-700"
          />
          <span className="font-mono text-[11px] text-zinc-500 dark:text-zinc-600">日</span>
        </div>
      </div>

      {hasDetail && (
        <div className="border-t border-zinc-200 px-3 py-1 dark:border-zinc-800">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-600">詳細あり</span>
        </div>
      )}
    </div>
  );
}

function Connector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-4 w-px bg-zinc-300 dark:bg-zinc-700" />
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-zinc-500 dark:text-zinc-700">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="h-2 w-px bg-zinc-300 dark:bg-zinc-700" />
    </div>
  );
}

// ── 右パネル：ノード詳細の入力 ───────────────────────────────────────────────
type NodeDetailPanelProps = {
  node: EditNode;
  onUpdate: (field: string, val: string) => void;
  onAddResource: () => void;
  onRemoveResource: (rid: string) => void;
  onUpdateResource: (rid: string, field: string, val: string) => void;
  onAddCriterion: () => void;
  onRemoveCriterion: (cid: string) => void;
  onUpdateCriterion: (cid: string, val: string) => void;
};

const inputBase =
  "w-full rounded-sm border border-zinc-200 bg-white px-3 py-2 text-[13px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600";
const inputSm =
  "w-full rounded-sm border border-zinc-200 bg-white px-2 py-1.5 text-[12px] leading-relaxed text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600";

function NodeDetailPanel({
  node,
  onUpdate,
  onAddResource,
  onRemoveResource,
  onUpdateResource,
  onAddCriterion,
  onRemoveCriterion,
  onUpdateCriterion,
}: NodeDetailPanelProps) {
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          編集中のノード
        </p>
        <p className="break-words text-[16px] font-bold leading-snug text-zinc-900 dark:text-zinc-100">
          {node.label || (
            <span className="text-zinc-500 dark:text-zinc-600">（タイトル未入力）</span>
          )}
        </p>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          説明・思想
        </p>
        <AutoTextarea
          value={node.nodeDescription}
          onChange={(val) => onUpdate("nodeDescription", val)}
          placeholder="このトピックを学ぶ理由や実務での重要性を書いてください。改行できます。"
          ariaLabel="説明・思想"
          className={`${inputBase} min-h-[92px]`}
        />
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          推奨リソース
        </p>
        <div className="space-y-3">
          {node.resources.map((r) => (
            <div
              key={r.id}
              className="space-y-2 rounded-sm border border-zinc-200 p-3 dark:border-zinc-800"
            >
              <div className="flex items-start gap-2">
                <AutoTextarea
                  value={r.label}
                  onChange={(val) => onUpdateResource(r.id, "label", val)}
                  placeholder="リソース名・書籍名"
                  singleLine
                  ariaLabel="リソース名"
                  className={inputSm}
                />
                {node.resources.length > 1 && (
                  <RemoveButton
                    onClick={() => onRemoveResource(r.id)}
                    label="このリソースを削除"
                  />
                )}
              </div>
              <input
                type="url"
                value={r.url}
                onChange={(e) => onUpdateResource(r.id, "url", e.target.value)}
                placeholder="URL（任意）"
                aria-label="URL"
                className={inputSm}
              />
              <AutoTextarea
                value={r.note}
                onChange={(val) => onUpdateResource(r.id, "note", val)}
                placeholder="使い方・コメント"
                ariaLabel="使い方・コメント"
                className={inputSm}
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddResource}
          className="mt-2 rounded-sm px-2 py-1.5 text-[12px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          ＋ リソースを追加
        </button>
      </div>

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          クリア基準
        </p>
        <div className="space-y-2">
          {node.criteria.map((c, ci) => (
            <div key={c.id} className="flex items-start gap-2">
              <span className="mt-2.5 shrink-0 font-mono text-[10px] text-zinc-500 dark:text-zinc-600">
                {String(ci + 1).padStart(2, "0")}
              </span>
              <AutoTextarea
                value={c.text}
                onChange={(val) => onUpdateCriterion(c.id, val)}
                placeholder="これができたら次のステップへ進んでよい条件"
                ariaLabel={`クリア基準 ${ci + 1}`}
                className={inputSm}
              />
              {node.criteria.length > 1 && (
                <RemoveButton
                  onClick={() => onRemoveCriterion(c.id)}
                  label={`クリア基準 ${ci + 1} を削除`}
                />
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={onAddCriterion}
          className="mt-2 rounded-sm px-2 py-1.5 text-[12px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          ＋ 基準を追加
        </button>
      </div>
    </div>
  );
}

// ── フォーム本体 ─────────────────────────────────────────────────────────────
type RoadmapFormProps = {
  heading: string;
  submitLabel: string;
  submittingLabel: string;
  cancelHref: string;
  initialValues?: RoadmapFormResult;
  onSubmit: (values: RoadmapFormResult) => Promise<void>;
};

export default function RoadmapForm({
  heading,
  submitLabel,
  submittingLabel,
  cancelHref,
  initialValues,
  onSubmit,
}: RoadmapFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(initialValues?.description ?? "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [groups, setGroups] = useState<EditGroup[]>(() =>
    initialValues ? toEditGroups(initialValues.groups) : [newGroup()],
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const selectedGroup = groups.find((g) => g.nodes.some((n) => n.id === selectedNodeId));
  const selectedNode = selectedGroup?.nodes.find((n) => n.id === selectedNodeId);

  const addTag = () => {
    const t = tagInput.trim().replace(/,/g, "");
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };

  const addGroup = () => setGroups((p) => [...p, newGroup()]);
  const removeGroup = (gid: string) => {
    setGroups((p) => p.filter((g) => g.id !== gid));
    setSelectedNodeId(null);
  };
  const updateGroupLabel = (gid: string, val: string) =>
    setGroups((p) => p.map((g) => (g.id === gid ? { ...g, label: val } : g)));

  const addNode = (gid: string) =>
    setGroups((p) =>
      p.map((g) => (g.id === gid ? { ...g, nodes: [...g.nodes, newNode()] } : g)),
    );

  const removeNode = useCallback((gid: string, nid: string) => {
    setGroups((p) =>
      p.map((g) =>
        g.id === gid ? { ...g, nodes: g.nodes.filter((n) => n.id !== nid) } : g,
      ),
    );
    setSelectedNodeId((prev) => (prev === nid ? null : prev));
  }, []);

  const updateNode = useCallback(
    (
      nid: string,
      field: string,
      val: string | boolean | EditResource[] | EditCriterion[],
    ) =>
      setGroups((p) =>
        p.map((g) => ({
          ...g,
          nodes: g.nodes.map((n) => (n.id === nid ? { ...n, [field]: val } : n)),
        })),
      ),
    [],
  );

  const addResource = () => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "resources", [
      ...selectedNode.resources,
      { id: uid(), label: "", url: "", note: "" },
    ]);
  };
  const removeResource = (rid: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(
      selectedNodeId,
      "resources",
      selectedNode.resources.filter((r) => r.id !== rid),
    );
  };
  const updateResource = (rid: string, field: string, val: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(
      selectedNodeId,
      "resources",
      selectedNode.resources.map((r) => (r.id === rid ? { ...r, [field]: val } : r)),
    );
  };

  const addCriterion = () => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "criteria", [
      ...selectedNode.criteria,
      { id: uid(), text: "" },
    ]);
  };
  const removeCriterion = (cid: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(
      selectedNodeId,
      "criteria",
      selectedNode.criteria.filter((c) => c.id !== cid),
    );
  };
  const updateCriterion = (cid: string, val: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(
      selectedNodeId,
      "criteria",
      selectedNode.criteria.map((c) => (c.id === cid ? { ...c, text: val } : c)),
    );
  };

  //入力欄でEnterを押しても送信されないようにする。送信はボタンだけ
  const preventImplicitSubmit = (e: KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.tagName === "TEXTAREA" || target.tagName === "BUTTON") return;
    e.preventDefault();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const errs: FormErrors = {};
    if (!title.trim()) errs.title = "タイトルは必須です";
    if (groups.some((g) => g.nodes.some((n) => !n.label.trim())))
      errs.nodes = "すべてのノードにタイトルが必要です";
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setSubmitting(true);

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        tags,
        groups: groups.map((g) => ({
          id: g.id,
          label: g.label.trim() || null,
          nodes: g.nodes.map((n) => ({
            id: n.id,
            label: n.label.trim(),
            required: n.required,
            days: parseDays(n.days),
            description: n.nodeDescription.trim(),
            resources: n.resources
              .filter((r) => r.label.trim())
              .map((r) => ({
                label: r.label.trim(),
                url: r.url.trim() || null,
                note: r.note.trim(),
              })),
            criteria: n.criteria.map((c) => c.text.trim()).filter(Boolean),
          })),
        })),
      });
    } catch (err) {
      console.error(err);
      setErrors({ submit: "保存に失敗しました。時間をおいて再度お試しください。" });
      setSubmitting(false);
    }
  };

  const totalDays = groups
    .flatMap((g) => g.nodes)
    .filter((n) => n.required)
    .reduce((s, n) => s + parseDays(n.days), 0);

  const showNodeErrors = !!errors.nodes;

  const actions = (
    <div className="flex items-center justify-between gap-4">
      <Link
        href={cancelHref}
        className="rounded-sm px-2 py-1.5 text-[13px] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        キャンセル
      </Link>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-sm bg-zinc-900 px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        {submitting ? submittingLabel : submitLabel}
      </button>
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={preventImplicitSubmit}
      className="flex overflow-hidden text-zinc-700 dark:text-zinc-300"
      style={{ height: "calc(100vh - var(--header-height))" }}
    >
      {/* ── 左：ロードマップの構造 ── */}
      <div
        className="flex h-full w-[60%] shrink-0 flex-col overflow-y-auto border-r border-zinc-200 dark:border-zinc-800"
        onClick={() => setSelectedNodeId(null)}
      >
        <div className="mx-auto w-full max-w-2xl px-10 py-10">
          <AutoTextarea
            value={title}
            onChange={setTitle}
            onClick={(e) => e.stopPropagation()}
            placeholder="ロードマップのタイトル"
            singleLine
            ariaLabel="ロードマップのタイトル"
            className={[
              "w-full break-words bg-transparent text-[22px] font-bold leading-snug tracking-tight text-zinc-900",
              "placeholder:text-zinc-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-700",
              errors.title ? "border-b border-red-500" : "",
            ].join(" ")}
          />
          {errors.title && (
            <p className="mt-1 text-[12px] text-red-600 dark:text-red-400">{errors.title}</p>
          )}

          <AutoTextarea
            value={description}
            onChange={setDescription}
            onClick={(e) => e.stopPropagation()}
            placeholder="このロードマップの概要・目的を書いてください（改行できます）"
            ariaLabel="ロードマップの概要"
            className="mt-3 w-full break-words bg-transparent text-[14px] leading-relaxed text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-400 dark:placeholder:text-zinc-700"
          />

          {/* タグ */}
          <div
            className="mt-3 flex flex-wrap items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            {tags.map((t) => (
              <span
                key={t}
                className="flex items-center gap-0.5 rounded-sm border border-zinc-200 py-0.5 pl-1.5 font-mono text-[11px] text-zinc-500 dark:border-zinc-800"
              >
                #{t}
                <RemoveButton
                  onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  label={`タグ ${t} を削除`}
                  className="px-1.5 py-1"
                />
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="＋ タグを追加（Enterで確定）"
              aria-label="タグを追加"
              className="min-w-[13rem] flex-1 rounded-sm bg-transparent px-1 py-1 font-mono text-[11px] text-zinc-600 placeholder:text-zinc-400 focus:outline-none dark:text-zinc-400 dark:placeholder:text-zinc-700"
            />
          </div>

          {/* 日数サマリ */}
          <div className="mb-8 mt-4 flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-900">
            <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-[2px] border border-zinc-400 dark:border-zinc-500" />
                必須
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-[2px] border border-dashed border-zinc-400 dark:border-zinc-600" />
                任意
              </span>
            </div>
            <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
              必須合計 <span className="text-zinc-700 dark:text-zinc-300">{totalDays}日</span>
            </p>
          </div>

          {errors.nodes && (
            <p className="mb-4 text-[12px] text-red-600 dark:text-red-400">{errors.nodes}</p>
          )}

          {groups.map((group, gi) => (
            <div key={group.id} className="flex flex-col items-center">
              <div
                className="mb-2 flex w-full items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  value={group.label}
                  onChange={(e) => updateGroupLabel(group.id, e.target.value)}
                  placeholder="セクション名（省略可）"
                  aria-label="セクション名"
                  className="min-w-0 flex-1 rounded-sm bg-transparent px-1 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-500 placeholder:text-zinc-400 focus:text-zinc-700 focus:outline-none dark:text-zinc-500 dark:placeholder:text-zinc-700 dark:focus:text-zinc-300"
                />
                {groups.length > 1 && (
                  <RemoveButton
                    onClick={() => removeGroup(group.id)}
                    label={`セクション「${group.label || "無題"}」を削除`}
                  >
                    <span className="whitespace-nowrap text-[11px]">✕ セクション削除</span>
                  </RemoveButton>
                )}
              </div>

              <div
                className={[
                  "w-full gap-2",
                  group.nodes.length === 1 ? "flex" : "grid",
                  group.nodes.length === 2 ? "grid-cols-2" : "",
                  group.nodes.length >= 3 ? "grid-cols-3" : "",
                ].join(" ")}
              >
                {group.nodes.map((node) => (
                  <NodeEditCard
                    key={node.id}
                    node={node}
                    selected={selectedNodeId}
                    invalid={showNodeErrors && !node.label.trim()}
                    onSelect={setSelectedNodeId}
                    onUpdate={updateNode}
                    onRemove={(nid) => removeNode(group.id, nid)}
                    canRemove={group.nodes.length > 1}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addNode(group.id);
                }}
                className="mt-2 w-full rounded-sm border border-dashed border-zinc-200 py-2 text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-600 dark:hover:text-zinc-300"
              >
                ＋ ノードを追加
              </button>

              {gi < groups.length - 1 && <Connector />}
            </div>
          ))}

          <div className="mt-4 flex flex-col items-center">
            <Connector />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                addGroup();
              }}
              className="w-full rounded-sm border border-dashed border-zinc-200 py-2 text-[12px] text-zinc-500 transition-colors hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-800 dark:text-zinc-500 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
            >
              ＋ セクションを追加
            </button>
          </div>

          <div className="h-16" />
        </div>
      </div>

      {/* ── 右：ノード詳細 / 説明 ── */}
      <div className="flex h-full w-[40%] shrink-0 flex-col overflow-y-auto">
        <div className="flex-1 px-10 py-10">
          {selectedNode ? (
            <>
              <p className="mb-6 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                ノード詳細を入力
              </p>
              <NodeDetailPanel
                node={selectedNode}
                onUpdate={(field, val) => {
                  if (!selectedNodeId) return;
                  updateNode(selectedNodeId, field, val);
                }}
                onAddResource={addResource}
                onRemoveResource={removeResource}
                onUpdateResource={updateResource}
                onAddCriterion={addCriterion}
                onRemoveCriterion={removeCriterion}
                onUpdateCriterion={updateCriterion}
              />
            </>
          ) : (
            <>
              <h2 className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {heading}
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
                左のエリアでロードマップの構造を作成してください。
              </p>
              <ul className="mt-6 space-y-3 text-[13px] text-zinc-500 dark:text-zinc-500">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-600">01</span>
                  <span>タイトル・概要・タグを入力する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-600">02</span>
                  <span>ノードの名前・日数（最大{MAX_DAYS}日）・必須/任意を設定する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-600">03</span>
                  <span>ノードをクリック → 説明・リソース・クリア基準を入力する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-600">04</span>
                  <span>「＋ ノードを追加」「＋ セクションを追加」で構造を拡張する</span>
                </li>
              </ul>
              <p className="mt-6 text-[12px] leading-relaxed text-zinc-500 dark:text-zinc-600">
                入力欄で Enter を押しても投稿されません。長い文章は自動で折り返され、
                説明欄では改行できます。
              </p>
            </>
          )}
        </div>

        <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-10 py-5 dark:border-zinc-800 dark:bg-black">
          {errors.submit && (
            <p className="mb-3 text-[12px] text-red-600 dark:text-red-400">{errors.submit}</p>
          )}
          {actions}
        </div>
      </div>
    </form>
  );
}
