import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const AUTHORS = [
  { id: "demo-haru", name: "haru", initial: "H" },
  { id: "demo-ken", name: "ken", initial: "K" },
  { id: "demo-yui", name: "yui", initial: "Y" },
  { id: "demo-sora", name: "sora", initial: "S" },
  { id: "demo-rin", name: "rin", initial: "R" },
  { id: "demo-nao", name: "nao", initial: "N" },
  { id: "demo-kaito", name: "kaito", initial: "K" },
  { id: "demo-mei", name: "mei", initial: "M" },
];

function n(label, days, required = true, extra = {}) {
  return { label, days, required, ...extra };
}

function g(label, nodes) {
  return { label, nodes };
}

const ROADMAPS = [
  ["python-start", "Python 入門から実務", "文法より先に、小さな自動化とデータ処理を通して Python の感覚をつかむ。", ["Python", "プログラミング"], [
    g("準備", [n("環境構築", 2), n("エディタと仮想環境", 2)]),
    g("文法", [n("型と制御構文", 7), n("関数とモジュール", 5)]),
    g("手を動かす", [n("ファイルと CSV", 4), n("Web API を叩く", 5, true), n("小ツールを作る", 7)]),
  ]],
  ["go-api", "Go で HTTP API を作る", "標準ライブラリ中心で API を書き、並行処理とデプロイまで通す。", ["Go", "バックエンド"], [
    g("基礎", [n("Go の型とパッケージ", 5), n("エラー処理", 3)]),
    g("API", [n("net/http", 7), n("JSON とバリデーション", 4)]),
    g("運用", [n("テスト", 5), n("コンテナ化", 3)]),
  ]],
  ["rust-systems", "Rust で安全な CLI", "所有権を避けずに、小さな CLI を完成させる。", ["Rust", "システム"], [
    g("所有権", [n("所有と借用", 10), n("ライフタイムの感覚", 6, false)]),
    g("実装", [n("clap で CLI", 5), n("エラー型", 4)]),
    g("品質", [n("cargo test", 3), n("clippy", 2)]),
  ]],
  ["sql-design", "SQL とデータベース設計", "SELECT だけでなく、正規化とインデックスまで含めて実務で困らない状態にする。", ["SQL", "データベース"], [
    g("操作", [n("SELECT の基本", 4), n("JOIN と集約", 6)]),
    g("設計", [n("正規化", 5), n("インデックス", 4)]),
    g("応用", [n("トランザクション", 3), n("EXPLAIN", 3, false)]),
  ]],
  ["linux-server", "Linux とサーバー基礎", "SSH で入り、ログを見て、プロセスと権限を説明できるところまで。", ["Linux", "インフラ"], [
    g("操作", [n("シェルとパス", 3), n("権限とユーザー", 3)]),
    g("運用", [n("systemd", 4), n("ログの読み方", 3)]),
    g("ネット", [n("SSH とファイアウォール", 4)]),
  ]],
  ["docker-k8s", "Docker から Kubernetes 入門", "手元でコンテナを固め、次にオーケストレーションの地図を掴む。", ["Docker", "Kubernetes"], [
    g("Docker", [n("イメージとコンテナ", 4), n("Compose", 3)]),
    g("K8s", [n("Pod と Deployment", 7), n("Service", 4), n("Helm 概要", 3, false)]),
  ]],
  ["aws-foundations", "AWS クラウド基礎", "IAM・VPC・EC2・S3 を自分の手で作り、請求と権限を怖がらない。", ["AWS", "クラウド"], [
    g("アカウント", [n("IAM", 4), n("請求アラート", 1)]),
    g("基盤", [n("VPC", 5), n("EC2", 4), n("S3", 3)]),
    g("アプリ", [n("RDS 概要", 3, false)]),
  ]],
  ["pandas-analysis", "pandas でデータ分析", "CSV を読み、汚れを落とし、集計して図にする一連を身体で覚える。", ["Python", "データ分析"], [
    g("準備", [n("Jupyter", 2), n("データの読み込み", 3)]),
    g("加工", [n("欠損と型", 4), n("groupby", 5)]),
    g("伝える", [n("可視化", 4), n("レポート", 3)]),
  ]],
  ["ml-intro", "機械学習入門", "モデルの中身より先に、学習データの分割と評価指標を間違えない。", ["機械学習", "Python"], [
    g("考え方", [n("教師あり学習", 4), n("過学習", 3)]),
    g("実装", [n("scikit-learn", 7), n("特徴量", 5)]),
    g("評価", [n("交差検証", 4)]),
  ]],
  ["swift-ios", "Swift で iOS アプリ", "SwiftUI で画面を積み、データを残し、実機で動かす。", ["iOS", "Swift"], [
    g("言語", [n("Swift 基礎", 7), n("Optionals", 3)]),
    g("UI", [n("SwiftUI", 14), n("ナビゲーション", 4)]),
    g("データ", [n("SwiftData", 5, false)]),
  ]],
  ["kotlin-android", "Kotlin で Android", "Compose で画面を作り、Activity のライフサイクルに振り回されない。", ["Android", "Kotlin"], [
    g("言語", [n("Kotlin 基礎", 6)]),
    g("UI", [n("Jetpack Compose", 14), n("状態管理", 5)]),
    g("配布", [n("エミュレータと実機", 3)]),
  ]],
  ["unity-game", "Unity で小さなゲーム", "3D より先に 2D で、入力・衝突・シーン遷移を完成させる。", ["Unity", "ゲーム"], [
    g("基礎", [n("シーンと GameObject", 4), n("C# スクリプト", 7)]),
    g("ゲーム", [n("物理と衝突", 5), n("UI", 4)]),
    g("仕上げ", [n("ビルド", 2)]),
  ]],
  ["figma-ui", "Figma で UI を組む", "見た目のコピーではなく、コンポーネントと余白のルールを先に決める。", ["Figma", "デザイン"], [
    g("操作", [n("フレームと Auto Layout", 4), n("コンポーネント", 5)]),
    g("設計", [n("カラーとタイプ", 4), n("プロトタイプ", 3)]),
  ]],
  ["ux-research", "UX リサーチ入門", "インタビューと観察から、作る前に仮説を壊す習慣をつける。", ["UX", "リサーチ"], [
    g("計画", [n("リサーチクエスチョン", 3), n("対象者の決め方", 2)]),
    g("実施", [n("インタビュー", 5), n("観察", 4, false)]),
    g("まとめ", [n("親和図と示唆", 4)]),
  ]],
  ["illustration", "デジタルイラスト上達", "線と形の練習を毎日短く続け、塗りと構図は後から足す。", ["イラスト", "デザイン"], [
    g("基礎", [n("パースと人体", 14), n("デッサン習慣", 10)]),
    g("仕上げ", [n("塗り", 7), n("構図", 5)]),
  ]],
  ["video-edit", "動画編集の型", "カット・音・字幕の三段で、視聴が止まらない一本を仕上げる。", ["映像", "編集"], [
    g("素材", [n("撮影と取り込み", 3), n("整理", 2)]),
    g("編集", [n("カット", 5), n("音と字幕", 5)]),
    g("書き出し", [n("書き出し設定", 2)]),
  ]],
  ["photography", "写真撮影の基礎", "露出の三要素を体で覚え、あとから構図と光を足す。", ["写真"], [
    g("カメラ", [n("露出", 4), n("レンズ", 3)]),
    g("撮る", [n("構図", 5), n("光", 4)]),
    g("現像", [n("RAW 現像", 4, false)]),
  ]],
  ["dtm-compose", "DTM で曲を一本", "コード進行とドラムから始め、メロディは最後に載せる。", ["音楽", "DTM"], [
    g("DAW", [n("環境とルーティング", 3)]),
    g("作曲", [n("コード進行", 7), n("リズム", 5), n("メロディ", 6)]),
    g("ミックス", [n("音量と EQ", 5)]),
  ]],
  ["english-speak", "英語スピーキング 90 日", "文法の完成を待たず、短い文を声に出す量を先に稼ぐ。", ["英語", "スピーキング"], [
    g("音", [n("発音の型", 10), n("リスニング短文", 10)]),
    g("話す", [n("独り言トレーニング", 21), n("オンライン会話", 14)]),
  ]],
  ["toeic-800", "TOEIC 800 への道", "単語を先に固め、Part 別の時間配分でスコアを取りにいく。", ["英語", "TOEIC"], [
    g("語彙", [n("金のフレーズ級の単語", 21)]),
    g("Part", [n("リスニング", 21), n("文法・読解", 21)]),
    g("演習", [n("模試", 14)]),
  ]],
  ["jlpt-n2", "JLPT N2", "文法と読解を並行し、聴解は毎日短く聴く。", ["日本語", "JLPT"], [
    g("語彙文法", [n("文法ノート", 30), n("語彙", 20)]),
    g("技能", [n("読解", 25), n("聴解", 20)]),
  ]],
  ["boki-2", "簿記 2 級", "仕訳を手で書き、工業簿記はパターンで潰す。", ["簿記", "資格"], [
    g("商業", [n("仕訳", 21), n("決算", 14)]),
    g("工業", [n("原価計算", 21), n("直接原価", 10)]),
    g("過去問", [n("過去問回転", 21)]),
  ]],
  ["takken", "宅建合格", "権利関係を丁寧に、法令と税は過去問の出方で覚える。", ["宅建", "資格"], [
    g("権利", [n("民法", 35), n("借地借家", 10)]),
    g("法令", [n("業法", 21), n("法令上の制限", 14)]),
    g("税その他", [n("税・鑑定", 10)]),
  ]],
  ["stats-2", "統計検定 2 級", "数式の暗記より、どの検定をいつ使うかを先に決める。", ["統計", "資格"], [
    g("記述", [n("平均と分散", 5), n("相関", 4)]),
    g("推測", [n("区間推定", 7), n("仮説検定", 10)]),
    g("演習", [n("過去問", 14)]),
  ]],
  ["invest-basics", "投資の基礎", "個別株の前に、家計・リスク・インデックスを先に置く。", ["投資", "マネー"], [
    g("土台", [n("家計と緊急資金", 5), n("リスク許容度", 3)]),
    g("商品", [n("インデックス", 7), n("NISA", 3)]),
    g("続け方", [n("リバランス", 2)]),
  ]],
  ["strength-start", "筋トレ初心者 12 週", "週 3 の全身法から始め、フォームを動画で確認する。", ["筋トレ", "健康"], [
    g("習慣", [n("頻度と睡眠", 7)]),
    g("種目", [n("スクワット", 14), n("プッシュ・プル", 14)]),
    g("食事", [n("たんぱく質", 7)]),
  ]],
  ["cooking-basics", "料理の基本", "切る・熱する・味を見る。レシピより先に火と塩。", ["料理"], [
    g("刀工", [n("切り方", 5), n("下処理", 4)]),
    g("加熱", [n("煮る", 5), n("焼く", 5)]),
    g("味", [n("塩と酸", 4)]),
  ]],
  ["marathon", "フルマラソン完走", "走れる距離を週ごとに伸ばし、ペースは後から落とす。", ["ランニング", "健康"], [
    g("土台", [n("週 3 ランニング", 28), n("フォーム", 7)]),
    g("距離", [n("LSD", 42), n("30km", 14)]),
    g("本番", [n("テーパリング", 14)]),
  ]],
  ["sleep-better", "睡眠を整える", "カフェインと光を先にいじり、サプリは最後。", ["睡眠", "健康"], [
    g("記録", [n("睡眠ログ", 7)]),
    g("環境", [n("光", 7), n("カフェイン", 5)]),
    g("リズム", [n("起床時刻の固定", 14)]),
  ]],
  ["product-mgmt", "プロダクトマネジメント入門", "要望を全部盛らず、指標と仮説で削る。", ["PM", "プロダクト"], [
    g("発見", [n("課題定義", 5), n("ユーザーインタビュー", 7)]),
    g("設計", [n("ロードマップ", 5), n("仕様", 7)]),
    g("検証", [n("指標", 4)]),
  ]],
  ["marketing-intro", "マーケティング入門", "チャネルを増やす前に、誰に何を届けるかを一文にする。", ["マーケティング"], [
    g("戦略", [n("誰に何を", 4), n("競合", 3)]),
    g("実行", [n("コンテンツ", 7), n("広告の読み方", 5, false)]),
    g("計測", [n("KPI", 3)]),
  ]],
  ["sales-craft", "営業の型", "トークより先に、質問と次の約束を取る。", ["営業"], [
    g("準備", [n("仮説", 3), n("相手調べ", 2)]),
    g("商談", [n("質問", 7), n("提案", 5)]),
    g("後工程", [n("フォロー", 4)]),
  ]],
  ["startup-90", "起業の最初の 90 日", "法人の前に、売れる話を 10 人にする。", ["起業", "ビジネス"], [
    g("仮説", [n("課題インタビュー", 21)]),
    g("試作", [n("MVP", 21)]),
    g("販売", [n("最初の売上", 14)]),
  ]],
  ["excel-work", "Excel 実務", "見た目の表より、フィルタとピボットで答えを出す。", ["Excel", "実務"], [
    g("操作", [n("参照と関数", 5), n("テーブル", 3)]),
    g("分析", [n("ピボット", 5), n("グラフ", 3)]),
    g("品質", [n("チェック", 2)]),
  ]],
  ["notion-pk", "Notion で知的生産", "ページを増やさず、inbox と週次レビューだけ先に固定する。", ["Notion", "生産性"], [
    g("設計", [n("データベース", 4), n("inbox", 2)]),
    g("運用", [n("週次レビュー", 3), n("プロジェクト", 4)]),
  ]],
  ["security-intro", "サイバーセキュリティ入門", "攻撃手法の名前より、認証・権限・ログを自分の言葉で説明する。", ["セキュリティ"], [
    g("基礎", [n("脅威モデル", 4), n("認証", 5)]),
    g("防御", [n("権限", 4), n("ログ", 4)]),
    g("演習", [n("脆弱性の読み方", 5, false)]),
  ]],
  ["web3-overview", "ブロックチェーン概論", "コインを買う前に、公開鍵とトランザクションを図で説明できる。", ["ブロックチェーン", "Web3"], [
    g("仕組み", [n("ハッシュと公開鍵", 5), n("トランザクション", 4)]),
    g("応用", [n("スマートコントラクト概要", 6), n("ウォレット", 3)]),
  ]],
  ["it-passport-plus", "情報処理の基礎", "用語暗記で終わらせず、ネットワークとセキュリティの流れでつなぐ。", ["資格", "IT"], [
    g("ストラテジ", [n("企業活動", 5)]),
    g("マネジメント", [n("プロジェクト", 5)]),
    g("テクノロジ", [n("ネットワーク", 7), n("セキュリティ", 7)]),
  ]],
  ["math-retry", "大学数学のやり直し", "微積の公式より、極限と線形代数のイメージを先に取り戻す。", ["数学"], [
    g("解析", [n("極限と微分", 14), n("積分", 10)]),
    g("線形", [n("ベクトル", 7), n("行列", 10)]),
  ]],
  ["physics-basics", "物理の基礎", "公式の代入より、力とエネルギーの保存を図に描く。", ["物理"], [
    g("力学", [n("運動方程式", 10), n("エネルギー", 7)]),
    g("波と電磁", [n("波", 7, false), n("電磁気入門", 10, false)]),
  ]],
  ["chem-basics", "化学の基礎", "反応式の係数合わせとモルを、実験のイメージと一緒に置く。", ["化学"], [
    g("量", [n("モル", 5), n("濃度", 4)]),
    g("反応", [n("酸化還元", 7), n("平衡", 6)]),
  ]],
  ["nurse-exam", "看護師国家試験", "病態を一疾患ずつ、国試の問われ方で結びつける。", ["看護", "資格"], [
    g("基礎", [n("解剖生理", 28)]),
    g("領域", [n("成人", 35), n("母性・小児", 21)]),
    g("演習", [n("過去問", 28)]),
  ]],
  ["cpa-short", "公認会計士 短答", "財務会計を軸に、企業法と管理会計を週次で回す。", ["会計士", "資格"], [
    g("会計", [n("財務会計", 60), n("管理会計", 30)]),
    g("周辺", [n("企業法", 25), n("監査論", 25)]),
  ]],
  ["pmp-pmbok", "プロジェクトマネジメント", "計画の厚みより、リスクとコミュニケーションの頻度を先に決める。", ["PM", "資格"], [
    g("立上げ", [n("スコープ", 5), n("ステークホルダ", 4)]),
    g("遂行", [n("スケジュール", 5), n("リスク", 5)]),
    g("終結", [n("振り返り", 2)]),
  ]],
  ["presentation", "プレゼンテーション", "スライドの装飾より、聞き手が覚える一文を先に書く。", ["プレゼン", "コミュニケーション"], [
    g("メッセージ", [n("結論の一文", 3), n("ストーリー", 4)]),
    g("資料", [n("スライド", 5)]),
    g("本番", [n("リハーサル", 3)]),
  ]],
  ["writing-tech", "技術記事の書き方", "動いた手順を先に書き、学びは最後の一段にまとめる。", ["執筆", "アウトプット"], [
    g("素材", [n("検証ログ", 2)]),
    g("構成", [n("読者の前提", 3), n("手順", 4)]),
    g("公開", [n("推敲と図", 3)]),
  ]],
  ["git-team", "Git でチーム開発", "個人リポジトリの次に、PR とコンフリクト解消を日常にする。", ["Git", "チーム開発"], [
    g("操作", [n("ブランチ", 3), n("rebase と merge", 4)]),
    g("チーム", [n("Pull Request", 4), n("レビュー", 3)]),
    g("事故", [n("コンフリクト", 3)]),
  ]],
  ["tdd-practice", "テスト駆動開発", "先に落ちるテストを書き、実装は緑にする作業に限定する。", ["テスト", "TDD"], [
    g("単位", [n("ユニットテスト", 7)]),
    g("サイクル", [n("Red Green Refactor", 7)]),
    g("設計", [n("テストしやすい境界", 5)]),
  ]],
  ["a11y-web", "Web アクセシビリティ", "コントラストの前に、キーボードとスクリーンリーダーで自分のページを辿る。", ["アクセシビリティ", "フロントエンド"], [
    g("体験", [n("キーボード操作", 3), n("スクリーンリーダー", 4)]),
    g("実装", [n("セマンティクス", 5), n("ARIA を足す判断", 4)]),
    g("検証", [n("チェックリスト", 3)]),
  ]],
  ["prompt-engineering", "生成 AI を仕事に使う", "一発で答えを求めず、役割・制約・例を分けて渡す。", ["生成AI", "生産性"], [
    g("基本", [n("プロンプトの型", 3), n("幻覚への対処", 3)]),
    g("実務", [n("下書きとレビュー", 5), n("社内データの扱い", 3)]),
  ]],
];

