-- frontend 残りの groups / nodes / details
-- 001_roadmap_details.sql のあとに実行
-- 既存行があってもスキップする (on conflict do nothing)

insert into public.roadmap_groups (id, roadmap_id, label, sort_order) values
  ('pkg', 'frontend', 'パッケージ管理', 3),
  ('css_tools', 'frontend', 'CSS フレームワーク / 設計', 4),
  ('framework', 'frontend', 'JS フレームワーク（1つ選ぶ）', 5),
  ('build', 'frontend', 'ビルドツール', 6),
  ('testing', 'frontend', 'テスト', 7),
  ('typescript', 'frontend', 'TypeScript', 8),
  ('deploy', 'frontend', 'デプロイ・インフラ', 9)
on conflict (id) do nothing;

insert into public.roadmap_nodes (id, group_id, label, required, days, sort_order) values
  ('npm', 'pkg', 'npm', true, 2, 0),
  ('pnpm', 'pkg', 'pnpm', false, 1, 1),
  ('yarn', 'pkg', 'Yarn', false, 1, 2),
  ('tailwind', 'css_tools', 'Tailwind CSS', true, 7, 0),
  ('sass', 'css_tools', 'Sass / SCSS', false, 5, 1),
  ('cssmod', 'css_tools', 'CSS Modules', false, 3, 2),
  ('react', 'framework', 'React', true, 28, 0),
  ('vue', 'framework', 'Vue.js', false, 21, 1),
  ('svelte', 'framework', 'Svelte', false, 14, 2),
  ('vite', 'build', 'Vite', true, 3, 0),
  ('webpack', 'build', 'Webpack', false, 5, 1),
  ('vitest', 'testing', 'Vitest', true, 7, 0),
  ('playwright', 'testing', 'Playwright', false, 7, 1),
  ('ts', 'typescript', 'TypeScript', true, 14, 0),
  ('vercel', 'deploy', 'Vercel / Netlify', true, 2, 0),
  ('docker', 'deploy', 'Docker 基礎', false, 10, 1)
on conflict (id) do nothing;

