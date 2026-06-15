import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  haptics,
  loadVibeEnabled,
  saveVibeEnabled,
  isIOS,
} from './haptics'

afterEach(() => {
  localStorage.clear()
  haptics.setEnabled(false)
  vi.restoreAllMocks()
  document.querySelectorAll('#sq-haptic-switch, label[for=sq-haptic-switch]').forEach((el) =>
    el.remove(),
  )
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

describe('iOS switch 触覚ハック', () => {
  function stubIOS() {
    // vibrate 非対応 + iPhone UA に偽装
    vi.stubGlobal('navigator', {
      ...navigator,
      vibrate: undefined,
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15',
      maxTouchPoints: 5,
    })
    // reduced-motion を false に
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
      configurable: true,
    })
  }

  it('isIOS が iPhone UA で true', () => {
    stubIOS()
    expect(isIOS()).toBe(true)
  })

  it('isSupported は iOS でも true（トグルを出す）', () => {
    stubIOS()
    expect(haptics.isSupported()).toBe(true)
  })

  it('fire で隠し switch label が生成され click される', () => {
    stubIOS()
    haptics.setEnabled(true)
    const clicks: string[] = []
    // label.click を監視（jsdom は switch 触覚を出さないが click 呼び出しは検証可）
    const origClick = HTMLElement.prototype.click
    HTMLElement.prototype.click = function () {
      if (this instanceof HTMLLabelElement) clicks.push('label')
      return origClick.call(this)
    }
    haptics.fire('correct')
    HTMLElement.prototype.click = origClick
    expect(document.getElementById('sq-haptic-switch')).not.toBeNull()
    expect(clicks).toContain('label')
  })
})
