import type { ReactNode } from "react";
import Header from "./Header";

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1 bg-white dark:bg-black">{children}</main>
    </>
  );
}
