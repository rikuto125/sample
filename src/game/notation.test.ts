import { describe, expect, it } from 'vitest'
import { detectTense, kindHint, tenseAdvice } from './notation'

describe('detectTense — 語尾からの時制推定（助言用）', () => {
  const cases: [string, ReturnType<typeof detectTense>][] = [
    ['配達が完了した', 'past'],
    ['注文が確定された', 'past'],
    ['在庫が引き当てられた', 'past'],
    ['配達する', 'present'],
    ['注文を確定する', 'present'],
    ['', 'uncertain'],
    ['顧客', 'uncertain'],
  ]
  it.each(cases)('「%s」→ %s', (text, expected) => {
    expect(detectTense(text)).toBe(expected)
  })
})

describe('kindHint — 時制を持つのは event/command/policy のみ', () => {
  it('event/command/policy には tense がある', () => {
    expect(kindHint('event').tense).toBe('past')
    expect(kindHint('command').tense).toBe('present')
    expect(kindHint('policy').tense).toBe('present')
  })
  it('actor/externalSystem/readModel/aggregate には tense が無い（捏造しない）', () => {
    expect(kindHint('actor').tense).toBeUndefined()
    expect(kindHint('externalSystem').tense).toBeUndefined()
    expect(kindHint('readModel').tense).toBeUndefined()
    expect(kindHint('aggregate').tense).toBeUndefined()
  })
  it('全種別に placeholder がある', () => {
    for (const k of ['event', 'command', 'actor', 'policy', 'externalSystem', 'readModel', 'aggregate'] as const) {
      expect(kindHint(k).placeholder.length).toBeGreaterThan(0)
    }
  })
})

describe('tenseAdvice — 食い違いのみ警告（強制しない）', () => {
  it('event に現在形 → 警告', () => {
    expect(tenseAdvice('event', '注文を確定する')).toBeTruthy()
  })
  it('event に過去形 → 警告なし', () => {
    expect(tenseAdvice('event', '注文が確定した')).toBeNull()
  })
  it('command に過去形 → 警告', () => {
    expect(tenseAdvice('command', '注文が確定した')).toBeTruthy()
  })
  it('時制を持たない種別は常に警告なし', () => {
    expect(tenseAdvice('actor', '顧客が注文した')).toBeNull()
    expect(tenseAdvice('readModel', '一覧を見る')).toBeNull()
  })
  it('空入力・判定不能は警告なし', () => {
    expect(tenseAdvice('event', '')).toBeNull()
    expect(tenseAdvice('event', '顧客')).toBeNull()
  })
})
