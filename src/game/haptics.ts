// 触覚フィードバック（スマホのバイブ）。外部資産ゼロ。
//
// 2 経路:
// - Android 等: navigator.vibrate（パターン指定可）
// - iOS Safari: vibrate 非対応のため <input type="checkbox" switch> + label.click()
//   のスイッチ触覚ハックで代替（パターン制御は不可・単発）。将来壊れる可能性あり。
//
// 不変原則:
// - 音とは独立トグル（別キー 'stormquest.vibe'）。Progress(VERSION=1) は汚さない。
// - どちらの経路も無ければ no-op（クラッシュさせない）。
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

/** navigator.vibrate が使えるか（Android Chrome 等）。 */
export function isVibrateSupported(): boolean {
  return (
    typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
  )
}

/** iOS（iPhone/iPad）か。switch 触覚ハックの対象判定に使う。 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = typeof navigator.userAgent === 'string' ? navigator.userAgent : ''
  // iPadOS 13+ は Mac を名乗るので touch 点数も見る
  const iOSUA = /iPad|iPhone|iPod/.test(ua)
  const iPadOS =
    ua.includes('Macintosh') &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 1
  return iOSUA || iPadOS
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
  // iOS switch 触覚ハック用の隠し要素（lazy 生成）
  private hapticLabel: HTMLLabelElement | null = null

  constructor() {
    this.enabled = loadVibeEnabled()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  isSupported(): boolean {
    // vibrate 対応端末 or iOS（switch ハックが効く可能性）ならトグルを出す
    return isVibrateSupported() || isIOS()
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    saveVibeEnabled(enabled)
    if (enabled && isIOS()) this.ensureSwitch() // 初回操作中に要素を用意
  }

  /** iOS 用の隠し switch + label を1度だけ生成。 */
  private ensureSwitch(): void {
    if (this.hapticLabel || typeof document === 'undefined') return
    try {
      const id = 'sq-haptic-switch'
      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.setAttribute('switch', '') // Safari の switch トグル＝触覚を伴う
      checkbox.id = id
      checkbox.setAttribute('aria-hidden', 'true')
      checkbox.tabIndex = -1
      const label = document.createElement('label')
      label.setAttribute('for', id)
      label.setAttribute('aria-hidden', 'true')
      // 視覚外・操作不可に隠す（盤面に影響させない）
      for (const el of [checkbox, label]) {
        el.style.position = 'fixed'
        el.style.left = '-9999px'
        el.style.width = '1px'
        el.style.height = '1px'
        el.style.opacity = '0'
        el.style.pointerEvents = 'none'
      }
      document.body.appendChild(checkbox)
      document.body.appendChild(label)
      this.hapticLabel = label
    } catch {
      this.hapticLabel = null
    }
  }

  fire(name: HapticName): void {
    if (!this.enabled) return
    if (prefersReducedMotion()) return
    // 経路1: navigator.vibrate（Android 等・パターン指定可）
    if (isVibrateSupported()) {
      try {
        navigator.vibrate(PATTERNS[name])
      } catch {
        // ユーザー操作外で無効化される端末があるが握りつぶす
      }
      return
    }
    // 経路2: iOS の switch 触覚ハック（パターン不可・単発トグル）
    if (isIOS()) {
      this.ensureSwitch()
      try {
        this.hapticLabel?.click()
      } catch {
        // ハックが将来効かなくなっても no-op
      }
    }
  }
}

/** アプリ全体で共有するシングルトン。 */
export const haptics: Haptics = new VibrateHaptics()
