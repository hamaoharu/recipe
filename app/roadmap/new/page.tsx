"use client";

import { useState, useCallback } from "react";
import type * as React from "react";
import { useRouter } from "next/navigation";
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
};

type NodeEditCardProps = {
  node: EditNode;
  groupId: string;
  selected: string | null;
  onSelect: (id: string) => void;
  onUpdate: (nid: string, field: string, val: string | boolean) => void;
  onRemove: (nid: string) => void;
  canRemove: boolean;
};

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

//36進数でランダムな文字列を生成する関数
const uid = () => Math.random().toString(36).slice(2, 9);

const newNode = () => ({
  id: uid(),
  label: "",
  required: true,
  days: "",
  nodeDescription: "",
  resources: [{ id: uid(), label: "", url: "", note: "" }],
  criteria: [{ id: uid(), text: "" }],
});



const newGroup = () => ({ id: uid(), label: "", nodes: [newNode()] });

function NodeEditCard({ node, groupId, selected, onSelect, onUpdate, onRemove, canRemove }: NodeEditCardProps) {
  const isSelected = selected === node.id;
  return (
    <div
      onClick={(e) => { e.stopPropagation(); onSelect(node.id); }}
      className={[
        "group relative rounded-sm border cursor-pointer transition-colors duration-100",
        node.required ? "border-solid" : "border-dashed",
        isSelected
          ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-900"
          : "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900",
      ].join(" ")}
    >
      <div className="px-3 pt-3 pb-2">
        {/* Label */}
        <input
          value={node.label}
          onChange={(e) => onUpdate(node.id, "label", e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="ノード名"
          className={[
            "w-full bg-transparent text-[13px] font-semibold placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none",
            isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500",
          ].join(" ")}
        />
        {/* Days + required */}
        <div className="mt-2 flex items-center justify-between">
          <label
            className="flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-600"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={node.required}
              onChange={(e) => onUpdate(node.id, "required", e.target.checked)}
              className="accent-zinc-500"
            />
            必須
          </label>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={node.days}
              onChange={(e) => onUpdate(node.id, "days", e.target.value)}
              placeholder="0"
              min="0"
              className="w-10 bg-transparent text-right font-mono text-[11px] text-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none"
            />
            <span className="font-mono text-[10px] text-zinc-500 dark:text-zinc-700">日</span>
          </div>
        </div>
      </div>
      {/* Detail indicator */}
      {(node.nodeDescription || node.resources[0]?.label || node.criteria[0]?.text) && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 px-3 py-1">
          <span className="text-[10px] text-zinc-500 dark:text-zinc-700">詳細あり</span>
        </div>
      )}
      {/* Remove */}
      {canRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(node.id); }}
          className="absolute right-1 top-1 hidden text-[11px] text-zinc-500 dark:text-zinc-700 hover:text-red-600 group-hover:block"
        >
          ✕
        </button>
      )}
    </div>
  );
}

// ── Left: Connector arrow ─────────────────────────────────────────────────────
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

