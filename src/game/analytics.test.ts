import { beforeEach, describe, expect, it, vi } from 'vitest'
import { track, registerSink, __resetSinks } from './analytics'

beforeEach(() => {
  __resetSinks()
  window.__sq_events = []
})

describe('track — sink 配送と既存経路の維持', () => {
  it('window.__sq_events に従来通り積む', () => {
    track('stage_clear', { stage: 'ch1-s1', stars: 3 })
    expect(window.__sq_events).toHaveLength(1)
    expect(window.__sq_events?.[0].name).toBe('stage_clear')
  })

  it('登録した sink に配送される', () => {
    const spy = vi.fn()
    registerSink(spy)
    track('game_complete')
    expect(spy).toHaveBeenCalledOnce()
    expect(spy.mock.calls[0][0].name).toBe('game_complete')
  })

  it('例外を投げる sink でも track は throw しない（プレイを阻害しない）', () => {
    registerSink(() => {
      throw new Error('boom')
    })
    expect(() => track('share_clicked', { method: 'twitter' })).not.toThrow()
    // 握りつぶしても __sq_events への記録は残る
    expect(window.__sq_events).toHaveLength(1)
  })
})
