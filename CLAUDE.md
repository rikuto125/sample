# StormQuest — チーム規約

EventStorming の記法と語彙を、ドラッグ&ドロップで学ぶ無料ブラウザ学習ゲーム。

## このプロジェクトの不変原則

実装の判断に迷ったら、必ず `DESIGN.md` の優先順位に従う：

> **① ドメインの正確さ > ② 学習の誠実さ > ③ ゲームの juice > ④ コンテンツ量**

3つの後戻り不可の決定（`DESIGN.md` §2）を破る変更は禁止：
1. トリガーは「ちょうど1つ」でなく「少なくとも1つ＋因果連鎖」を教える。
2. 採点は全順序強制でなく半順序制約の充足。
3. MVP は4ステージ＋計測。作り込みより検証可能な最小形。

## EventStorming 記法（厳密一致）

色・時制は業界標準に**厳密一致**させる（`DESIGN.md` §4）。色を独自にズラさない。
カードは必ず **色＋アイコン＋ラベル** の三重で種別を表現（色覚多様性対応 兼 学習効果）。

ユビキタス言語（用語の JA↔EN 対訳）は `CONTEXT.md` が正。新しい用語は先にここへ。

## 技術スタック

- React 18 + TypeScript + Vite。GitHub Pages デプロイ（`base: '/sample/'`）。
- 状態管理: Context + useReducer のみ（Redux/Zustand は使わない）。
- D&D: dnd-kit（touch/keyboard sensor 必須。HTML5 ネイティブ DnD は使わない＝モバイル不可のため）。
- 判定ロジックは `src/game/` に**純粋関数**として置き、UI から分離。ここを Vitest で厚くテスト。

## ディレクトリ

```
src/
├── game/        # 判定エンジン（純粋関数）+ 型。UIに依存しない
├── data/        # ステージデータ・用語データ（コンポーネントでなくデータ）
├── components/  # React コンポーネント
├── styles/      # CSS
└── test/        # テストセットアップ
docs/adr/        # 後戻りコスト高 ∧ 文脈なしで驚く ∧ 本物のトレードオフ の判断のみ
research/        # 市場調査
design/          # デザイン・ゲーミフィケーション設計
```

## 作業の進め方

- **常に issue で管理**: 着手前に GitHub issue を立て、PR に紐付ける。`gh issue` / `gh pr` を使う。
- **常に grill**: 設計判断は DESIGN.md の優先順位と CONTEXT.md の用語に照らして自問する。記法を歪めて面白くしない。
- **常に skills / CLAUDE.md を最適化**: 作業で得た知見はこのファイルか CONTEXT.md に還元する。陳腐化した記述は消す。
- ステージは「コンポーネント」でなく「データ」。ステージ追加 = データ追加で動くこと（エンジンを書き換えない）。
- ステージデータを足したら、必ず妥当性検証テスト（validLinks の参照先実在チェック等）が緑であることを確認。
- 用語の定義は `CONTEXT.md`（正）→ `src/game/glossary.ts`（コード内の写し）→ stages の `VocabEntry` の順で更新する。`VocabEntry.def` は手書きせず `refVocab()` で GLOSSARY から引く（二重管理を作らない）。
- 個人ワーク（サンドボックス）モードは**採点系の別系統**（ADR 0002）。`src/game/sandbox*` / `notation.ts` / `Sandbox*.tsx` は `engine.ts`・`progress.ts` を import しない（`sandbox.test.ts` の境界テストで保証）。色は必ず `CARD_META[kind]` 由来（色選択 UI を作らない）。永続化は別キー `stormquest.sandbox`、成果物は version 不一致でも破棄しない。

## テスト

- `npm test` で Vitest。判定ロジックは正解配置で3星・制約違反で減点を表形式テスト。
- D&D の E2E は Playwright で最小本数（CI 高コストのため）。
