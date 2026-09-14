"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Logo from "../../components/Logo";
import { authErrorMessage } from "../../lib/auth-errors";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      router.replace("/mypage");
      router.refresh();
    } catch (err) {
      setError(authErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-zinc-200 p-5 sm:p-8">
        <div className="mb-6">
          <Logo />
        </div>
        <h1 className="text-[22px] font-bold tracking-tight text-zinc-900">
          新しいパスワード
        </h1>
        <p className="mt-2 text-[14px] text-zinc-500">
          メールのリンクから開いたあと、新しいパスワードを入力してください。
        </p>
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="新しいパスワード（6文字以上）"
            aria-label="新しいパスワード"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-lg border border-zinc-300 bg-zinc-50 px-3.5 py-2.5 text-[15px] text-zinc-800 focus:border-zinc-500 focus:outline-none"
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-lg bg-zinc-900 px-4 py-3 text-[15px] font-medium text-white hover:bg-zinc-700 disabled:opacity-60"
          >
            {loading ? "保存中..." : "パスワードを変更"}
          </button>
        </form>
      </div>
      <Link href="/login" className="mt-6 text-center text-[14px] text-zinc-500">
        ログインへ
      </Link>
    </div>
  );
}
