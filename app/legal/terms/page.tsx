import Link from "next/link";

export default function TermsPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-4 py-12 text-[14px] leading-relaxed text-zinc-700 sm:px-6">
      <h1 className="text-[22px] font-bold text-zinc-900">利用規約</h1>
      <p className="mt-4 text-zinc-500">最終更新: 2026年9月14日</p>
      <div className="mt-8 space-y-6">
        <section>
          <h2 className="font-semibold text-zinc-900">1. サービス</h2>
          <p className="mt-2">
            recipe は学習ロードマップを投稿・共有するためのウェブサービスです。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">2. アカウント</h2>
          <p className="mt-2">
            投稿・いいね・保存にはアカウントが必要です。登録情報は正確に保ってください。
            パスワードは他人に教えないでください。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">3. 禁止事項</h2>
          <p className="mt-2">
            法令に違反する内容、他人の権利を侵害する内容、迷惑行為、サービスの妨害、
            不正アクセスを禁止します。違反が疑われる投稿は予告なく削除することがあります。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">4. 投稿の扱い</h2>
          <p className="mt-2">
            投稿の著作権は投稿者に残ります。ただし、サービス上で表示・共有するために必要な範囲で
            利用します。公開した内容は他の利用者が閲覧できます。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">5. 免責</h2>
          <p className="mt-2">
            掲載内容の正確性や、サービスが中断なく使えることは保証しません。
            利用は自己責任でお願いします。
          </p>
        </section>
        <section>
          <h2 className="font-semibold text-zinc-900">6. 退会</h2>
          <p className="mt-2">
            マイページから退会できます。退会すると投稿も削除されます。
          </p>
        </section>
      </div>
      <Link href="/" className="mt-10 inline-block text-zinc-500 hover:text-zinc-900">
        ← トップへ
      </Link>
    </article>
  );
}
