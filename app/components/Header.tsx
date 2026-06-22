"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useTheme } from "./ThemeProvider";
import type { Author } from "../lib/types";

const MOCK_USER: Author = {
  id: "shogo",
  name: "shogoLog",
  initial: "S",
};

export default function Header() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [q, setQ] = useState("");
  const [user, setUser] = useState<Author | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recipe_user");
      if (saved) setUser(JSON.parse(saved) as Author);
    } catch {}
  }, []);

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  };

  const handleLogin = () => {
    localStorage.setItem("recipe_user", JSON.stringify(MOCK_USER));
    setUser(MOCK_USER);
  };

  const handleLogout = () => {
    localStorage.removeItem("recipe_user");
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-4 border-b border-zinc-200 bg-white px-6 dark:border-zinc-800 dark:bg-black">
      <Link
        href="/"
        className="shrink-0 font-mono text-[15px] font-bold tracking-tight text-zinc-900 hover:text-black dark:text-zinc-100 dark:hover:text-white"
      >
        recipe
      </Link>

      <form onSubmit={handleSearch} className="flex w-full max-w-xs">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ロードマップを検索..."
          className="w-full rounded-sm border border-zinc-300 bg-zinc-50 px-3 py-1 text-[13px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
        />
      </form>

      <nav className="ml-auto flex items-center gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
          className="rounded-sm border border-zinc-300 px-2 py-1 font-mono text-[12px] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-zinc-500 dark:hover:text-zinc-300"
        >
          {theme === "dark" ? "☀" : "☽"}
        </button>

        <Link
          href="/roadmap/new"
          className="rounded-sm bg-zinc-900 px-3 py-1 text-[13px] font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          投稿する
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/mypage"
              className="flex items-center gap-2 transition-opacity hover:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-200 font-mono text-[11px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
                {user.initial}
              </span>
              <span className="text-[13px] text-zinc-600 dark:text-zinc-400">{user.name}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[12px] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-700 dark:hover:text-zinc-400"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
          >
            ログイン
          </button>
        )}
      </nav>
    </header>
  );
}
