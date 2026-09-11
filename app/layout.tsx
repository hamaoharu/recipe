import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ThemeWrapper from "./components/ThemeWrapper";

//フォント
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

//メタデータ
export const metadata: Metadata = {
  title: "Recipe — ロードマップ共有プラットフォーム",
  description: "技術学習ロードマップを投稿・共有・閲覧できるプラットフォーム",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    //テーマは切り替えないのでダーク固定。ライトに戻したいときは dark を外す
    <html
      lang="ja"
      className={`dark ${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col bg-white text-zinc-800 antialiased dark:bg-black dark:text-zinc-300">
        <ThemeWrapper>{children}</ThemeWrapper>
      </body>
    </html>
  );
}
