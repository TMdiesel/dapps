export default function Page() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 prose prose-invert">
      <h1>Design Doc</h1>
      <p>
        このページはプロジェクト直下の <code>docs/aa-demo-design.md</code> の概要を示します。詳細はリポジトリのMarkdownを参照してください。
      </p>
      <ul>
        <li>ゴール、ユーザーフロー、MVP機能</li>
        <li>技術スタック、アーキテクチャ、統合ポイント</li>
        <li>状態設計、環境変数、テスト方針</li>
      </ul>
      <p className="text-sm opacity-70">docs/aa-demo-design.md を更新するときはアプリの仕様も合わせて更新しましょう。</p>
    </div>
  );
}

