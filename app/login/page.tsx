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
  const [notice, setNotice] = useState<string | null>(null);
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
    setNotice(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const initial = name.trim().slice(0, 1).toUpperCase() || "U";
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

        //メール確認が有効だとこの時点ではまだログインしていない
        if (!signUpData.session) {
          setNotice("確認メールを送信しました。メール内のリンクを開いてから、ログインしてください。");
          setMode("login");
          setLoading(false);
          return;
        }
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

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600 dark:focus:ring-zinc-100/10";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="rounded-xl border border-zinc-200 p-8 dark:border-zinc-800">
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          {mode === "login" ? "ログイン" : "アカウント作成"}
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          投稿やマイページを利用するにはログインが必要です。
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名"
              aria-label="表示名"
              className={fieldClass}
            />
          )}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            aria-label="メールアドレス"
            required
            autoComplete="email"
            className={fieldClass}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード（6文字以上）"
            aria-label="パスワード"
            required
            minLength={6}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className={fieldClass}
          />

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-[13px] text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
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
            setNotice(null);
          }}
          className="mt-5 w-full rounded-lg py-2 text-center text-[14px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-200"
        >
          {mode === "login"
            ? "アカウントを作成する"
            : "すでにアカウントがある方はログイン"}
        </button>
      </div>

      <Link
        href="/"
        className="mt-6 rounded-lg py-2 text-center text-[14px] text-zinc-500 transition-colors hover:text-zinc-900 dark:hover:text-zinc-200"
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
