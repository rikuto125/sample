import { afterEach, describe, expect, it, vi } from 'vitest'
import { soundEngine, loadSoundEnabled, saveSoundEnabled } from './sound'

// jsdom には AudioContext が無い。no-op で握りつぶし、テストを落とさないことを担保する。

afterEach(() => {
  // engine の内部状態を OFF に戻してから localStorage を空にする
  // （setEnabled は '0' を書くので、最後に clear して未設定＝既定状態へ戻す）。
  soundEngine.setEnabled(false)
  localStorage.clear()
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

  it('loadSoundEnabled は既定 ON（未設定/壊れた値で true）。明示 0 のみ OFF', () => {
    // 既定 ON: 初回プレイ（未設定）と壊れた値は ON。
    expect(loadSoundEnabled()).toBe(true)
    localStorage.setItem('stormquest.sound', 'garbage')
    expect(loadSoundEnabled()).toBe(true)
    localStorage.setItem('stormquest.sound', '1')
    expect(loadSoundEnabled()).toBe(true)
    // 明示的に OFF にした選択だけは尊重する。
    localStorage.setItem('stormquest.sound', '0')
    expect(loadSoundEnabled()).toBe(false)
  })
})
