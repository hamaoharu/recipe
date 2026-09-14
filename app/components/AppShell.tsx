import type { ReactNode } from "react";
import Header from "./Header";
import SiteFooter from "./SiteFooter";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">{children}</main>
      <SiteFooter />
    </>
  );
}
