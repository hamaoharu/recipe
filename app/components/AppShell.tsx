import type { ReactNode } from "react";
import Header from "./Header";

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white">{children}</main>
    </>
  );
}
