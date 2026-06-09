"use client";

import Header from "./Header";
import { ThemeProvider } from "./ThemeProvider";

export default function ThemeWrapper({ children }) {
  return (
    <ThemeProvider>
      <Header />
      <main className="flex-1 bg-white dark:bg-black">{children}</main>
    </ThemeProvider>
  );
}
