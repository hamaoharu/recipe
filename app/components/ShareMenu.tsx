"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { CloseIcon, ShareIcon } from "./icons";
import {
  facebookShareUrl,
  isMobileDevice,
  lineShareUrl,
  roadmapShareText,
  roadmapShareUrl,
  threadsShareUrl,
  twitterIntentUrl,
} from "../lib/share";

type ShareMenuProps = {
  roadmapId: string;
  title: string;
  compact?: boolean;
};

export default function ShareMenu({
  roadmapId,
  title,
  compact = false,
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    const place = () => {
      const root = rootRef.current;
      const menu = menuRef.current;
      if (!root || !menu) return;

      const trigger = root.getBoundingClientRect();
      const gap = 8;
      const width = Math.min(288, window.innerWidth - gap * 2);
      let left = trigger.right - width;
      left = Math.min(Math.max(gap, left), window.innerWidth - width - gap);

      const height = menu.offsetHeight;
      let top = trigger.bottom + gap;
      if (top + height > window.innerHeight - gap) {
        const above = trigger.top - height - gap;
        top = above >= gap ? above : Math.max(gap, window.innerHeight - height - gap);
      }

      menu.style.width = `${width}px`;
      menu.style.left = `${left}px`;
      menu.style.top = `${top}px`;
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, error, copied]);

  const handleOpen = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setCopied(false);
    setError(null);
  };

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(roadmapShareUrl(roadmapId));
      setCopied(true);
    } catch {
      setError("リンクをコピーできませんでした");
    }
  };

  const shareWithSheet = async () => {
    if (typeof navigator.share !== "function") return false;
    await navigator.share({
      title,
      text: roadmapShareText(title, roadmapId),
      url: roadmapShareUrl(roadmapId),
    });
    return true;
  };

  const openSharePage = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleShareX = async (e: MouseEvent) => {
    e.stopPropagation();
    if (isMobileDevice()) {
      try {
        if (await shareWithSheet()) return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    openSharePage(twitterIntentUrl(title, roadmapId));
  };

  const handleShareLine = (e: MouseEvent) => {
    e.stopPropagation();
    openSharePage(lineShareUrl(roadmapId));
  };

  const handleShareFacebook = (e: MouseEvent) => {
    e.stopPropagation();
    openSharePage(facebookShareUrl(roadmapId));
  };

  const handleShareThreads = async (e: MouseEvent) => {
    e.stopPropagation();
    if (isMobileDevice()) {
      try {
        if (await shareWithSheet()) return;
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
      }
    }
    openSharePage(threadsShareUrl(title, roadmapId));
  };

  const handleShareOther = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      if (await shareWithSheet()) return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    setError("このブラウザでは共有シートを開けません。リンクをコピーしてください。");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={
          compact
            ? "flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[13px] text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
            : "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
        }
      >
        <ShareIcon />
        共有
      </button>

      {open && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="投稿を共有"
          className="fixed z-[60] max-h-[calc(100vh-1rem)] overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2">
            <p className="text-[13px] font-medium text-zinc-800">共有</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="閉じる"
              className="rounded-md p-1 text-zinc-500 hover:bg-zinc-100"
            >
              <CloseIcon />
            </button>
          </div>

          {error && <p className="px-3 pt-2 text-[12px] text-red-600">{error}</p>}

          <div className="flex flex-col p-1.5">
            {(
              [
                { label: "X", onClick: handleShareX },
                { label: "LINE", onClick: handleShareLine },
                { label: "Threads", onClick: handleShareThreads },
                { label: "Facebook", onClick: handleShareFacebook },
                { label: "Instagram / その他", onClick: handleShareOther },
              ] as const
            ).map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className="rounded-lg px-3 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-100"
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg px-3 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-100"
            >
              {copied ? "リンクをコピーしました" : "リンクをコピー"}
            </button>
          </div>
          <p className="px-3 pb-3 text-[11px] leading-relaxed text-zinc-400">
            リンクを貼ると図が出ます。投稿画面ではプレビューが出ないことがあります。
          </p>
        </div>
      )}
    </div>
  );
}
