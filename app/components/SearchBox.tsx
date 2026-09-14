"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import { fetchRoadmaps } from "../lib/roadmaps-db";
import {
  addSearchHistory,
  getSearchHistory,
  removeSearchHistory,
} from "../lib/search-history";

export default function SearchBox() {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [history, setHistory] = useState<string[]>(() => getSearchHistory());
  const [titles, setTitles] = useState<{ id: string; title: string }[]>([]);

  useEffect(() => {
    fetchRoadmaps()
      .then((list) => setTitles(list.map((r) => ({ id: r.id, title: r.title }))))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const trimmed = q.trim();

  const historyMatches = useMemo(() => {
    if (!trimmed) return history;
    return history.filter((item) => item.toLowerCase().includes(trimmed.toLowerCase()));
  }, [history, trimmed]);

  //変換中の文字でも候補を出す。IMEの途中経過も q に入る
  const titleMatches = useMemo(() => {
    if (!trimmed) return [];
    const lower = trimmed.toLowerCase();
    return titles.filter((item) => item.title.toLowerCase().includes(lower)).slice(0, 6);
  }, [titles, trimmed]);

  const goSearch = (query: string) => {
    const next = query.trim();
    addSearchHistory(next);
    setHistory(getSearchHistory());
    setQ(next);
    setOpen(false);
    router.push(next ? `/?q=${encodeURIComponent(next)}` : "/");
  };

  const showPanel = open && (historyMatches.length > 0 || titleMatches.length > 0);

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1 max-w-sm">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goSearch(q);
        }}
        className="relative flex"
      >
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
          <SearchIcon />
        </span>
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setHistory(getSearchHistory());
            setOpen(true);
          }}
          placeholder="検索..."
          aria-label="ロードマップを検索"
          aria-controls="search-suggest"
          autoComplete="off"
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2 pl-9 pr-3 text-[14px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10"
        />
      </form>

      {showPanel && (
        <div
          id="search-suggest"
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
        >
          {historyMatches.length > 0 && (
            <div className="py-1">
              <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                検索履歴
              </p>
              {historyMatches.map((item) => (
                <div key={item} className="flex items-center hover:bg-zinc-50">
                  <button
                    type="button"
                    onClick={() => goSearch(item)}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-[13px] text-zinc-700"
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    aria-label={`${item} を履歴から削除`}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSearchHistory(item);
                      setHistory(getSearchHistory());
                    }}
                    className="px-3 py-2 text-[12px] text-zinc-400 hover:text-zinc-700"
                  >
                    削除
                  </button>
                </div>
              ))}
            </div>
          )}

          {titleMatches.length > 0 && (
            <div className="border-t border-zinc-100 py-1">
              <p className="px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                候補
              </p>
              {titleMatches.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    addSearchHistory(item.title);
                    setHistory(getSearchHistory());
                    setOpen(false);
                    router.push(`/roadmap/${item.id}`);
                  }}
                  className="block w-full truncate px-3 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-50"
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
