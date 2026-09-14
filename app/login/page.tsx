"use client";

import { Suspense, useEffect, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Logo from "../components/Logo";
import { getSafeRedirectPath } from "../lib/auth";
import { authErrorMessage } from "../lib/auth-errors";
import { createClient } from "../lib/supabase/client";

type Mode = "login" | "signup" | "reset";

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
      if (data.session && mode !== "reset") router.replace(next);
    }
    checkSession();
  }, [router, next, mode]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          { redirectTo: `${window.location.origin}/auth/reset` },
        );
        if (resetError) throw resetError;
        setNotice("パスワード再設定用のメールを送りました。メール内のリンクを開いてください。");
        setLoading(false);
        return;
      }

      if (mode === "signup") {
        const initial = name.trim().slice(0, 1).toUpperCase() || "U";
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim().slice(0, 80) || email.split("@")[0],
              initial,
            },
          },
        });
        if (signUpError) throw signUpError;

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
      setError(authErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fieldClass =
    "w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-[15px] text-zinc-800 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-900/10";

  const heading =
    mode === "login" ? "ログイン" : mode === "signup" ? "アカウント作成" : "パスワード再設定";

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-6 py-16">
      <div className="rounded-xl border border-zinc-200 p-8">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">{heading}</h1>
        <p className="mt-2 text-[14px] leading-relaxed text-zinc-500">
          {mode === "reset"
            ? "登録したメールアドレスを入力してください。"
            : "投稿やマイページを利用するにはログインが必要です。"}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
          {mode === "signup" && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="表示名"
              aria-label="表示名"
              maxLength={80}
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
          {mode !== "reset" && (
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
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
          )}
          {notice && (
            <p className="rounded-lg bg-zinc-100 px-3 py-2 text-[13px] text-zinc-700">{notice}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-60"
          >
            {loading
              ? "処理中..."
              : mode === "login"
                ? "ログイン"
                : mode === "signup"
                  ? "アカウント作成"
                  : "メールを送る"}
          </button>
        </form>

        {mode === "login" && (
          <button
            type="button"
            onClick={() => {
              setMode("reset");
              setError(null);
              setNotice(null);
            }}
            className="mt-3 w-full rounded-lg py-2 text-center text-[14px] text-zinc-600 hover:bg-zinc-100"
          >
            パスワードを忘れた
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setMode((m) => {
              if (m === "reset") return "login";
              return m === "signup" ? "login" : "signup";
            });
            setError(null);
            setNotice(null);
          }}
          className="mt-2 w-full rounded-lg py-2 text-center text-[14px] text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
        >
          {mode === "signup"
            ? "すでにアカウントがある方はログイン"
            : mode === "reset"
              ? "ログインに戻る"
              : "アカウントを作成する"}
        </button>
      </div>

      {mode === "signup" && (
        <p className="mt-4 text-center text-[12px] leading-relaxed text-zinc-500">
          登録すると
          <Link href="/legal/terms" className="underline underline-offset-2 hover:text-zinc-800">
            利用規約
          </Link>
          と
          <Link href="/legal/privacy" className="underline underline-offset-2 hover:text-zinc-800">
            プライバシーポリシー
          </Link>
          に同意したものとみなします。
        </p>
      )}

      <Link
        href="/"
        className="mt-6 rounded-lg py-2 text-center text-[14px] text-zinc-500 transition-colors hover:text-zinc-900"
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
