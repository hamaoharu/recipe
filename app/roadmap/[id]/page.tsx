"use client";

import { use, useState, useEffect, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getRoadmap } from "../../lib/roadmaps";
import { Roadmap } from "@/app/lib/types";

//型定義
type RoadmapNode = {
  id: string;
  label: string;
  required: boolean;
  days: number;
}

type RoadmapGroup = {
  id: string;
  label: string | null;
  nodes: RoadmapNode[];
}

type NodeBoxProps = {
  node: RoadmapNode;
  selected: string | null;

  //関数の型だけ指定する書き方
  onClick: (nodeId: string) => void;
}

type DetailResource = {
  label: string;
  url: string | null;
  note: string;
};

type DetailCriterion = string | { text: string };

type DetailItem = {
  title: string;
  days: number;
  description: string;
  resources: DetailResource[];
  criteria: DetailCriterion[];
};

type DetailMap = Record<string, DetailItem>;

type userRoadmap = Roadmap & {
  groups: RoadmapGroup[];
  details: DetailMap;
}

const GROUPS: RoadmapGroup[] = [
  {
    id: "start", label: null,
    nodes: [
      { id: "internet", label: "Internet", required: true, days: 3 },
    ],
  },
  {
    id: "fundamentals", label: "Web 基礎",
    nodes: [
      { id: "html", label: "HTML",        required: true, days: 10 },
      { id: "css",  label: "CSS",         required: true, days: 14 },
      { id: "js",   label: "JavaScript",  required: true, days: 21 },
    ],
  },
  {
    id: "vcs", label: "バージョン管理",
    nodes: [
      { id: "git",    label: "Git",    required: true, days: 5 },
      { id: "github", label: "GitHub", required: true, days: 3 },
    ],
  },
  {
    id: "pkg", label: "パッケージ管理",
    nodes: [
      { id: "npm",  label: "npm",  required: true,  days: 2 },
      { id: "pnpm", label: "pnpm", required: false, days: 1 },
      { id: "yarn", label: "Yarn", required: false, days: 1 },
    ],
  },
  {
    id: "css_tools", label: "CSS フレームワーク / 設計",
    nodes: [
      { id: "tailwind", label: "Tailwind CSS", required: true,  days: 7 },
      { id: "sass",     label: "Sass / SCSS",  required: false, days: 5 },
      { id: "cssmod",   label: "CSS Modules",  required: false, days: 3 },
    ],
  },
  {
    id: "framework", label: "JS フレームワーク（1つ選ぶ）",
    nodes: [
      { id: "react",  label: "React",  required: true,  days: 28 },
      { id: "vue",    label: "Vue.js", required: false, days: 21 },
      { id: "svelte", label: "Svelte", required: false, days: 14 },
    ],
  },
  {
    id: "build", label: "ビルドツール",
    nodes: [
      { id: "vite",    label: "Vite",    required: true,  days: 3 },
      { id: "webpack", label: "Webpack", required: false, days: 5 },
    ],
  },
  {
    id: "testing", label: "テスト",
    nodes: [
      { id: "vitest",     label: "Vitest",     required: true,  days: 7 },
      { id: "playwright", label: "Playwright", required: false, days: 7 },
    ],
  },
  {
    id: "typescript", label: "TypeScript",
    nodes: [
      { id: "ts", label: "TypeScript", required: true, days: 14 },
    ],
  },
  {
    id: "deploy", label: "デプロイ・インフラ",
    nodes: [
      { id: "vercel", label: "Vercel / Netlify", required: true,  days: 2  },
      { id: "docker", label: "Docker 基礎",       required: false, days: 10 },
    ],
  },
];

const TOTAL_REQUIRED_DAYS = GROUPS.flatMap((g) => g.nodes)
  .filter((n) => n.required)
  //配列を一つの結果にする
  .reduce((sum, n) => sum + n.days, 0);