function sqlStr(s) {
  return `'${String(s).replaceAll("'", "''")}'`;
}

function totalDays(groups) {
  return groups.flatMap((g) => g.nodes).filter((n) => n.required).reduce((s, n) => s + n.days, 0);
}

function resourcesFor(label) {
  return JSON.stringify([
    {
      label: `${label} の公式・一次情報`,
      url: "https://developer.mozilla.org/",
      note: "まず一次情報で用語を揃える",
    },
    {
      label: "手を動かす課題",
      url: null,
      note: "同じ操作を3回、何も見ずに再現する",
    },
  ]);
}

function criteriaFor(label) {
  return JSON.stringify([
    `${label}の基本操作を、資料なしで一通りできる`,
    `詰まったときに検索語を自分で組み立てられる`,
  ]);
}

function descriptionFor(label) {
  return `${label}は用語を集める段階ではなく、自分の手で再現できることがゴール。短く繰り返して定着させる。`;
}

const lines = [];
lines.push("-- デモ用ロードマップ約 50 件。SQL Editor で Run");
lines.push("-- もう一度流すと demo- の投稿だけ作り直す");
lines.push("");
lines.push("delete from public.roadmaps where id like 'demo-%';");
lines.push("");

const roadmapRows = [];
const groupRows = [];
const nodeRows = [];
const detailRows = [];

