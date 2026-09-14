"use client";

import { useEffect, useRef, useState, type MouseEvent, type RefObject } from "react";
import { CameraIcon, CloseIcon, ShareIcon } from "./icons";
import {
  captureRoadmapImage,
  dataUrlToFile,
} from "../lib/capture-roadmap";
import {
  downloadDataUrl,
  facebookShareUrl,
  lineShareUrl,
  roadmapShareText,
  roadmapShareUrl,
  threadsShareUrl,
  twitterIntentUrl,
} from "../lib/share";

type ShareMenuProps = {
  roadmapId: string;
  title: string;
  //詳細ページの地図。あるときだけ画像付き共有とスクショができる
  captureTarget?: RefObject<HTMLElement | null>;
  compact?: boolean;
};

export default function ShareMenu({
  roadmapId,
  title,
  captureTarget,
  compact = false,
}: ShareMenuProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: Event) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const prepareImage = async () => {
    if (!captureTarget?.current) return null;
    setCapturing(true);
    setError(null);
    try {
      const url = await captureRoadmapImage(captureTarget.current, title);
      setImageUrl(url);
      return url;
    } catch (e) {
      console.error(e);
      setError("画像を作れませんでした。もう一度お試しください。");
      return null;
    } finally {
      setCapturing(false);
    }
  };

  const handleOpen = async (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
    setCopied(false);
    if (captureTarget?.current && !imageUrl) {
      await prepareImage();
    }
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

  const handleSaveImage = async (e: MouseEvent) => {
    e.stopPropagation();
    const url = imageUrl ?? (await prepareImage());
    if (!url) return;
    downloadDataUrl(url, `${title || "roadmap"}.png`);
  };

  //スマホの共有シート。Instagram など、Webから直接投稿できないアプリ向け
  const shareWithSheet = async (withImage: boolean) => {
    const url = withImage
      ? imageUrl ?? (captureTarget?.current ? await prepareImage() : null)
      : null;

    if (url && typeof navigator.canShare === "function") {
      const file = dataUrlToFile(url, `${title || "roadmap"}.png`);
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: roadmapShareText(title, roadmapId),
          title,
        });
        return true;
      }
    }

    if (typeof navigator.share === "function") {
      await navigator.share({
        title,
        text: roadmapShareText(title, roadmapId),
        url: roadmapShareUrl(roadmapId),
      });
      return true;
    }

    return false;
  };

  const openSharePage = (href: string, attachImage: boolean) => {
    if (attachImage && imageUrl) {
      downloadDataUrl(imageUrl, `${title || "roadmap"}.png`);
    }
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleShareX = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      if (await shareWithSheet(true)) return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    openSharePage(twitterIntentUrl(title, roadmapId), !!captureTarget);
  };

  const handleShareLine = (e: MouseEvent) => {
    e.stopPropagation();
    openSharePage(lineShareUrl(roadmapId), false);
  };

  const handleShareFacebook = (e: MouseEvent) => {
    e.stopPropagation();
    openSharePage(facebookShareUrl(roadmapId), false);
  };

  const handleShareThreads = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      if (await shareWithSheet(true)) return;
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
    }
    openSharePage(threadsShareUrl(title, roadmapId), !!captureTarget);
  };

  const handleShareOther = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      if (await shareWithSheet(true)) return;
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
          role="dialog"
          aria-label="投稿を共有"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg"
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

          {captureTarget && (
            <div className="border-b border-zinc-100 bg-zinc-50 p-3">
              {capturing && (
                <p className="py-6 text-center text-[12px] text-zinc-500">画像を作成中...</p>
              )}
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element -- その場で作った data URL
                <img
                  src={imageUrl}
                  alt={`${title} のロードマップ`}
                  className="max-h-36 w-full rounded-md border border-zinc-200 object-cover object-top"
                />
              )}
            </div>
          )}

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
            {captureTarget && (
              <button
                type="button"
                onClick={handleSaveImage}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] text-zinc-700 hover:bg-zinc-100"
              >
                <CameraIcon className="h-4 w-4" />
                図を保存
              </button>
            )}
          </div>
          <p className="px-3 pb-3 text-[11px] leading-relaxed text-zinc-400">
            LINEとFacebookはリンクを貼ると図が出ます。Instagramはスマホの共有シートから送れます。
          </p>
        </div>
      )}
    </div>
  );
}
