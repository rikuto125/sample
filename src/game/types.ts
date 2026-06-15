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

/**
 * 用語の定義（プレイ中に引く軽量ヒント用）。
 * 定義文の一次資料は CONTEXT.md。GLOSSARY はそのコード内の写し。
 * kind を持つのは記法7種だけ。集約不変条件・状態遷移など CardKind を
 * 持たない補助用語は kind 省略・icon を自前で持つ。
 */
export interface GlossaryEntry {
  id: string
  ja: string
  en: string
  /** 定義本文（CONTEXT.md の第1文。句点で終わる） */
  def: string
  /** 記法カードに対応する用語のみ。色＋アイコンは CARD_META から引く */
  kind?: CardKind
  /** kind を持たない補助用語のアイコン（CONTEXT.md 準拠。色は付けない） */
  icon?: string
  /** 章注記・混同防止の注記など（def 本文には含めない補足） */
  note?: string
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
  /**
   * scenario / instruction 本文で点線下線にして定義を引けるようにする用語 id の許可リスト。
   * 未指定なら、そのステージで使う記法種別を既定対象にする（過剰下線を避ける）。
   */
  glossaryRefs?: string[]
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

// ---- MODE3: 不変条件ゲート（第2章 / 集約と不変条件）----

/**
 * 集約の状態。宣言的に持つ（例: { postponeCount: 0, done: 0 }）。
 * DDD書籍7.2.2 の Task（postponeCount / status）に対応。
 */
export type AggregateState = Record<string, number>

/**
 * 集約が受けるコマンドの定義。
 * ガード（不変条件）を満たせばイベントを発行し、状態を更新する。破れば拒否。
 * DDD書籍7.2.2: postpone は postponeCount >= MAX(3) で DomainException。
 */
export interface AggregateCommand {
  id: string
  /** コマンド名（「タスクを延期する」など） */
  labelJa: string
  /** 成功時に発行されるドメインイベント名（過去形） */
  emitsEventJa: string
  /**
   * 不変条件（ガード）。すべて満たせばコマンドは通る。
   * lt/lte/gte/eq で「状態キーのしきい値」を宣言的に表す。
   */
  guards: InvariantGuard[]
  /** 成功時の状態への効果（キーごとの増分）。例: { postponeCount: +1 } */
  effects: Record<string, number>
  /** ガード違反時にプレイヤーへ示す理由 */
  rejectReason: string
}

export type InvariantGuard =
  | { key: string; op: 'lt'; value: number } // state[key] < value
  | { key: string; op: 'lte'; value: number }
  | { key: string; op: 'gte'; value: number }
  | { key: string; op: 'eq'; value: number }

/**
 * MODE3: 不変条件ゲート。
 * プレイヤーは「今この集約状態で、このコマンドは通るか？」を判断し、
 * 通ると判断したコマンドだけを集約に通す。集約の不変条件を体験的に学ぶ。
 */
export interface InvariantGateStage extends StageBase {
  mode: 'invariant'
  /** 集約名（淡黄📦カードで表示） */
  aggregateJa: string
  /** 集約の初期状態 */
  initialState: AggregateState
  /** プレイヤーが順に判断するコマンド列（同じコマンドが状態違いで複数回出る） */
  steps: AggregateCommand[]
  /** 集約が獲得させる語彙（集約） */
  aggregateVocab: VocabEntry
}

export type Stage = TimelineStage | TriggerStage | InvariantGateStage

// ---- 章（chapter）構成 ----

export interface Chapter {
  id: string
  title: string
  icon: string
  /** この章に属するステージ id の並び */
  stageIds: string[]
}

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
