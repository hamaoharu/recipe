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
    <header className="sticky top-0 z-50 shrink-0 border-b border-zinc-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-5 sm:px-6">
        <Link
          href="/"
          aria-label="recipe トップへ"
          className="shrink-0 rounded-md px-1 py-1 transition-opacity hover:opacity-80"
        >
          <Logo />
        </Link>

        <SearchBox />

        <nav className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href={user ? "/roadmap/new" : "/login?next=/roadmap/new"}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-[14px] font-medium text-white transition-colors hover:bg-zinc-700 sm:px-4"
          >
            <PlusIcon />
            <span className="hidden sm:inline">投稿する</span>
          </Link>

          {user ? (
            <>
              <Link
                href="/mypage"
                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-zinc-100 sm:px-2"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 font-mono text-[12px] font-bold text-zinc-700">
                  {user.initial}
                </span>
                <span className="hidden max-w-[8rem] truncate text-[14px] text-zinc-700 md:inline">
                  {user.name}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="hidden rounded-lg px-3 py-2 text-[13px] text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 sm:block"
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
      </div>
    </header>
  );
}
