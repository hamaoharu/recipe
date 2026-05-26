"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const MOCK_USER = {
  id: "shogo",
  name: "shogoLog",
  initial: "S",
};

export default function Header() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recipe_user");
      if (saved) setUser(JSON.parse(saved));
    } catch {}
  }, []);

  const handleSearch = (e) => {
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
    <header className="sticky top-0 z-50 flex h-12 shrink-0 items-center gap-4 border-b border-zinc-800 bg-[#0d1117] px-6">
      <Link
        href="/"
        className="shrink-0 font-mono text-[15px] font-bold tracking-tight text-zinc-100 hover:text-white"
      >
        recipe
      </Link>

      <form onSubmit={handleSearch} className="flex w-full max-w-xs">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ロードマップを検索..."
          className="w-full rounded-sm border border-zinc-800 bg-zinc-900 px-3 py-1 text-[13px] text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
        />
      </form>

      <nav className="ml-auto flex items-center gap-4">
        <Link
          href="/roadmap/new"
          className="rounded-sm bg-zinc-100 px-3 py-1 text-[13px] font-medium text-zinc-900 transition-colors hover:bg-white"
        >
          投稿する
        </Link>

        {user ? (
          <div className="flex items-center gap-3">
            <Link
              href="/mypage"
              className="flex items-center gap-2 transition-opacity hover:opacity-70"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-700 font-mono text-[11px] font-bold text-zinc-200">
                {user.initial}
              </span>
              <span className="text-[13px] text-zinc-400">{user.name}</span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="text-[12px] text-zinc-700 transition-colors hover:text-zinc-400"
            >
              ログアウト
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleLogin}
            className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-200"
          >
            ログイン
          </button>
        )}
      </nav>
    </header>
  );
}