// ── Detail content ────────────────────────────────────────────────────────────
const DETAILS = {
  internet: {
    title: "Internet の仕組み", days: 3,
    description: "HTTP とブラウザの動作を知らずに書いたコードは、なぜ遅いのか・なぜ壊れるのかが永遠にわからない。ここは「読み物として1週間で終わらせる」フェーズ。手を動かす必要はない。",
    resources: [
      { label: "MDN — HTTP の概要", url: "https://developer.mozilla.org/ja/docs/Web/HTTP/Overview", note: "公式ドキュメントの日本語版。まずここを通読する" },
      { label: "「Web技術の基本」（著：小林恭平）", url: null, note: "HTTP・DNS・セキュリティを図解で学べる入門書。1〜2日で読了可能" },
      { label: "Chrome DevTools — Network タブ", url: "https://developer.chrome.com/docs/devtools/network/", note: "実際のリクエストを目で見て学ぶのが最速" },
    ],
    criteria: [
      "ブラウザに URL を打ち込んでからページが表示されるまでの流れを、DNS → TCP → HTTP → レンダリングの順で口頭で説明できる",
      "Chrome DevTools の Network タブで、ステータスコード・ヘッダ・レスポンスボディを読み取れる",
      "HTTP と HTTPS の違い、および HTTPS で何が暗号化されているかを説明できる",
    ],
  },
  html: {
    title: "HTML", days: 10,
    description: "HTML は「見た目」ではなく「意味」を書く言語。この認識がないままコーディングを続けると、div だらけの意味不明な構造を量産することになる。",
    resources: [
      { label: "『1冊ですべて身につくHTML & CSS』（Mana 著）", url: null, note: "デザイナー視点も含めた国内最良の入門書。Chapter 1〜5 を優先して読む" },
      { label: "MDN — HTML 要素リファレンス", url: "https://developer.mozilla.org/ja/docs/Web/HTML/Element", note: "辞書として常に手元に置く" },
      { label: "web.dev — Learn HTML（Google）", url: "https://web.dev/learn/html", note: "Google 公式の体系的コース。セマンティクスの章が特に優秀" },
    ],
    criteria: [
      "Figma のデザインカンプを見て、article / section / nav / aside の使い分けを迷わず選択できる",
      "フォームを label・input・fieldset で正しくマークアップし、クリックで対応 input にフォーカスが当たる",
      "Wave（アクセシビリティチェッカー）にかけてエラーゼロにできる",
    ],
  },
  css: {
    title: "CSS", days: 14,
    description: "CSS の習得で詰まる人の9割は「Flexbox と Grid の使い分けが感覚でわかっていない」だけ。この2つを体に染み込ませれば、大抵のレイアウトは書ける。",
    resources: [
      { label: "『CSSの教科書』（著：草野あけみ）", url: null, note: "Flexbox・Grid を中心に、なぜそう動くのかの理屈から解説している国内最良書" },
      { label: "Flexbox Froggy", url: "https://flexboxfroggy.com/#ja", note: "ゲーム形式で Flexbox を完全習得できる。30分で終わる" },
      { label: "Grid Garden", url: "https://cssgridgarden.com/#ja", note: "Grid の直感的理解に最適" },
      { label: "Josh W. Comeau — CSS for JavaScript Developers", url: "https://css-for-js.dev/", note: "CSS の「なぜ」を最も深く解説している英語コース" },
    ],
    criteria: [
      "2カラムレイアウト・カードグリッド・ナビゲーションバーを Flexbox または Grid で実装できる",
      "clamp() または auto-fill を使ったレスポンシブレイアウトをメディアクエリなしで実装できる",
      "CSS カスタムプロパティでカラーパレットを定義し、ダークモード切り替えを実装できる",
    ],
  },
  js: {
    title: "JavaScript", days: 21,
    description: "JS の学習は「構文を覚えること」ではなく「非同期処理とイベントの仕組みを理解すること」が核心。ここを誤魔化すと React を学んでも永遠に useEffect が理解できない。",
    resources: [
      { label: "『JavaScript Primer』（著：azu）", url: "https://jsprimer.net/", note: "無料・Web 公開。ES2015+ を前提にした国内唯一の体系的入門書。必読" },
      { label: "『JavaScript: The Good Parts』（著：Douglas Crockford）", url: null, note: "薄いが本質的。JS の設計上の罠を理解するために読む" },
      { label: "javascript.info", url: "https://ja.javascript.info/", note: "英語（日本語訳あり）。非同期の章が特に優秀" },
    ],
    criteria: [
      "fetch() で外部 API からデータを取得し、DOM に一覧表示するコードを非同期処理で書ける",
      "addEventListener と Promise の仕組みを、コールスタックとイベントループの概念を使って他人に説明できる",
      "Chrome DevTools のデバッガでブレークポイントを使いながらステップ実行でき、変数の値を追跡できる",
    ],
  },
  git: {
    title: "Git", days: 5,
    description: "Git は「コマンドを暗記するツール」ではなく「スナップショットの集合体を操作する概念」だ。内部モデルを理解すれば、どんなコマンドも迷わなくなる。",
    resources: [
      { label: "Pro Git（日本語版・無料）", url: "https://git-scm.com/book/ja/v2", note: "公式の無料書籍。Chapter 1〜3 を読めば実務レベルには十分" },
      { label: "『わかばちゃんと学ぶ Git使い方入門』", url: null, note: "漫画形式で Git の概念を視覚的に理解できる入門書" },
      { label: "Learn Git Branching", url: "https://learngitbranching.js.org/?locale=ja", note: "ブランチの動きをビジュアルで体験できる無料インタラクティブサイト。必須" },
    ],
    criteria: [
      "feature ブランチを切り、複数 commit を積み、main にマージし、不要ブランチを削除する一連の操作をコマンドラインだけで完結できる",
      "意図せず main に commit してしまったコードを git reset または git revert で安全に取り消せる",
      "コンフリクトが発生したとき、マーカーの意味を理解した上で手動解消し、動作確認後に commit できる",
    ],
  },
  github: {
    title: "GitHub", days: 3,
    description: "GitHub は「コードの保存場所」ではなく「チームのコミュニケーション基盤」だ。PR とコードレビューの文化を理解してこそ、チーム開発に入れる。",
    resources: [
      { label: "GitHub Docs — Pull Request について", url: "https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests", note: "PR の基本概念から読む" },
      { label: "GitHub Actions 公式ドキュメント", url: "https://docs.github.com/ja/actions", note: "lint・test・deploy の自動化。Quickstart から始める" },
      { label: "『GitHub実践入門』（著：大塚弘記）", url: null, note: "ハンズオン形式でチーム開発フローを体験できる国内書籍" },
    ],
    criteria: [
      "個人リポジトリで feature ブランチから PR を作成し、セルフレビュー後に main にマージするワークフローを習慣化できている",
      "GitHub Actions で push 時に ESLint が自動実行され、エラーがあれば PR がブロックされる CI を設定できる",
      "README.md に概要・セットアップ手順・使い方を書き、他人がクローンして動かせる状態にできる",
    ],
  },
  npm: {
    title: "npm", days: 2,
    description: "npm は「ライブラリを入れるコマンド」ではない。依存関係の解決・タスクの自動化・プロジェクトの再現性確保を担う、開発インフラの中枢だ。",
    resources: [
      { label: "npm 公式ドキュメント", url: "https://docs.npmjs.com/", note: "Getting Started + CLI Commands を一通り読む" },
      { label: "Node.js 公式ガイド — パッケージマネージャー", url: "https://nodejs.org/ja/learn/getting-started/an-introduction-to-the-npm-package-manager", note: "npm の設計思想を正確に理解するための公式解説" },
    ],
    criteria: [
      "package.json の scripts に build / dev / lint / test を定義し、npm run コマンドで実行できる",
      "dependencies と devDependencies の違いを説明でき、正しい flag でインストールできる",
      "package-lock.json をコミットする理由と、npm ci と npm install の使い分けを説明できる",
    ],
  },
  tailwind: {
    title: "Tailwind CSS", days: 7,
    description: "Tailwind は「CSS を書かなくていい」ツールではなく「CSS の設計判断をコンポーネント側に委譲する」ツールだ。CSS の基礎なしに使うと、クラスを無限に貼り付けるだけの人になる。",
    resources: [
      { label: "Tailwind CSS 公式ドキュメント", url: "https://tailwindcss.com/docs/", note: "Core Concepts（ユーティリティファースト・レスポンシブ・ダークモード）を最初に読む" },
      { label: "Tailwind UI（公式コンポーネント集）", url: "https://tailwindui.com/", note: "有料だが実装パターンの宝庫。無料サンプルだけでも参考になる" },
      { label: "shadcn/ui のソースコード", url: "https://ui.shadcn.com/", note: "Tailwind + Radix UI の実装。プロのコンポーネント設計を読み取る素材として使う" },
    ],
    criteria: [
      "デザインカンプを Tailwind クラスだけでピクセルパーフェクトに再現できる",
      "sm: / md: / lg: のブレークポイントでモバイル → デスクトップのレスポンシブを実装できる",
      "繰り返し使う UI（Button・Badge など）を React コンポーネント化し、className props で拡張できる設計にできる",
    ],
  },
  react: {
    title: "React", days: 28,
    description: "React の難しさの本質は「フック」ではなく「宣言的 UI とレンダリングのメンタルモデル」にある。これを掴む前に useEffect を使うと、無限ループと戦い続けることになる。",
    resources: [
      { label: "React 公式ドキュメント（react.dev）", url: "https://ja.react.dev/", note: "2023年リニューアル版。チュートリアルと「React の流儀」は必読" },
      { label: "Next.js 公式ドキュメント — App Router", url: "https://nextjs.org/docs/app", note: "React の学習と並行して進める。App Router の基礎から" },
      { label: "『りあクト！TypeScriptで始めるつらくないReact開発』", url: null, note: "React の思想から丁寧に解説した国内最良の上級書" },
    ],
    criteria: [
      "外部 API からデータを fetch し、ローディング・エラー・成功の3状態を useState で管理して UI に反映できる",
      "バケツリレーが3階層を超えたとき、Context または状態管理ライブラリへのリファクタリング判断ができる",
      "useEffect の依存配列を正確に設定でき、ESLint の exhaustive-deps ルールの警告をゼロにできる",
    ],
  },
  vite: {
    title: "Vite", days: 3,
    description: "ビルドツールは「設定するもの」ではなく「動作を理解するもの」だ。Vite が何をやっているかを知ることで、バンドルサイズ・ビルド速度・デプロイ戦略の判断ができるようになる。",
    resources: [
      { label: "Vite 公式ドキュメント", url: "https://ja.vitejs.dev/", note: "Why Vite のページから読み始める。設計思想の理解が先" },
      { label: "Rollup 公式ドキュメント", url: "https://rollupjs.org/", note: "Vite の本番ビルドの仕組みを理解したくなったら参照" },
    ],
    criteria: [
      "vite.config.js にパスエイリアス（@/ → src/）と開発サーバーのプロキシ設定を追加できる",
      "本番ビルド後の dist フォルダを確認し、バンドルサイズをチャンク分割で削減できる",
      "環境変数（.env / .env.production）の使い方を理解し、VITE_ プレフィックスのルールを説明できる",
    ],
  },
  ts: {
    title: "TypeScript", days: 14,
    description: "TypeScript は「型を書くための言語」ではなく「コンパイラに設計の矛盾を教えてもらうための対話ツール」だ。エラーを憎まず、エラーを読む習慣をつける。",
    resources: [
      { label: "TypeScript 公式ハンドブック", url: "https://www.typescriptlang.org/docs/handbook/intro.html", note: "Everyday Types → Narrowing → Functions の順に読む" },
      { label: "『プログラミングTypeScript』（著：Boris Cherny）", url: null, note: "型システムの深い理解のための一冊。中〜上級者向け" },
      { label: "type-challenges", url: "https://github.com/type-challenges/type-challenges", note: "型パズルで TypeScript の型操作力を鍛える OSS。Easy から始める" },
    ],
    criteria: [
      "React コンポーネントの Props に正確な型定義を付け、不正な値を渡したときにコンパイルエラーにできる",
      "API レスポンスの型を定義し、zod などのバリデーションライブラリで実行時型チェックまで実装できる",
      "any を一切使わずに、既存の JavaScript ファイルを TypeScript に移行できる",
    ],
  },
  vercel: {
    title: "Vercel / Netlify", days: 2,
    description: "デプロイは「完成してから考えること」ではない。開発の初日に CI/CD を整備し、main への push が自動でプロダクションに反映される状態を作ることが、現代の開発の最低ラインだ。",
    resources: [
      { label: "Vercel 公式ドキュメント — Get Started", url: "https://vercel.com/docs/getting-started-with-vercel", note: "GitHub 連携からデプロイまで15分で完了する" },
      { label: "Vercel — Environment Variables", url: "https://vercel.com/docs/projects/environment-variables", note: "本番・Preview・Development の環境変数の分離方法" },
      { label: "GitHub Actions + Vercel の連携パターン", url: "https://vercel.com/guides/how-can-i-use-github-actions-with-vercel", note: "独自の CI を挟んでから Vercel にデプロイするパターン" },
    ],
    criteria: [
      "GitHub リポジトリと Vercel を連携し、main push → 本番デプロイ、PR 作成 → Preview URL 発行が自動で動く状態を作れる",
      "本番環境の環境変数を Vercel のダッシュボードで管理し、コードにハードコードされていない状態を維持できる",
      "デプロイ失敗時にビルドログを読んで原因を特定し、修正 push で再デプロイを成功させられる",
    ],
  },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function Connector() {
  return (
    <div className="flex flex-col items-center py-1">
      <div className="h-5 w-px bg-zinc-300 dark:bg-zinc-700" />
      <svg width="10" height="6" viewBox="0 0 10 6" fill="none" className="text-zinc-500 dark:text-zinc-700">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
    </div>
  );
}

function NodeBox({ node, selected, onClick }: NodeBoxProps) {
  const isSelected = selected === node.id;
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onClick(node.id); }}
      className={[
        "rounded-sm px-3 py-3 text-left transition-colors duration-100",
        node.required ? "border" : "border border-dashed",
        isSelected
          ? "border-zinc-500 dark:border-zinc-400 bg-zinc-100 dark:bg-zinc-900"
          : node.required
          ? "border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-900"
          : "border-zinc-300/80 dark:border-zinc-800/80 bg-white dark:bg-black hover:border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:bg-zinc-950",
      ].join(" ")}
    >
      <div className="flex items-end justify-between gap-2">
        <p className={[
          "text-[13px] font-semibold leading-tight",
          isSelected ? "text-zinc-900 dark:text-zinc-100" : "text-zinc-500",
        ].join(" ")}>
          {node.label}
        </p>
        <p className={[
          "shrink-0 font-mono text-[10px]",
          isSelected ? "text-zinc-600 dark:text-zinc-400" : "text-zinc-500 dark:text-zinc-600",
        ].join(" ")}>{node.days}日</p>
      </div>
    </button>
  );
}

