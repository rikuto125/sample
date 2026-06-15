import type { CardKind } from './types'

// 個人ワーク（サンドボックス）の型。学習ゲームの Card/Stage/Progress とは別系統。
// CardKind だけ再利用する（色・アイコン・ラベルは CARD_META[kind] から導出＝記法を歪めない）。
// engine.ts / progress.ts には依存しない（採点とは無関係の自由制作）。

/** キャンバス上の付箋。game 専用フィールド（isDistractor/reason/vocab）は持たない。 */
export interface SandboxCard {
  id: string
  kind: CardKind
  /** ユーザーの自由入力 */
  labelJa: string
  /** キャンバス上の絶対座標（2D 自由配置） */
  x: number
  y: number
}

export type SandboxStatus = 'in-progress' | 'draft-complete'

/** 1つの EventStorming 成果物。 */
export interface SandboxWork {
  id: string
  title: string
  /** 「対象の業務領域は何か」をユーザーに言語化させたメモ */
  domainDescription: string
  status: SandboxStatus
  createdAt: number
  updatedAt: number
  cards: SandboxCard[]
}

/** localStorage に保存するサンドボックス全体。 */
export interface SandboxStore {
  /** スキーマ版。不一致でも成果物は破棄しない（再生成不能なため）。 */
  version: number
  works: Record<string, SandboxWork>
  lastOpenedId: string | null
}
