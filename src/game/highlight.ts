import type { GlossaryEntry } from './types'

/** プレーンな文字列か、定義に紐づく下線セグメントか。 */
export type Segment =
  | { text: string }
  | { text: string; entry: GlossaryEntry }

/**
 * 本文中に出現する用語を検出し、定義に紐づく下線セグメントに分割する（純粋関数）。
 *
 * 設計上の必須対策（過剰／誤下線を避ける）:
 * - 対象は呼び出し側が渡した terms のみ（全 GLOSSARY 自動適用はしない）。
 * - 最長一致: 長い ja を先に試す（「集約不変条件」を「集約」で割らない）。
 * - 各用語は本文中の初出のみ下線（同語の連打で読みにくくしない）。
 * - 日本語は単語境界 \b が無いので、ja の完全文字列の出現位置で素朴に走査する。
 *   括弧内補足（例「（オレンジ・過去形）」）は用語そのものでない限りマッチしない。
 */
export function annotate(text: string, terms: GlossaryEntry[]): Segment[] {
  // 長い ja を先に（最長一致）。同長は安定。
  const sorted = [...terms].sort((a, b) => b.ja.length - a.ja.length)
  const used = new Set<string>() // 初出のみ下線にするため、確定した用語 id を記録

  const segments: Segment[] = []
  let buf = '' // まだ下線にしていない地の文の蓄積

  let i = 0
  while (i < text.length) {
    let matched: GlossaryEntry | null = null
    for (const t of sorted) {
      if (used.has(t.id)) continue
      if (t.ja.length === 0) continue
      if (text.startsWith(t.ja, i)) {
        matched = t
        break
      }
    }

    if (matched) {
      if (buf) {
        segments.push({ text: buf })
        buf = ''
      }
      segments.push({ text: matched.ja, entry: matched })
      used.add(matched.id)
      i += matched.ja.length
    } else {
      buf += text[i]
      i += 1
    }
  }

  if (buf) segments.push({ text: buf })
  return segments
}
