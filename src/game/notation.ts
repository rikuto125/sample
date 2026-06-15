import type { CardKind } from './types'

// 記法の「助言」（採点ではない）。EventStorming に唯一解はないので強制しない。
// 時制を持つのは event(過去形)/command(現在形)/policy(◯◯したら) の3種のみ。
// actor/externalSystem/readModel/aggregate に時制概念は無い（捏造しない）。

export type Tense = 'past' | 'present' | 'uncertain'

/** 日本語の語尾から時制を素朴に推定（助言用・完全でなくてよい）。 */
export function detectTense(text: string): Tense {
  const t = text.trim()
  if (!t) return 'uncertain'
  // 過去形: 〜した / 〜された / 〜だった / 〜なった など「た」終わり
  if (/(した|された|れた|った|いた|んだ|あった|なった|た)$/.test(t)) return 'past'
  // 現在形/意図: 〜する / 〜される / 〜行う など「る」終わり
  if (/(する|される|れる|える|む|ぶ|く|ぐ|つ|う|る)$/.test(t)) return 'present'
  return 'uncertain'
}

export interface KindHint {
  /** 入力欄の placeholder 例 */
  placeholder: string
  /** 期待する時制（持つ種別のみ）。無ければ時制助言を出さない */
  tense?: Tense
  /** 時制が期待と食い違うときの一言（tense ありの種別のみ） */
  tenseWarning?: string
}

const HINTS: Record<CardKind, KindHint> = {
  event: {
    placeholder: '例: 注文が確定した（過去形＝起きた事実）',
    tense: 'past',
    tenseWarning: 'イベントは「〜した／された」＝過去の事実。現在形ならコマンドかも。',
  },
  command: {
    placeholder: '例: 注文を確定する（現在形＝意図）',
    tense: 'present',
    tenseWarning: 'コマンドは「〜する」＝まだ起きていない意図。過去形ならイベントかも。',
  },
  policy: {
    placeholder: '例: 注文が確定したら在庫を引き当てる（◯◯したら△△する）',
    tense: 'present',
    tenseWarning: 'ポリシーは「◯◯したら△△する」の形が分かりやすい。',
  },
  actor: { placeholder: '例: 顧客 / 店長（人・役割）' },
  externalSystem: { placeholder: '例: 決済ゲートウェイ（管理外のシステム）' },
  readModel: { placeholder: '例: 注文状況画面（意思決定のために見る情報）' },
  aggregate: { placeholder: '例: 注文（不変条件を守る一貫性の境界）' },
}

export function kindHint(kind: CardKind): KindHint {
  return HINTS[kind]
}

/** 入力テキストが種別の期待時制と食い違うなら警告文を返す（助言・非強制）。 */
export function tenseAdvice(kind: CardKind, text: string): string | null {
  const h = HINTS[kind]
  if (!h.tense || !text.trim()) return null
  const got = detectTense(text)
  if (got === 'uncertain') return null
  if (got !== h.tense) return h.tenseWarning ?? null
  return null
}
