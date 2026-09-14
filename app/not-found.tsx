import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-24 text-center">
      <p className="text-[16px] font-medium text-zinc-800">ページが見つかりません</p>
      <Link href="/" className="text-[14px] text-zinc-600 underline underline-offset-4">
        トップへ戻る
      </Link>
    </div>
  );
}
