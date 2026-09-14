"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  const hideOnTallLayout =
    pathname === "/roadmap/new" || /^\/roadmap\/[^/]+(\/edit)?$/.test(pathname);
  if (hideOnTallLayout) return null;

  return (
    <footer className="border-t border-zinc-200 px-6 py-4 text-center text-[12px] text-zinc-400">
      <Link href="/legal/terms" className="hover:text-zinc-700">
        利用規約
      </Link>
      <span className="mx-2">·</span>
      <Link href="/legal/privacy" className="hover:text-zinc-700">
        プライバシーポリシー
      </Link>
    </footer>
  );
}
