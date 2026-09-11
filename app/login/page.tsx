"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getSafeRedirectPath } from "../lib/auth";
import { createClient } from "../lib/supabase/client";

type Mode = "login" | "signup";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = getSafeRedirectPath(searchParams.get("next"));

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (data.session) router.replace(next);
    }
    checkSession();
  }, [router, next]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const initial = name.trim().slice(0, 1).toUpperCase() || "U";
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              name: name.trim() || email.split("@")[0],
              initial,
            },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) throw signInError;
      }

      router.push(next);
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "ログインに失敗しました";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col px-6 py-20">
      <h1 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
        {mode === "login" ? "ログイン" : "アカウント作成"}
      </h1>
      <p className="mt-2 text-[13px] leading-relaxed text-zinc-500 dark:text-zinc-600">
        投稿やマイページを利用するにはログインが必要です。
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-3">
        {mode === "signup" && (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="表示名"
            className="w-full rounded-sm border border-zinc-300 bg-zinc-50 px-3 py-2 text-[14px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder:text-zinc-600"
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="メールアドレス"
          required
          autoComplete="email"
          className="w-full rounded-sm border border-zinc-300 bg-zinc-50 px-3 py-2 text-[14px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder:text-zinc-600"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="パスワード（6文字以上）"
          required
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          className="w-full rounded-sm border border-zinc-300 bg-zinc-50 px-3 py-2 text-[14px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:placeholder:text-zinc-600"
        />

        {error && (
          <p className="text-[12px] text-red-600 dark:text-red-400">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-sm bg-zinc-900 px-4 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        >
          {loading
            ? "処理中..."
            : mode === "login"
              ? "ログイン"
              : "アカウント作成"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "login" ? "signup" : "login"));
          setError(null);
        }}
        className="mt-4 text-center text-[12px] text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-600 dark:hover:text-zinc-300"
      >
        {mode === "login"
          ? "アカウントを作成する"
          : "すでにアカウントがある方はログイン"}
      </button>

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
