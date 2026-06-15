import { describe, expect, it } from 'vitest'
import { annotate, type Segment } from './highlight'
import type { GlossaryEntry } from './types'

const event: GlossaryEntry = { id: 'event', ja: 'イベント', en: 'Event', def: 'x。' }
const command: GlossaryEntry = { id: 'command', ja: 'コマンド', en: 'Command', def: 'x。' }
const aggregate: GlossaryEntry = { id: 'aggregate', ja: '集約', en: 'Aggregate', def: 'x。' }
const invariant: GlossaryEntry = {
  id: 'aggregateInvariant',
  ja: '集約不変条件',
  en: 'Aggregate Invariant',
  def: 'x。',
}

/** entry 付きセグメントの id を順に取り出す */
function underlined(segs: Segment[]): string[] {
  return segs.filter((s): s is Segment & { entry: GlossaryEntry } => 'entry' in s).map((s) => s.entry.id)
}

describe('annotate — 本文用語の下線分割', () => {
  it('用語2個を含む文を正しく分割する', () => {
    const segs = annotate('イベントとコマンドを見分ける', [event, command])
    expect(underlined(segs)).toEqual(['event', 'command'])
    expect(segs.map((s) => s.text).join('')).toBe('イベントとコマンドを見分ける')
  })

  it('用語がない文は1セグメント（地の文）になる', () => {
    const segs = annotate('色とアイコンで仲間分け', [event, command])
    expect(underlined(segs)).toEqual([])
    expect(segs).toHaveLength(1)
  })

  it('最長一致: 「集約不変条件」を許可リストに含めると「集約」で割れない', () => {
    const segs = annotate('集約不変条件を守る', [aggregate, invariant])
    expect(underlined(segs)).toEqual(['aggregateInvariant'])
  })

  it('初出のみ下線（同じ語が2回出ても1回だけ）', () => {
    const segs = annotate('イベントはイベントである', [event])
    expect(underlined(segs)).toEqual(['event'])
  })

  it('括弧内の補足は用語そのものでない限り下線対象にしない', () => {
    // 「（オレンジ・過去形）」には用語 ja の完全一致が無いのでマッチしない
    const segs = annotate('オレンジの付箋（オレンジ・過去形）', [event, command])
    expect(underlined(segs)).toEqual([])
  })

  it('再構成すると元文に一致する（文字の欠落・重複がない）', () => {
    const text = '集約はコマンドを受けてイベントを発行する'
    const segs = annotate(text, [aggregate, command, event])
    expect(segs.map((s) => s.text).join('')).toBe(text)
  })
})
