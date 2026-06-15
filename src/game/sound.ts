// 効果音エンジン。WebAudio で軽量生成（mp3 資産ゼロ＝無料/静的ホスティング向き）。
//
// 不変原則:
// - 音 OFF でも ★3 達成可能（scoreStars は音と完全独立。ここは表示専用の副作用）。
// - 設定は Progress とは別キー 'stormquest.sound' に隔離（VERSION=1 スキーマ不変）。
// - AudioContext は自動再生制約のため初回ユーザー操作まで生成しない（lazy）。
// - jsdom/SSR で AudioContext が無くても no-op で握りつぶす（テストを落とさない）。

export type SoundName = 'snap' | 'correct' | 'mistake' | 'star' | 'fanfare'

const SETTING_KEY = 'stormquest.sound'

export function loadSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SETTING_KEY) === '1'
  } catch {
    return false // プライベートモード等。既定 OFF。
  }
}

export function saveSoundEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(SETTING_KEY, enabled ? '1' : '0')
  } catch {
    // localStorage 不可でも無視（音設定は揮発してよい）
  }
}

interface AudioCtor {
  new (): AudioContext
}

function getAudioCtor(): AudioCtor | null {
  const w = globalThis as unknown as {
    AudioContext?: AudioCtor
    webkitAudioContext?: AudioCtor
  }
  return w.AudioContext ?? w.webkitAudioContext ?? null
}

export interface SoundEngine {
  play(name: SoundName): void
  /** 星の数だけ「カチッ」を連続（90ms 間隔・同一ピッチ＝煽らない） */
  playStars(n: number): void
  setEnabled(enabled: boolean): void
  isEnabled(): boolean
}

class WebAudioEngine implements SoundEngine {
  private enabled: boolean
  private ctx: AudioContext | null = null

  constructor() {
    this.enabled = loadSoundEnabled()
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    saveSoundEnabled(enabled)
    // ON にした瞬間のユーザー操作で AudioContext を unlock（自動再生制約）
    if (enabled) this.ensureCtx()
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx
    try {
      const Ctor = getAudioCtor()
      if (!Ctor) return null
      this.ctx = new Ctor()
    } catch {
      this.ctx = null
    }
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  /** ワンショットのトーン（oscillator + gain エンベロープ）。 */
  private tone(
    opts: {
      type: OscillatorType
      from: number
      to?: number
      durMs: number
      gain: number
    },
    at = 0,
  ): void {
    const ctx = this.ensureCtx()
    if (!ctx) return
    const t0 = ctx.currentTime + at
    const dur = opts.durMs / 1000
    const osc = ctx.createOscillator()
    const g = ctx.createGain()
    osc.type = opts.type
    osc.frequency.setValueAtTime(opts.from, t0)
    if (opts.to != null) {
      osc.frequency.linearRampToValueAtTime(opts.to, t0 + dur)
    }
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.linearRampToValueAtTime(opts.gain, t0 + 0.004)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
    osc.connect(g).connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + dur + 0.02)
  }

  play(name: SoundName): void {
    if (!this.enabled) return
    if (!this.ensureCtx()) return
    switch (name) {
      case 'snap': // 「コトッ」低め・木質、ピッチ固定（射幸感を出さない）
        this.tone({ type: 'triangle', from: 180, durMs: 70, gain: 0.14 })
        break
      case 'correct': // 「ポン↑」上昇＝肯定
        this.tone({ type: 'sine', from: 520, to: 780, durMs: 130, gain: 0.16 })
        break
      case 'mistake': // 「コッ」控えめ・下降させない＝叱責にしない
        this.tone({ type: 'sine', from: 200, durMs: 55, gain: 0.1 })
        break
      case 'star':
        this.tone({ type: 'square', from: 1200, durMs: 28, gain: 0.12 })
        break
      case 'fanfare': // 2秒以内。C5 E5 G5 C6 のアルペジオ
        this.fanfare()
        break
    }
  }

  playStars(n: number): void {
    if (!this.enabled) return
    if (!this.ensureCtx()) return
    const count = Math.max(0, Math.min(3, n))
    for (let i = 0; i < count; i++) {
      this.tone(
        { type: 'square', from: 1200, durMs: 28, gain: 0.12 },
        (i * 90) / 1000,
      )
    }
  }

  private fanfare(): void {
    const notes = [523, 659, 784, 1046] // C5 E5 G5 C6
    notes.forEach((f, i) => {
      const last = i === notes.length - 1
      this.tone(
        { type: 'triangle', from: f, durMs: last ? 400 : 160, gain: 0.15 },
        (i * 160) / 1000,
      )
    })
  }
}

/** アプリ全体で共有するシングルトン。 */
export const soundEngine: SoundEngine = new WebAudioEngine()
