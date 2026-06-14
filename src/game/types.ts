// EventStorming 記法に 1:1 対応するカード種別。
// 色はこの種別から導出する（コンポーネント側でハードコードしない）。
export type CardKind =
  | 'event' // ドメインイベント（オレンジ・過去形）
  | 'command' // コマンド（水色・現在形）
  | 'actor' // アクター（黄・人/役割）
  | 'policy' // ポリシー（紫・〜したら〜する）
  | 'externalSystem' // 外部システム（ピンク・管理外）
  | 'readModel' // リードモデル（緑・見る画面）
  | 'aggregate' // 集約（淡黄・第2章以降）

export interface VocabEntry {
  id: string
  ja: string
  en: string
  kind: CardKind
  def: string
}

export interface Card {
  id: string
  kind: CardKind
  labelJa: string
  /** 主にトリガー側カードの英語ラベル（任意） */
  labelEn?: string
  /** クリア時に獲得する語彙への参照（任意） */
  vocab?: string
  /** MODE1 のダミーカード（event 以外を混ぜる）。弾けると正解 */
  isDistractor?: boolean
  /** ダミーを置こうとしたとき／誤接続のときに出す理由 */
  reason?: string
}

/** 満たすべき前後関係。before が after より前にあること */
export type OrderConstraint = [before: string, after: string]

export interface RealityNote {
  short: string
  /** 「もっと見る」で展開する詳細（任意） */
  long?: string
}

interface StageBase {
  id: string
  /** ステージ名（マップ表示用） */
  name: string
  icon: string
  modeLabel: string
  /** 状況説明（📜） */
  scenario: string
  instruction: string
  /** 獲得できる主要語彙 */
  vocab: VocabEntry
  reality: RealityNote
}

/**
 * MODE1: タイムライン。
 * 半順序で採点する（全順序を強制しない＝唯一解の嘘をつかない）。
 */
export interface TimelineStage extends StageBase {
  mode: 'timeline'
  /** プレイヤーがスロットへ並べるべきイベント（順序は constraints で判定） */
  events: Card[]
  /** 混ぜるダミーカード（event 以外）。スロットに置けない */
  distractors: Card[]
  /** 満たすべき前後関係の集合。空なら順序不問 */
  orderConstraints: OrderConstraint[]
}

/** 因果連鎖（最終ステージ用）: event → policy → command */
export interface ChainSpec {
  eventId: string
  policyId: string
  commandId: string
  description: string
}

/**
 * MODE2: トリガー接続。
 * 各コマンドに許容トリガーをつなぐ。複数正解を許容（1:1 を強制しない）。
 */
export interface TriggerStage extends StageBase {
  mode: 'trigger'
  commands: Card[]
  /** トレイに並ぶトリガー候補（正解＋ダミー混在） */
  triggers: Card[]
  /** commandId -> 許容される triggerId の配列（複数正解可） */
  validLinks: Record<string, string[]>
  /** 任意: Event→Policy→Command の連鎖をハイライトする */
  chain?: ChainSpec
}

export type Stage = TimelineStage | TriggerStage

// ---- 採点 ----

export interface ScoreInput {
  /** ミスした回数（誤配置・誤接続） */
  mistakes: number
  /** ヒントを使ったか */
  usedHint: boolean
}

/** 星: 1=初クリア / 2=ヒント不使用 / 3=ノーミス */
export type Stars = 1 | 2 | 3

// ---- 進捗（localStorage 永続化）----

export interface Progress {
  /** スキーマバージョン。壊れたら捨ててリセットする */
  version: number
  /** stageId -> 獲得星数 */
  stars: Record<string, Stars>
  /** 獲得済み語彙 id の集合 */
  unlockedVocab: string[]
}
