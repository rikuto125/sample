# StormQuest 🌩️

> **本を読んでも掴めなかった EventStorming の「色と文法」を、15分で手が覚える。**

EventStorming（イベントストーミング）の記法と語彙を、ドラッグ&ドロップのカードゲームで学べる無料のブラウザ学習ゲームです。題材は「🍕 ピザデリバリーの注文業務」。

- ドメインイベント（オレンジ・過去形）を**時系列に並べる**
- 各コマンドに正しい**トリガー（Actor / Policy / External System）をつなぐ**
- EventStorming の本丸 **Event → Policy → Command の因果連鎖**を体験する

**🎮 プレイ → https://rikuto125.github.io/sample/**（デプロイ後に有効）

## なぜ作ったか

DDD/EventStorming は「難しくて挫折しやすい」。一方で記法を遊んで学べるツールは市場に存在しません（[市場調査](research/market-research.md)）。本/動画は受動的、ワークショップは高コスト。StormQuest は **能動的な配置操作 × 即時フィードバック × 反復可能 × 無料・非同期** でその空白を埋めます。

正直に言うと、EventStorming の最大の学びは「協働で認識を合わせる対話」で、1人用ゲームではそこは扱えません。本作は**記法と語彙の習得に限定した入門**です。続きはぜひ実ワークショップで。

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm test         # Vitest（判定ロジックのユニットテスト）
npm run build    # 本番ビルド
```

## 設計ドキュメント

- [DESIGN.md](DESIGN.md) — 企画・最重要決定・MVPスコープ
- [CONTEXT.md](CONTEXT.md) — ユビキタス言語（用語の JA↔EN）
- [research/market-research.md](research/market-research.md) — 市場調査
- [design/](design/) — ゲーミフィケーション・動線設計

## ライセンス

MIT
