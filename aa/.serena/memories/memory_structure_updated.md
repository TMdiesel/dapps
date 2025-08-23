# メモリー構造ガイド（更新版）

## .serena/memories/ フォルダ構成

```
.serena/memories/
├── project_overview.md              # プロジェクト基本情報
├── coding_style_conventions.md      # コーディング規約
├── suggested_commands.md            # よく使うコマンド
├── task_completion_checklist.md     # タスク完了チェックリスト
├── documentation_guidelines.md      # ドキュメント作成ルール
├── project_workflow_understanding.md # ワークフロー理解
├── memory_structure.md              # 古い構造ガイド
├── memory_structure_updated.md      # このファイル（最新版）
│
├── research/                        # 技術調査・学習内容
│   ├── account_abstraction_basics.md
│   ├── aa_components_detailed.md
│   └── eth_infinitism_guide.md
│
├── diagrams/                        # フロー図・アーキテクチャ図
│   ├── aa_flows_mermaid.md         # メインのMermaid図表 ⭐
│   ├── aa_flow_diagram_old.md      # 古いASCII図（参考）
│   └── aa_flow_mermaid_old.md      # 古いMermaid版（参考）
│
├── requirements/                    # 要件・仕様検討
│   └── (今後追加予定)
│
└── implementation/                  # 実装メモ・判断基準
    └── (今後追加予定)
```

## 整理完了事項

✅ **古いフロー図を整理**
- ASCII図 → Mermaid図に変換完了
- 重複ファイルを `diagrams/` フォルダに移動
- メインは `aa_flows_mermaid.md` に統一

✅ **フォルダ構成の明確化**
- 技術調査: `research/`
- 図表: `diagrams/` 
- 要件: `requirements/`
- 実装: `implementation/`

## 次のステップ

1. **要件整理** → `requirements/` に学習目標・機能要件
2. **環境設計** → `implementation/` に開発環境構築方法
3. **実装開始** → 実際のプロジェクト初期化

## 図表作成ルール

- 全ての図表はMermaidで作成（`diagrams/` に集約）
- 日本語ラベル使用OK
- 色分けで重要度表現
- flowchart, sequenceDiagram, gantt 等を使い分け