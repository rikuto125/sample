import { describe, expect, it } from 'vitest'
import {
  toPath,
  toTitle,
  shouldEnableGoatCounter,
} from './goatcounter'
import type { AnalyticsEvent } from './analytics'

function ev(name: AnalyticsEvent['name'], props?: AnalyticsEvent['props']): AnalyticsEvent {
  return { name, props, t: 0 }
}

describe('toPath — allowlist でパスを作る', () => {
  const cases: [AnalyticsEvent, string][] = [
    [ev('onboarding_complete', { skipped: true }), 'onboarding/complete'],
    [ev('stage_start', { stage: 'ch1-s1' }), 'stage/start/ch1-s1'],
    [ev('stage_clear', { stage: 'ch1-s1', stars: 3 }), 'stage/clear/ch1-s1/3star'],
    [ev('chapter_complete', { chapter: 'ch1', stars: 3 }), 'chapter/complete/ch1'],
    [ev('game_complete'), 'game/complete'],
    [ev('share_clicked', { method: 'twitter' }), 'share/clicked'],
    [ev('vocab_opened', { via: 'inline', term: 'aggregate' }), 'vocab/opened/inline'],
  ]
  it.each(cases)('%o → %s', (e, expected) => {
    expect(toPath(e)).toBe(expected)
  })

  it('vocab_opened の term はパスに一切現れない（PII/カーディナリティ防止）', () => {
    const path = toPath(ev('vocab_opened', { via: 'legend', term: 'v-secret-term' }))
    expect(path).not.toContain('v-secret-term')
    expect(path).not.toContain('secret')
  })

  it('allowlist 外プロパティはパスに出ない（どのイベントでも）', () => {
    const path = toPath(ev('share_clicked', { method: 'webshare', email: 'x@y.z' }))
    expect(path).not.toContain('x@y.z')
  })
})

describe('toTitle — イベント名のみ', () => {
  it('自由文字列を含めない', () => {
    expect(toTitle(ev('vocab_opened', { term: 'aggregate' }))).toBe('vocab_opened')
  })
})

describe('shouldEnableGoatCounter — env 分岐', () => {
  it('PROD かつ code あり → true', () => {
    expect(shouldEnableGoatCounter({ PROD: true, VITE_GOATCOUNTER_CODE: 'mysite' })).toBe(true)
  })
  it('DEV → false', () => {
    expect(shouldEnableGoatCounter({ PROD: false, VITE_GOATCOUNTER_CODE: 'mysite' })).toBe(false)
  })
  it('code 未設定 → false（未契約でも壊れない）', () => {
    expect(shouldEnableGoatCounter({ PROD: true })).toBe(false)
    expect(shouldEnableGoatCounter({ PROD: true, VITE_GOATCOUNTER_CODE: '' })).toBe(false)
  })
})
