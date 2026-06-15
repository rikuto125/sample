import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundEngine, loadSoundEnabled, saveSoundEnabled } from './sound'

// jsdom には AudioContext が無い。no-op で握りつぶし、テストを落とさないことを担保する。

afterEach(() => {
  localStorage.clear()
  soundEngine.setEnabled(false)
  vi.restoreAllMocks()
})

describe('sound engine — no-op 安全性（AudioContext 無し環境）', () => {
  it('play / playStars は throw しない（AudioContext 不在でも握りつぶす）', () => {
    soundEngine.setEnabled(true)
    expect(() => soundEngine.play('snap')).not.toThrow()
    expect(() => soundEngine.play('correct')).not.toThrow()
    expect(() => soundEngine.play('fanfare')).not.toThrow()
    expect(() => soundEngine.playStars(3)).not.toThrow()
  })

  it('OFF のときは何もしない（throw しない）', () => {
    soundEngine.setEnabled(false)
    expect(() => soundEngine.play('correct')).not.toThrow()
  })
})

describe('sound 設定の永続化（Progress とは別キー）', () => {
  it('setEnabled→isEnabled の往復', () => {
    soundEngine.setEnabled(true)
    expect(soundEngine.isEnabled()).toBe(true)
    soundEngine.setEnabled(false)
    expect(soundEngine.isEnabled()).toBe(false)
  })

  it("saveSoundEnabled は 'stormquest.sound' のみ書き、progress を汚さない", () => {
    localStorage.setItem('stormquest.progress', 'PRESERVE')
    saveSoundEnabled(true)
    expect(localStorage.getItem('stormquest.sound')).toBe('1')
    expect(localStorage.getItem('stormquest.progress')).toBe('PRESERVE')
  })

  it('loadSoundEnabled は未設定/壊れた値で false を返す', () => {
    expect(loadSoundEnabled()).toBe(false)
    localStorage.setItem('stormquest.sound', 'garbage')
    expect(loadSoundEnabled()).toBe(false)
    localStorage.setItem('stormquest.sound', '1')
    expect(loadSoundEnabled()).toBe(true)
  })
})
