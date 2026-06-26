"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeRedirectPath, loginWithMockUser } from "../lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get("next"));

  useEffect(() => {
    try {
      if (localStorage.getItem("recipe_user")) {
        router.replace(next);
      }
    } catch {}
  }, [router, next]);

  const handleLogin = () => {
    loginWithMockUser();
    router.push(next);
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-6 py-20">
      <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        ログイン
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-600">
        投稿やマイページを利用するにはログインが必要です。
      </p>

      <button
        type="button"
        onClick={handleLogin}
        className="mt-8 w-full rounded-sm bg-zinc-900 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
      >
        ログインする（デモ）
      </button>

      <p className="mt-4 text-center text-[12px] text-zinc-500 dark:text-zinc-600">
        本番ではメール認証や OAuth に置き換えます
      </p>

      <Link
        href="/"
        className="mt-8 text-center text-[13px] text-zinc-500 transition-colors hover:text-zinc-800 dark:hover:text-zinc-300"
      >
        ← トップに戻る
      </Link>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
