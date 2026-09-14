import Link from "next/link";

export default function PrivacyPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-6 py-12 text-[14px] leading-relaxed text-zinc-700">
      <h1 className="text-[22px] font-bold text-zinc-900">プライバシーポリシー</h1>
      <p className="mt-4 text-zinc-500">最終更新: 2026年9月14日</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="font-semibold text-zinc-900">1. 取得する情報</h2>
          <p className="mt-2">
            アカウント作成時にメールアドレス、表示名、パスワード（暗号化して保存）を取得します。
            投稿内容、いいね、保存、閲覧の記録も保存します。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">2. 利用目的</h2>
          <p className="mt-2">
            ログイン、投稿の表示、サービスの改善、不正利用の防止に使います。
            本人の同意なく、販売や無関係な広告のために渡しません。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">3. 公開される情報</h2>
          <p className="mt-2">
            表示名、投稿、いいね数、閲覧数は他の利用者から見えます。
            メールアドレスは公開しません。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">4. 保管</h2>
          <p className="mt-2">
            データは Supabase 上に保管します。退会すると、投稿とアカウント情報は削除されます。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">5. 問い合わせ</h2>
          <p className="mt-2">
            個人情報の開示・訂正・削除の希望は、サービス運営者まで連絡してください。
          </p>
        </section>
      </div>
      <Link href="/" className="mt-10 inline-block text-zinc-500 hover:text-zinc-900">
        ← トップへ
      </Link>
    </article>
  );
}