ROADMAPS.forEach((item, index) => {
  const [slug, title, description, tags, groups] = item;
  const id = `demo-${slug}`;
  const author = AUTHORS[index % AUTHORS.length];
  const likes = 3 + ((index * 17) % 90);
  const views = 40 + ((index * 41) % 1800);
  const daysAgo = 1 + ((index * 3) % 80);
  const created = `(now() - interval '${daysAgo} days')`;

  roadmapRows.push(
    `  (${sqlStr(id)}, ${sqlStr(title)}, ${sqlStr(description)}, ${sqlStr(author.id)}, ${sqlStr(author.name)}, ${sqlStr(author.initial)}, ${sqlStr(tags.join(","))}, ${likes}, ${views}, ${totalDays(groups)}, ${created})`,
  );

  groups.forEach((group, gi) => {
    const gid = `${id}-g${gi}`;
    groupRows.push(`  (${sqlStr(gid)}, ${sqlStr(id)}, ${sqlStr(group.label)}, ${gi})`);
    group.nodes.forEach((node, ni) => {
      const nid = `${id}-n${gi}-${ni}`;
      nodeRows.push(
        `  (${sqlStr(nid)}, ${sqlStr(gid)}, ${sqlStr(node.label)}, ${node.required}, ${node.days}, ${ni})`,
      );
      detailRows.push(
        `  (${sqlStr(nid)}, ${sqlStr(node.label)}, ${node.days}, ${sqlStr(descriptionFor(node.label))}, ${sqlStr(resourcesFor(node.label))}::jsonb, ${sqlStr(criteriaFor(node.label))}::jsonb)`,
      );
    });
  });
});

lines.push("insert into public.roadmaps (id, title, description, author_id, author_name, author_initial, tags, likes, views, total_days, created_at) values");
lines.push(roadmapRows.join(",\n") + ";");
lines.push("");
lines.push("insert into public.roadmap_groups (id, roadmap_id, label, sort_order) values");
lines.push(groupRows.join(",\n") + ";");
lines.push("");
lines.push("insert into public.roadmap_nodes (id, group_id, label, required, days, sort_order) values");
lines.push(nodeRows.join(",\n") + ";");
lines.push("");
lines.push("insert into public.roadmap_details (node_id, title, days, description, resources, criteria) values");
lines.push(detailRows.join(",\n") + ";");
lines.push("");

const out = join(dirname(fileURLToPath(import.meta.url)), "../supabase/005_seed_demo.sql");
writeFileSync(out, lines.join("\n"));
console.log(`wrote ${out}`);
console.log(`roadmaps: ${ROADMAPS.length}`);
