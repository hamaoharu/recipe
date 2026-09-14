"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { PlusIcon } from "./icons";
import Logo from "./Logo";
import SearchBox from "./SearchBox";
import { authorFromUser } from "../lib/auth";
import { createClient } from "../lib/supabase/client";
import type { Author } from "../lib/types";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
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

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-5 border-b border-zinc-200 bg-white/95 px-6 backdrop-blur">
      <Link
        href="/"
        aria-label="recipe トップへ"
        className="shrink-0 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
      >
        <Logo />
      </Link>

      <SearchBox />

      <nav className="ml-auto flex items-center gap-2">
        <Link
          href={user ? "/roadmap/new" : "/login?next=/roadmap/new"}
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-[14px] font-medium text-white transition-colors hover:bg-zinc-700"
        >
          <PlusIcon />
          投稿する
        </Link>

        {user ? (
          <>
            <Link
              href="/mypage"
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-zinc-100"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-mono text-[12px] font-bold text-zinc-700">
                {user.initial}
              </span>
              <span className="max-w-[8rem] truncate text-[14px] text-zinc-700">
                {user.name}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
            >
              ログアウト
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-[14px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            ログイン
          </Link>
        )}
      </nav>
    </header>
  );
}