insert into public.roadmap_details (node_id, title, days, description, resources, criteria) values
  ('internet', 'Internet の仕組み', 3, 'HTTP とブラウザの動作を知らずに書いたコードは、なぜ遅いのか・なぜ壊れるのかが永遠にわからない。ここは「読み物として1週間で終わらせる」フェーズ。手を動かす必要はない。', '[{"label":"MDN — HTTP の概要","url":"https://developer.mozilla.org/ja/docs/Web/HTTP/Overview","note":"公式ドキュメントの日本語版。まずここを通読する"},{"label":"「Web技術の基本」（著：小林恭平）","url":null,"note":"HTTP・DNS・セキュリティを図解で学べる入門書。1〜2日で読了可能"},{"label":"Chrome DevTools — Network タブ","url":"https://developer.chrome.com/docs/devtools/network/","note":"実際のリクエストを目で見て学ぶのが最速"}]'::jsonb, '["ブラウザに URL を打ち込んでからページが表示されるまでの流れを、DNS → TCP → HTTP → レンダリングの順で口頭で説明できる","Chrome DevTools の Network タブで、ステータスコード・ヘッダ・レスポンスボディを読み取れる","HTTP と HTTPS の違い、および HTTPS で何が暗号化されているかを説明できる"]'::jsonb),
  ('html', 'HTML', 10, 'HTML は「見た目」ではなく「意味」を書く言語。この認識がないままコーディングを続けると、div だらけの意味不明な構造を量産することになる。', '[{"label":"『1冊ですべて身につくHTML & CSS』（Mana 著）","url":null,"note":"デザイナー視点も含めた国内最良の入門書。Chapter 1〜5 を優先して読む"},{"label":"MDN — HTML 要素リファレンス","url":"https://developer.mozilla.org/ja/docs/Web/HTML/Element","note":"辞書として常に手元に置く"},{"label":"web.dev — Learn HTML（Google）","url":"https://web.dev/learn/html","note":"Google 公式の体系的コース。セマンティクスの章が特に優秀"}]'::jsonb, '["Figma のデザインカンプを見て、article / section / nav / aside の使い分けを迷わず選択できる","フォームを label・input・fieldset で正しくマークアップし、クリックで対応 input にフォーカスが当たる","Wave（アクセシビリティチェッカー）にかけてエラーゼロにできる"]'::jsonb),
  ('css', 'CSS', 14, 'CSS の習得で詰まる人の9割は「Flexbox と Grid の使い分けが感覚でわかっていない」だけ。この2つを体に染み込ませば、大抵のレイアウトは書ける。', '[{"label":"『CSSの教科書』（著：草野あけみ）","url":null,"note":"Flexbox・Grid を中心に、なぜそう動くのかの理屈から解説している国内最良書"},{"label":"Flexbox Froggy","url":"https://flexboxfroggy.com/#ja","note":"ゲーム形式で Flexbox を完全習得できる。30分で終わる"},{"label":"Grid Garden","url":"https://cssgridgarden.com/#ja","note":"Grid の直感的理解に最適"},{"label":"Josh W. Comeau — CSS for JavaScript Developers","url":"https://css-for-js.dev/","note":"CSS の「なぜ」を最も深く解説している英語コース"}]'::jsonb, '["2カラムレイアウト・カードグリッド・ナビゲーションバーを Flexbox または Grid で実装できる","clamp() または auto-fill を使ったレスポンシブレイアウトをメディアクエリなしで実装できる","CSS カスタムプロパティでカラーパレットを定義し、ダークモード切り替えを実装できる"]'::jsonb),
  ('js', 'JavaScript', 21, 'JS の学習は「構文を覚えること」ではなく「非同期処理とイベントの仕組みを理解すること」が核心。ここを誤魔化すと React を学んでも永遠に useEffect が理解できない。', '[{"label":"『JavaScript Primer』（著：azu）","url":"https://jsprimer.net/","note":"無料・Web 公開。ES2015+ を前提にした国内唯一の体系的入門書。必読"},{"label":"『JavaScript: The Good Parts』（著：Douglas Crockford）","url":null,"note":"薄いが本質的。JS の設計上の罠を理解するために読む"},{"label":"javascript.info","url":"https://ja.javascript.info/","note":"英語（日本語訳あり）。非同期の章が特に優秀"}]'::jsonb, '["fetch() で外部 API からデータを取得し、DOM に一覧表示するコードを非同期処理で書ける","addEventListener と Promise の仕組みを、コールスタックとイベントループの概念を使って他人に説明できる","Chrome DevTools のデバッガでブレークポイントを使いながらステップ実行でき、変数の値を追跡できる"]'::jsonb),
  ('git', 'Git', 5, 'Git は「コマンドを暗記するツール」ではなく「スナップショットの集合体を操作する概念」だ。内部モデルを理解すれば、どんなコマンドも迷わなくなる。', '[{"label":"Pro Git（日本語版・無料）","url":"https://git-scm.com/book/ja/v2","note":"公式の無料書籍。Chapter 1〜3 を読めば実務レベルには十分"},{"label":"『わかばちゃんと学ぶ Git使い方入門』","url":null,"note":"漫画形式で Git の概念を視覚的に理解できる入門書"},{"label":"Learn Git Branching","url":"https://learngitbranching.js.org/?locale=ja","note":"ブランチの動きをビジュアルで体験できる無料インタラクティブサイト。必須"}]'::jsonb, '["feature ブランチを切り、複数 commit を積み、main にマージし、不要ブランチを削除する一連の操作をコマンドラインだけで完結できる","意図せず main に commit してしまったコードを git reset または git revert で安全に取り消せる","コンフリクトが発生したとき、マーカーの意味を理解した上で手動解消し、動作確認後に commit できる"]'::jsonb),
  ('github', 'GitHub', 3, 'GitHub は「コードの保存場所」ではなく「チームのコミュニケーション基盤」だ。PR とコードレビューの文化を理解してこそ、チーム開発に入れる。', '[{"label":"GitHub Docs — Pull Request について","url":"https://docs.github.com/ja/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests","note":"PR の基本概念から読む"},{"label":"GitHub Actions 公式ドキュメント","url":"https://docs.github.com/ja/actions","note":"lint・test・deploy の自動化。Quickstart から始める"},{"label":"『GitHub実践入門』（著：大塚弘記）","url":null,"note":"ハンズオン形式でチーム開発フローを体験できる国内書籍"}]'::jsonb, '["個人リポジトリで feature ブランチから PR を作成し、セルフレビュー後に main にマージするワークフローを習慣化できている","GitHub Actions で push 時に ESLint が自動実行され、エラーがあれば PR がブロックされる CI を設定できる","README.md に概要・セットアップ手順・使い方を書き、他人がクローンして動かせる状態にできる"]'::jsonb),
  ('npm', 'npm', 2, 'npm は「ライブラリを入れるコマンド」ではない。依存関係の解決・タスクの自動化・プロジェクトの再現性確保を担う、開発インフラの中枢だ。', '[{"label":"npm 公式ドキュメント","url":"https://docs.npmjs.com/","note":"Getting Started + CLI Commands を一通り読む"},{"label":"Node.js 公式ガイド — パッケージマネージャー","url":"https://nodejs.org/ja/learn/getting-started/an-introduction-to-the-npm-package-manager","note":"npm の設計思想を正確に理解するための公式解説"}]'::jsonb, '["package.json の scripts に build / dev / lint / test を定義し、npm run コマンドで実行できる","dependencies と devDependencies の違いを説明でき、正しい flag でインストールできる","package-lock.json をコミットする理由と、npm ci と npm install の使い分けを説明できる"]'::jsonb),
  ('tailwind', 'Tailwind CSS', 7, 'Tailwind は「CSS を書かなくていい」ツールではなく「CSS の設計判断をコンポーネント側に委譲する」ツールだ。CSS の基礎なしに使うと、クラスを無限に貼り付けるだけの人になる。', '[{"label":"Tailwind CSS 公式ドキュメント","url":"https://tailwindcss.com/docs/","note":"Core Concepts（ユーティリティファースト・レスポンシブ・ダークモード）を最初に読む"},{"label":"Tailwind UI（公式コンポーネント集）","url":"https://tailwindui.com/","note":"有料だが実装パターンの宝庫。無料サンプルだけでも参考になる"},{"label":"shadcn/ui のソースコード","url":"https://ui.shadcn.com/","note":"Tailwind + Radix UI の実装。プロのコンポーネント設計を読み取る素材として使う"}]'::jsonb, '["デザインカンプを Tailwind クラスだけでピクセルパーフェクトに再現できる","sm: / md: / lg: のブレークポイントでモバイル → デスクトップのレスポンシブを実装できる","繰り返し使う UI（Button・Badge など）を React コンポーネント化し、className props で拡張できる設計にできる"]'::jsonb),
  ('react', 'React', 28, 'React の難しさの本質は「フック」ではなく「宣言的 UI とレンダリングのメンタルモデル」にある。これを掴む前に useEffect を使うと、無限ループと戦い続けることになる。', '[{"label":"React 公式ドキュメント（react.dev）","url":"https://ja.react.dev/","note":"2023年リニューアル版。チュートリアルと「React の流儀」は必読"},{"label":"Next.js 公式ドキュメント — App Router","url":"https://nextjs.org/docs/app","note":"React の学習と並行して進める。App Router の基礎から"},{"label":"『りあクト！TypeScriptで始めるつらくないReact開発』","url":null,"note":"React の思想から丁寧に解説した国内最良の上級書"}]'::jsonb, '["外部 API からデータを fetch し、ローディング・エラー・成功の3状態を useState で管理して UI に反映できる","バケツリレーが3階層を超えたとき、Context または状態管理ライブラリへのリファクタリング判断ができる","useEffect の依存配列を正確に設定でき、ESLint の exhaustive-deps ルールの警告をゼロにできる"]'::jsonb),
  ('vite', 'Vite', 3, 'ビルドツールは「設定するもの」ではなく「動作を理解するもの」だ。Vite が何をやっているかを知ることで、バンドルサイズ・ビルド速度・デプロイ戦略の判断ができるようになる。', '[{"label":"Vite 公式ドキュメント","url":"https://ja.vitejs.dev/","note":"Why Vite のページから読み始める。設計思想の理解が先"},{"label":"Rollup 公式ドキュメント","url":"https://rollupjs.org/","note":"Vite の本番ビルドの仕組みを理解したくなったら参照"}]'::jsonb, '["vite.config.js にパスエイリアス（@/ → src/）と開発サーバーのプロキシ設定を追加できる","本番ビルド後の dist フォルダを確認し、バンドルサイズをチャンク分割で削減できる","環境変数（.env / .env.production）の使い方を理解し、VITE_ プレフィックスのルールを説明できる"]'::jsonb),
  ('ts', 'TypeScript', 14, 'TypeScript は「型を書くための言語」ではなく「コンパイラに設計の矛盾を教えてもらうための対話ツール」だ。エラーを憎まず、エラーを読む習慣をつける。', '[{"label":"TypeScript 公式ハンドブック","url":"https://www.typescriptlang.org/docs/handbook/intro.html","note":"Everyday Types → Narrowing → Functions の順に読む"},{"label":"『プログラミングTypeScript』（著：Boris Cherny）","url":null,"note":"型システムの深い理解のための一冊。中〜上級者向け"},{"label":"type-challenges","url":"https://github.com/type-challenges/type-challenges","note":"型パズルで TypeScript の型操作力を鍛える OSS。Easy から始める"}]'::jsonb, '["React コンポーネントの Props に正確な型定義を付け、不正な値を渡したときにコンパイルエラーにできる","API レスポンスの型を定義し、zod などのバリデーションライブラリで実行時型チェックまで実装できる","any を一切使わずに、既存の JavaScript ファイルを TypeScript に移行できる"]'::jsonb),
  ('vercel', 'Vercel / Netlify', 2, 'デプロイは「完成してから考えること」ではない。開発の初日に CI/CD を整備し、main への push が自動でプロダクションに反映される状態を作ることが、現代の開発の最低ラインだ。', '[{"label":"Vercel 公式ドキュメント — Get Started","url":"https://vercel.com/docs/getting-started-with-vercel","note":"GitHub 連携からデプロイまで15分で完了する"},{"label":"Vercel — Environment Variables","url":"https://vercel.com/docs/projects/environment-variables","note":"本番・Preview・Development の環境変数の分離方法"},{"label":"GitHub Actions + Vercel の連携パターン","url":"https://vercel.com/guides/how-can-i-use-github-actions-with-vercel","note":"独自の CI を挟んでから Vercel にデプロイするパターン"}]'::jsonb, '["GitHub リポジトリと Vercel を連携し、main push → 本番デプロイ、PR 作成 → Preview URL 発行が自動で動く状態を作れる","本番環境の環境変数を Vercel のダッシュボードで管理し、コードにハードコードされていない状態を維持できる","デプロイ失敗時にビルドログを読んで原因を特定し、修正 push で再デプロイを成功させられる"]'::jsonb)
on conflict (node_id) do update set
  title = excluded.title,
  days = excluded.days,
  description = excluded.description,
  resources = excluded.resources,
  criteria = excluded.criteria;
