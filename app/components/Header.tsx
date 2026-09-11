"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import { PlusIcon, SearchIcon } from "./icons";
import { authorFromUser } from "../lib/auth";
import { createClient } from "../lib/supabase/client";
import type { Author } from "../lib/types";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState("");
  const [user, setUser] = useState<Author | null>(null);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session ? authorFromUser(data.session.user) : null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session ? authorFromUser(session.user) : null);
    });

    return () => subscription.unsubscribe();
  }, [pathname]);

  const handleSearch = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = q.trim();
    router.push(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-5 border-b border-zinc-200 bg-white/95 px-6 backdrop-blur dark:border-zinc-800 dark:bg-black/95">
      <Link
        href="/"
        className="shrink-0 rounded-md px-1 py-1 font-mono text-[16px] font-bold tracking-tight text-zinc-900 transition-colors hover:text-black dark:text-zinc-100 dark:hover:text-white"
      >
        recipe
      </Link>

      <form onSubmit={handleSearch} className="relative flex w-full max-w-sm">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-600">
          <SearchIcon />
        </span>
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="ロードマップを検索..."
          aria-label="ロードマップを検索"
          className="w-full rounded-lg border border-zinc-300 bg-zinc-50 py-2 pl-9 pr-3 text-[14px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10"
        />
      </form>

      <nav className="ml-auto flex items-center gap-2">
        <Link
          href={user ? "/roadmap/new" : "/login?next=/roadmap/new"}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          <PlusIcon />
          投稿する
        </Link>

        {user ? (
          <>
            <Link
              href="/mypage"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-mono text-[12px] font-bold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                {user.initial}
              </span>
              <span className="max-w-[8rem] truncate text-[14px] text-zinc-700 dark:text-zinc-300">
                {user.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
            >
              ログアウト
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
          >
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
}