// ── Right: Node detail form ───────────────────────────────────────────────────
function NodeDetailPanel({ node, onUpdate, onAddResource, onRemoveResource, onUpdateResource, onAddCriterion, onRemoveCriterion, onUpdateCriterion }: NodeDetailPanelProps) {
  const inputBase = "w-full rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-3 py-2 text-[13px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none";
  const inputSm   = "rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black px-2 py-1.5 text-[12px] text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none";

  return (
    <div className="space-y-7">
      {/* Node title (readonly display) */}
      <div>
        <p className="mb-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
          編集中のノード
        </p>
        <p className="text-[16px] font-bold text-zinc-900 dark:text-zinc-100">
          {node.label || <span className="text-zinc-500 dark:text-zinc-600">（タイトル未入力）</span>}
        </p>
      </div>

      {/* Description */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">説明・思想</p>
        <textarea
          value={node.nodeDescription}
          onChange={(e) => onUpdate("nodeDescription", e.target.value)}
          placeholder="このトピックを学ぶ理由や実務での重要性を書いてください。"
          rows={4}
          className={[inputBase, "resize-none"].join(" ")}
        />
      </div>

      {/* Resources */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">推奨リソース</p>
        <div className="space-y-3">
          {node.resources.map((r, ri) => (
            <div key={r.id} className="rounded-sm border border-zinc-200 dark:border-zinc-800 p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={r.label}
                  onChange={(e) => onUpdateResource(r.id, "label", e.target.value)}
                  placeholder="リソース名・書籍名"
                  className={[inputSm, "flex-1"].join(" ")}
                />
                {node.resources.length > 1 && (
                  <button type="button" onClick={() => onRemoveResource(r.id)}
                    className="text-[12px] text-zinc-500 dark:text-zinc-700 hover:text-red-600">✕</button>
                )}
              </div>
              <input
                type="url" value={r.url}
                onChange={(e) => onUpdateResource(r.id, "url", e.target.value)}
                placeholder="URL（任意）"
                className={[inputSm, "w-full"].join(" ")}
              />
              <input
                value={r.note}
                onChange={(e) => onUpdateResource(r.id, "note", e.target.value)}
                placeholder="使い方・コメント"
                className={[inputSm, "w-full"].join(" ")}
              />
            </div>
          ))}
        </div>
        <button type="button" onClick={onAddResource}
          className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:text-zinc-300">
          ＋ リソースを追加
        </button>
      </div>

      {/* Criteria */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">クリア基準</p>
        <div className="space-y-2">
          {node.criteria.map((c, ci) => (
            <div key={c.id} className="flex items-start gap-2">
              <span className="mt-2.5 shrink-0 font-mono text-[10px] text-zinc-500 dark:text-zinc-700">
                {String(ci + 1).padStart(2, "0")}
              </span>
              <input
                value={c.text}
                onChange={(e) => onUpdateCriterion(c.id, e.target.value)}
                placeholder="これができたら次のステップへ進んでよい条件"
                className={[inputSm, "flex-1"].join(" ")}
              />
              {node.criteria.length > 1 && (
                <button type="button" onClick={() => onRemoveCriterion(c.id)}
                  className="mt-1.5 text-[12px] text-zinc-500 dark:text-zinc-700 hover:text-red-600">✕</button>
              )}
            </div>
          ))}
        </div>
        <button type="button" onClick={onAddCriterion}
          className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:text-zinc-300">
          ＋ 基準を追加
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function NewRoadmapPage() {
  const router = useRouter();

  const [title, setTitle]           = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput]     = useState("");
  const [tags, setTags]             = useState<string[]>([]);
  const [groups, setGroups]         = useState<EditGroup[]>([newGroup()]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  // Find selected node
  const selectedGroup = groups.find((g) => g.nodes.some((n) => n.id === selectedNodeId));
  const selectedNode  = selectedGroup?.nodes.find((n) => n.id === selectedNodeId);

  // ── Tags ──
  const addTag = () => {
    const t = tagInput.trim().replace(/,/g, "");
    if (t && !tags.includes(t)) setTags((p) => [...p, t]);
    setTagInput("");
  };

  // ── Groups ──
  const addGroup = () => setGroups((p) => [...p, newGroup()]);
  const removeGroup = (gid: string) => {
    setGroups((p) => p.filter((g) => g.id !== gid));
    setSelectedNodeId(null);
  };
  const updateGroupLabel = (gid: string, val: string) =>
    setGroups((p) => p.map((g) => (g.id === gid ? { ...g, label: val } : g)));

  // ── Nodes ──
  const addNode = (gid: string) =>
    setGroups((p) => p.map((g) => g.id === gid ? { ...g, nodes: [...g.nodes, newNode()] } : g));

  const removeNode = useCallback((gid: string, nid: string) => {
    setGroups((p) => p.map((g) => g.id === gid ? { ...g, nodes: g.nodes.filter((n) => n.id !== nid) } : g));
    setSelectedNodeId((prev) => prev === nid ? null : prev);
  }, []);

  const updateNode = useCallback((nid: string, field: string, val: string | boolean | EditResource[] | EditCriterion[]) =>
    setGroups((p) => p.map((g) => ({
      ...g,
      nodes: g.nodes.map((n) => n.id === nid ? { ...n, [field]: val } : n),
    }))), []);

  // ── Resources (for selected node) ──
  const addResource = () => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "resources", [
      ...selectedNode.resources,
      { id: uid(), label: "", url: "", note: "" },
    ]);
  };
  const removeResource = (rid: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "resources",
      selectedNode.resources.filter((r) => r.id !== rid));
  };
  const updateResource = (rid: string, field: string, val: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "resources",
      selectedNode.resources.map((r) => r.id === rid ? { ...r, [field]: val } : r));
  };

  // ── Criteria (for selected node) ──
  const addCriterion = () => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "criteria", [
      ...selectedNode.criteria,
      { id: uid(), text: "" },
    ]);
  };
  const removeCriterion = (cid: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "criteria",
      selectedNode.criteria.filter((c) => c.id !== cid));
  };
  const updateCriterion = (cid: string, val: string) => {
    if (!selectedNodeId || !selectedNode) return;
    updateNode(selectedNodeId, "criteria",
      selectedNode.criteria.map((c) => c.id === cid ? { ...c, text: val } : c));
  };

  // ── Submit ──
  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const errs: FormErrors = {};
    if (!title.trim()) errs.title = "タイトルは必須です";
    if (groups.some((g) => g.nodes.some((n) => !n.label.trim()))) errs.nodes = "すべてのノードにタイトルが必要です";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitting(true);

    const totalDays = groups.flatMap((g) => g.nodes).filter((n) => n.required)
      .reduce((s, n) => s + (Number(n.days) || 0), 0);

    const roadmap = {
      id: `user-${Date.now()}`,
      title: title.trim(), description: description.trim(), tags, totalDays,
      groups: groups.map((g) => ({
        id: g.id, label: g.label || null,
        nodes: g.nodes.map((n) => ({ id: n.id, label: n.label, required: n.required, days: Number(n.days) || 0 })),
      })),
      details: Object.fromEntries(
        groups.flatMap((g) => g.nodes.map((n) => [n.id, {
          title: n.label, days: Number(n.days) || 0,
          description: n.nodeDescription,
          resources: n.resources.filter((r) => r.label.trim()),
          criteria: n.criteria.map((c) => c.text).filter(Boolean),
        }]))
      ),
      author: { id: "me", name: "あなた", initial: "A" },
      likes: 0, views: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };

    try {
      const existing = JSON.parse(localStorage.getItem("user_roadmaps") ?? "[]");
      localStorage.setItem("user_roadmaps", JSON.stringify([roadmap, ...existing]));
    } catch {}
    setTimeout(() => router.push("/"), 300);
  };

  const totalDays = groups.flatMap((g) => g.nodes).filter((n) => n.required)
    .reduce((s, n) => s + (Number(n.days) || 0), 0);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex overflow-hidden text-zinc-700 dark:text-zinc-300"
      style={{ height: "calc(100vh - 48px)" }}
    >
      {/* ── Left: Visual roadmap editor ── */}
      <div className="flex h-full w-[60%] shrink-0 flex-col overflow-y-auto border-r border-zinc-200 dark:border-zinc-800"
        onClick={() => setSelectedNodeId(null)}>
        <div className="mx-auto w-full max-w-2xl px-10 py-10">

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ロードマップのタイトル"
            className={[
              "w-full bg-transparent text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none",
              errors.title ? "border-b border-red-900" : "",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          />
          {errors.title && <p className="mt-1 text-[12px] text-red-700">{errors.title}</p>}

          {/* Description */}
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="このロードマップの概要・目的を書いてください（右パネルの説明文になります）"
            rows={2}
            className="mt-3 w-full resize-none bg-transparent text-[14px] leading-relaxed text-zinc-500 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-sm border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[11px] text-zinc-500">
                #{t}
                <button type="button" onClick={() => setTags((p) => p.filter((x) => x !== t))}
                  className="text-zinc-500 dark:text-zinc-700 hover:text-zinc-700 dark:text-zinc-300">×</button>
              </span>
            ))}
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
              placeholder="＋ タグを追加"
              className="bg-transparent font-mono text-[11px] text-zinc-500 dark:text-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:text-zinc-700 dark:text-zinc-300 focus:outline-none w-24"
            />
          </div>

          {/* Days summary */}
          <div className="mb-8 mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-900 pt-3">
            <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-zinc-600">
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-[2px] border border-zinc-400 dark:border-zinc-500" />必須
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-[2px] border border-dashed border-zinc-400 dark:border-zinc-600" />任意
              </span>
            </div>
            <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
              必須合計 <span className="text-zinc-600 dark:text-zinc-400">{totalDays}日</span>
            </p>
          </div>

          {errors.nodes && <p className="mb-4 text-[12px] text-red-700">{errors.nodes}</p>}

          {/* Groups */}
          {groups.map((group, gi) => (
            <div key={group.id} className="flex flex-col items-center">
              {/* Group label */}
              <div className="mb-2 flex w-full items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  value={group.label}
                  onChange={(e) => updateGroupLabel(group.id, e.target.value)}
                  placeholder="セクション名（省略可）"
                  className="flex-1 bg-transparent font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600 placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:text-zinc-600 dark:text-zinc-400 focus:outline-none"
                />
                {groups.length > 1 && (
                  <button type="button" onClick={() => removeGroup(group.id)}
                    className="text-[10px] text-zinc-400 dark:text-zinc-800 hover:text-red-700">✕ セクション削除</button>
                )}
              </div>

              {/* Node grid */}
              <div className={[
                "w-full gap-2",
                group.nodes.length === 1 ? "flex" : "grid",
                group.nodes.length === 2 ? "grid-cols-2" : "",
                group.nodes.length >= 3 ? "grid-cols-3" : "",
              ].join(" ")}>
                {group.nodes.map((node) => (
                  <NodeEditCard
                    key={node.id}
                    node={node}
                    groupId={group.id}
                    selected={selectedNodeId}
                    onSelect={(id) => { setSelectedNodeId(id); }}
                    onUpdate={(nid, field, val) => updateNode(nid, field, val)}
                    onRemove={(nid) => removeNode(group.id, nid)}
                    canRemove={group.nodes.length > 1}
                  />
                ))}
              </div>

              {/* Add node button */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); addNode(group.id); }}
                className="mt-2 w-full rounded-sm border border-dashed border-zinc-200 dark:border-zinc-800 py-1.5 text-[12px] text-zinc-500 dark:text-zinc-700 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
              >
                ＋ ノードを追加
              </button>

              {gi < groups.length - 1 && <Connector />}
            </div>
          ))}

          {/* Add group */}
          <div className="mt-4 flex flex-col items-center">
            <Connector />
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); addGroup(); }}
              className="w-full rounded-sm border border-dashed border-zinc-200 dark:border-zinc-800 py-2 text-[12px] text-zinc-500 dark:text-zinc-600 transition-colors hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-400"
            >
              ＋ セクションを追加
            </button>
          </div>

          <div className="h-16" />
        </div>
      </div>

      {/* ── Right: Context panel ── */}
      <div className="flex h-full w-[40%] shrink-0 flex-col overflow-y-auto">
        {selectedNode ? (
          <div className="px-10 py-10">
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
          </div>
        ) : (
          <div className="flex flex-col justify-between h-full px-10 py-10">
            <div>
              <h2 className="text-[17px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                ロードマップを構築する
              </h2>
              <p className="mt-3 text-[13px] leading-relaxed text-zinc-500">
                左のエリアでロードマップの構造を作成してください。
              </p>
              <ul className="mt-6 space-y-3 text-[13px] text-zinc-500 dark:text-zinc-600">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-700">01</span>
                  <span>タイトル・概要・タグを入力する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-700">02</span>
                  <span>ノードの名前・日数・必須/任意を設定する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-700">03</span>
                  <span>ノードをクリック → 説明・リソース・クリア基準を入力する</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 font-mono text-zinc-500 dark:text-zinc-700">04</span>
                  <span>「＋ ノードを追加」「＋ セクションを追加」で構造を拡張する</span>
                </li>
              </ul>
            </div>

            {/* Submit */}
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-[13px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:text-zinc-300">
                  キャンセル
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-sm bg-zinc-900 px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  {submitting ? "投稿中..." : "投稿する"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Submit button when node is selected */}
        {selectedNode && (
          <div className="mt-auto border-t border-zinc-200 dark:border-zinc-800 px-10 py-5">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-[13px] text-zinc-500 dark:text-zinc-600 hover:text-zinc-700 dark:text-zinc-300">
                キャンセル
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-sm bg-zinc-900 px-6 py-2 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                {submitting ? "投稿中..." : "投稿する"}
              </button>
            </div>
          </div>
        )}
      </div>
    </form>
  );
}
