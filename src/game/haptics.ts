// 触覚フィードバック（スマホのバイブ）。navigator.vibrate で軽量・外部資産ゼロ。
//
// 不変原則:
// - 音とは独立トグル（別キー 'stormquest.vibe'）。Progress(VERSION=1) は汚さない。
// - iOS Safari は navigator.vibrate 非対応 → 機能検出して no-op（クラッシュさせない）。
// - prefers-reduced-motion では振動させない（触覚も「動き」として配慮）。
// - 採点・進行に一切影響しない表示専用の副作用（バイブ OFF でも ★3 可能）。

export type HapticName = 'snap' | 'correct' | 'mistake' | 'star' | 'fanfare'

const SETTING_KEY = 'stormquest.vibe'

// イベントごとの振動パターン（ms。配列は [振動, 停止, 振動, …]）。
// 控えめ＝不快にしない。誤りは短い2連で「弾かれた」感、完走だけ少し豪華に。
const PATTERNS: Record<HapticName, number | number[]> = {
  snap: 15, // 配置：ごく軽い1発
  correct: 30, // 正解：軽い1発
  mistake: [20, 40, 20], // 誤り：短い2連
  star: [15, 50, 15, 50, 15], // スター：3連（星表示の stagger に合わせる）
  fanfare: [40, 60, 40, 60, 80], // 完走：少し豪華
}

export function loadVibeEnabled(): boolean {
  try {
    return localStorage.getItem(SETTING_KEY) === '1'
  } catch {
    return false // プライベートモード等。既定 OFF。
  }
}

export function saveVibeEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SETTING_KEY, enabled ? '1' : '0')
  } catch {
    // localStorage 不可でも無視
  }
}

/** この端末で振動が使えるか（iOS Safari 等は false）。 */
export function isVibrateSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  )
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export interface Haptics {
  fire(name: HapticName): void
  setEnabled(enabled: boolean): void
  isEnabled(): boolean
  /** この端末で振動が使えるか（トグル UI の出し分け用）。 */
  isSupported(): boolean
}

class VibrateHaptics implements Haptics {
  private enabled: boolean

  constructor() {
    this.enabled = loadVibeEnabled()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isSupported(): boolean {
    return isVibrateSupported()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    saveVibeEnabled(enabled)
  }

  fire(name: HapticName): void {
    if (!this.enabled) return
    if (!isVibrateSupported()) return
    if (prefersReducedMotion()) return
    try {
      navigator.vibrate(PATTERNS[name])
    } catch {
      // 一部端末でユーザー操作外の vibrate が無効化されるが、握りつぶす
    }
  }
}

/** アプリ全体で共有するシングルトン。 */
export const haptics: Haptics = new VibrateHaptics()
