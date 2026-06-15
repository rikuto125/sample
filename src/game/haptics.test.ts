import { afterEach, describe, expect, it, vi } from 'vitest'
import { haptics, loadVibeEnabled, saveVibeEnabled } from './haptics'

afterEach(() => {
  localStorage.clear()
  haptics.setEnabled(false)
  vi.restoreAllMocks()
})

describe('haptics — no-op 安全性', () => {
  it('vibrate 非対応環境（jsdom）でも fire は throw しない', () => {
    haptics.setEnabled(true)
    expect(() => haptics.fire('correct')).not.toThrow()
    expect(() => haptics.fire('fanfare')).not.toThrow()
  })

  it('OFF のときは vibrate を呼ばない', () => {
    const spy = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, vibrate: spy })
    haptics.setEnabled(false)
    haptics.fire('snap')
    expect(spy).not.toHaveBeenCalled()
  })

  it('ON かつ対応端末では vibrate を呼ぶ（reduced-motion 非設定時）', () => {
    const spy = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, vibrate: spy })
    vi.stubGlobal('matchMedia', undefined) // matchMedia 無し＝reduced-motion 判定 false
    // window.matchMedia を無効化（prefers-reduced-motion を false 扱いに）
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true })
    haptics.setEnabled(true)
    haptics.fire('correct')
    expect(spy).toHaveBeenCalledOnce()
  })
})

describe('haptics 設定の永続化（音とは別キー）', () => {
  it('setEnabled→isEnabled の往復', () => {
    haptics.setEnabled(true)
    expect(haptics.isEnabled()).toBe(true)
    haptics.setEnabled(false)
    expect(haptics.isEnabled()).toBe(false)
  })

  it("saveVibeEnabled は 'stormquest.vibe' のみ書き、sound/progress を汚さない", () => {
    localStorage.setItem('stormquest.sound', '1')
    localStorage.setItem('stormquest.progress', 'PRESERVE')
    saveVibeEnabled(true)
    expect(localStorage.getItem('stormquest.vibe')).toBe('1')
    expect(localStorage.getItem('stormquest.sound')).toBe('1')
    expect(localStorage.getItem('stormquest.progress')).toBe('PRESERVE')
  })

  it('loadVibeEnabled は未設定/壊れた値で false', () => {
    expect(loadVibeEnabled()).toBe(false)
    localStorage.setItem('stormquest.vibe', 'x')
    expect(loadVibeEnabled()).toBe(false)
    localStorage.setItem('stormquest.vibe', '1')
    expect(loadVibeEnabled()).toBe(true)
  })
})