function DetailSection({ label, children }:{ label: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="border-b border-zinc-200 dark:border-zinc-800 pb-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
        {label}
      </h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

//Promise 後で値が来る型 Promise<T> はあとで Tが来る
export default function RoadmapDetailPage({ params }:{ params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const staticMeta = getRoadmap(id);
  const [userRoadmap, setUserRoadmap] = useState<userRoadmap | null>(null);

  useEffect(() => {
    if (staticMeta) return;
    try {
      const saved = JSON.parse(localStorage.getItem("user_roadmaps") ?? "[]") as Roadmap[];

      //findは一件だけ返す
      const found = saved.find((r) => r.id === id);
      if (found) setUserRoadmap(found);
    } catch {}
  }, [id, staticMeta]);

  const isUser   = !staticMeta && userRoadmap;
  const activeGroups  = isUser ? userRoadmap.groups  : GROUPS;
  const activeDetails = isUser ? userRoadmap.details : DETAILS;
  const activeTotalDays = isUser
    ? userRoadmap.totalDays
    : TOTAL_REQUIRED_DAYS;

  const meta = staticMeta ?? userRoadmap ?? {
    title: "Roadmap",
    author: { id: "unknown", name: "anonymous", initial: "A" },
    tags: [],
    likes: 0,
    totalDays: 0,
    createdAt: "",
  };

  const [selected, setSelected] = useState(null);
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);

  const handleSelect = (nodeId) => setSelected((prev) => (prev === nodeId ? null : nodeId));

  const isOwner = isUser; // user-created roadmaps belong to the logged-in user
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("user_roadmaps") ?? "[]");
      localStorage.setItem("user_roadmaps", JSON.stringify(saved.filter((r) => r.id !== id)));
    } catch {}
    router.push("/");
  };

  return (
    <div
      className="flex overflow-hidden text-zinc-700 dark:text-zinc-300"
      style={{ height: "calc(100vh - 48px)" }}
      onClick={() => setSelected(null)}
    >
      {/* ── Left 60%: roadmap ── */}
      <aside className="flex h-full w-[60%] shrink-0 flex-col overflow-y-auto border-r border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto w-full max-w-2xl px-10 py-10">

          {/* Back + meta */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="font-mono text-[12px] text-zinc-500 dark:text-zinc-600 transition-colors hover:text-zinc-700 dark:text-zinc-300"
              >
                ← 一覧に戻る
              </Link>
              {isOwner && (
                deleteConfirm ? (
                  <span className="flex items-center gap-3">
                    <span className="text-[12px] text-zinc-500">本当に削除しますか？</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                      className="text-[12px] text-red-600 transition-colors hover:text-red-400"
                    >
                      削除する
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteConfirm(false); }}
                      className="text-[12px] text-zinc-500 dark:text-zinc-700 transition-colors hover:text-zinc-600 dark:hover:text-zinc-400"
                    >
                      キャンセル
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(true); }}
                    className="font-mono text-[12px] text-zinc-500 dark:text-zinc-700 transition-colors hover:text-red-700"
                  >
                    削除
                  </button>
                )
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setBookmarked((v) => !v); }}
                className={[
                  "text-[13px] transition-colors",
                  bookmarked ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400",
                ].join(" ")}
                title="ブックマーク"
              >
                {bookmarked ? "★" : "☆"}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLiked((v) => !v); }}
                className={[
                  "flex items-center gap-1 text-[13px] transition-colors",
                  liked ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400",
                ].join(" ")}
                title="いいね"
              >
                <span>{liked ? "♥" : "♡"}</span>
                <span>{meta.likes + (liked ? 1 : 0)}</span>
              </button>
            </div>
          </div>

          {/* Title + author */}
          <div className="mb-2">
            <h1 className="text-[18px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {meta.title}
            </h1>
            <div className="mt-2 flex items-center gap-2 text-[12px] text-zinc-500 dark:text-zinc-600">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                {meta.author.initial}
              </span>
              <span>{meta.author.name}</span>
              {meta.createdAt && (
                <>
                  <span className="text-zinc-400 dark:text-zinc-800">·</span>
                  <span>{meta.createdAt}</span>
                </>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(meta.tags ?? []).map((tag) => (
                <Link
                  key={tag}
                  href={`/?tag=${encodeURIComponent(tag)}`}
                  className="rounded-sm border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-zinc-500 dark:text-zinc-600 transition-colors hover:border-zinc-400 dark:hover:border-zinc-600 hover:text-zinc-600 dark:hover:text-zinc-400"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Days + legend */}
          <div className="mb-8 mt-4 flex items-center justify-between border-t border-zinc-200 dark:border-zinc-900 pt-4">
            <div className="flex items-center gap-5">
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-zinc-400 dark:border-zinc-500" />
                必須
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                <span className="inline-block h-2.5 w-2.5 rounded-[2px] border border-dashed border-zinc-400 dark:border-zinc-600" />
                任意
              </span>
            </div>
            <p className="font-mono text-[12px] text-zinc-500 dark:text-zinc-600">
              <span className="text-zinc-600 dark:text-zinc-400">{activeTotalDays} 日</span>
            </p>
          </div>

          {/* Groups */}
          {activeGroups.map((group, gi) => (
            <div key={group.id} className="flex flex-col items-center">
              {group.label && (
                <p className="mb-2 self-start font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className={[
                "w-full",
                group.nodes.length === 1 ? "flex" : "grid gap-2",
                group.nodes.length === 2 ? "grid-cols-2" : "",
                group.nodes.length >= 3 ? "grid-cols-3" : "",
              ].join(" ")}>
                {group.nodes.map((node) => (
                  <NodeBox
                    key={node.id}
                    node={node}
                    selected={selected}
                    onClick={handleSelect}
                  />
                ))}
              </div>
              {gi < activeGroups.length - 1 && <Connector />}
            </div>
          ))}

          <div className="h-16" />
        </div>
      </aside>

      {/* ── Right 40%: detail / overview ── */}
      <div className="h-full w-[40%] shrink-0 overflow-y-auto">
        {!selected ? (
          /* Overview */
          <div className="px-10 py-10">
            <h2 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              {meta.title}
            </h2>
            <p className="mt-4 text-[14px] leading-[1.85] text-zinc-500">
              {meta.description ?? "ノードをクリックすると詳細が表示されます。"}
            </p>

            {/* Timeline bar chart */}
            <div className="mt-8 rounded-sm border border-zinc-200 dark:border-zinc-800 p-5">
              <p className="mb-4 font-mono text-[10px] uppercase tracking-widest text-zinc-500 dark:text-zinc-600">
                全体スケジュール（必須ルート）
              </p>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[32px] font-bold leading-none text-zinc-900 dark:text-zinc-100">
                  {activeTotalDays}
                </span>
                <span className="text-[13px] text-zinc-500">日</span>
                <span className="ml-1 text-[13px] text-zinc-500 dark:text-zinc-600">
                  ≈ {Math.round(activeTotalDays / 30)} ヶ月
                </span>
              </div>
              <p className="mt-2 text-[12px] text-zinc-500 dark:text-zinc-600">
                1〜2時間/日で学習した場合の目安。
              </p>
              <div className="mt-5 space-y-2">
                {activeGroups.map((g) => {
                  const req = g.nodes.filter((n) => n.required);
                  if (req.length === 0) return null;
                  const total = req.reduce((s, n) => s + n.days, 0);
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <div className="w-28 shrink-0">
                        <p className="truncate font-mono text-[11px] text-zinc-500">
                          {g.label ?? req[0].label}
                        </p>
                      </div>
                      <div className="flex flex-1 items-center gap-2">
                        <div
                          className="h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700"
                          style={{ width: `${activeTotalDays ? Math.round((total / activeTotalDays) * 100) : 0}%`, minWidth: "4px" }}
                        />
                        <span className="shrink-0 font-mono text-[10px] text-zinc-500 dark:text-zinc-600">
                          {total}日
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Node detail */
          <article className="px-10 py-10 text-[15px] leading-[1.8] text-zinc-700 dark:text-zinc-300">
            <div className="flex items-baseline justify-between gap-4 border-b-2 border-zinc-300 dark:border-zinc-700 pb-2">
              <h2 className="text-[20px] font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                {activeDetails[selected]?.title ?? selected}
              </h2>
              {activeDetails[selected]?.days && (
                <span className="shrink-0 font-mono text-[13px] text-zinc-500">
                  {activeDetails[selected].days}<span className="ml-0.5 text-zinc-500 dark:text-zinc-700">日</span>
                </span>
              )}
            </div>

            {activeDetails[selected] ? (
              <>
                <p className="mt-5 text-[14px] leading-[1.85] text-zinc-600 dark:text-zinc-400">
                  {activeDetails[selected].description}
                </p>

                <DetailSection label="推奨リソース">
                  <ul className="space-y-4">
                    {activeDetails[selected].resources.map((r, i) => (
                      <li key={i} className="border-b border-zinc-200 dark:border-zinc-900 pb-4 last:border-b-0 last:pb-0">
                        <p className="text-[14px] font-semibold text-zinc-800 dark:text-zinc-200">
                          {r.url ? (
                            <a href={r.url} target="_blank" rel="noopener noreferrer"
                              className="underline decoration-zinc-700 underline-offset-2 hover:decoration-zinc-400">
                              {r.label}
                            </a>
                          ) : r.label}
                        </p>
                        <p className="mt-1 text-[13px] text-zinc-500">{r.note}</p>
                      </li>
                    ))}
                  </ul>
                </DetailSection>

                <DetailSection label="クリア基準">
                  <ul className="space-y-3">
                    {activeDetails[selected].criteria.map((c, i) => (
                      <li key={i} className="flex gap-3 text-[14px] leading-[1.75] text-zinc-600 dark:text-zinc-400">
                        <span className="mt-[3px] shrink-0 font-mono text-[11px] text-zinc-500 dark:text-zinc-600">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>{typeof c === "string" ? c : c.text}</span>
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              </>
            ) : (
              <p className="mt-6 text-[14px] text-zinc-500 dark:text-zinc-600">このノードの詳細は準備中です。</p>
            )}
          </article>
        )}
      </div>
    </div>
  );
}
