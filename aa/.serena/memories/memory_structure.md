# メモリー構造ガイド

## .serena/memories/ フォルダ構成

```
.serena/memories/
├── project_overview.md              # プロジェクト基本情報
├── coding_style_conventions.md      # コーディング規約
├── suggested_commands.md            # よく使うコマンド
├── task_completion_checklist.md     # タスク完了チェックリスト
├── documentation_guidelines.md      # ドキュメント作成ルール
├── project_workflow_understanding.md # ワークフロー理解
├── memory_structure.md              # このファイル
│
├── research/                        # 技術調査・学習内容
│   ├── account_abstraction_basics.md
│   ├── aa_components_detailed.md
│   ├── aa_flow_mermaid.md
│   └── eth_infinitism_guide.md
│
├── requirements/                    # 要件・仕様検討
│   └── (今後追加予定)
│
└── implementation/                  # 実装メモ・判断基準
    └── (今後追加予定)
```

## 各フォルダの使い分け

### research/
- **技術調査の結果**: Account Abstraction、eth-infinitismなど
- **学習内容のまとめ**: 概念理解、仕組み解説
- **外部ライブラリの使い方**: 具体的な実装方法
- **技術的な背景知識**: セキュリティ、ベストプラクティス

### requirements/  
- **機能要件の検討**: 何を作るか、どう動かすか
- **非機能要件**: パフォーマンス、セキュリティ要件
- **制約条件**: 技術的制約、学習目的の制約
- **優先順位**: MVP定義、段階的実装計画

### implementation/
- **実装方針の決定**: なぜその実装を選んだか
- **コーディング中の判断**: エラー解決、設計変更
- **テスト戦略**: どうテストするか
- **デバッグ情報**: よくあるエラーと解決法

## 更新のタイミング

### research/ の更新
- 新しい技術概念を学んだとき
- 外部ドキュメントを調査したとき
- 実装例を見つけたとき

### requirements/ の更新
- 要件を整理・確定したとき
- 学習目標を見直したとき
- スコープを変更したとき

### implementation/ の更新  
- 実装を開始するとき
- エラーを解決したとき
- 設計を変更したとき
- 作業が一段落したとき

## Claudeにとっての意味
このフォルダ構成により、Claudeは：
- 迷わず適切なメモリーファイルを参照可能
- 作業フェーズに応じた情報にアクセス
- 効率的な作業継続が実現