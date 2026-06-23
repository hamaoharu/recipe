"use client";

import type { ReactNode } from "react";
import Header from "./Header";
import { ThemeProvider } from "./ThemeProvider";

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Header />
      <main className="flex-1 bg-white dark:bg-black">{children}</main>
    </ThemeProvider>
  );
}
