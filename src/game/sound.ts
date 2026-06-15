// 効果音エンジン。音源ファイル（CC0/再配布OK）を decodeAudioData で再生し、
// 読み込めない cue は WebAudio 生成にフォールバックする。
//
// 不変原則:
// - 音 OFF でも ★3 達成可能（scoreStars は音と完全独立。ここは表示専用の副作用）。
// - 設定は Progress とは別キー 'stormquest.sound' に隔離（VERSION=1 スキーマ不変）。
// - AudioContext は自動再生制約のため初回ユーザー操作まで生成しない（lazy）。
// - jsdom/SSR で AudioContext が無くても no-op で握りつぶす（テストを落とさない）。
// - 音源の読み込み失敗（404/decode 不可）はフォールバック合成で握りつぶす。

export type SoundName = 'snap' | 'correct' | 'mistake' | 'star' | 'fanfare'

const SETTING_KEY = 'stormquest.sound'

// cue → 音源ファイル（public/sounds/ 配下、base 込みで解決）。
// 未登録の cue は WebAudio 合成にフォールバックする。
// 出典: Onoma-Pop04（再配布OK・商用OK）。詳細は public/sounds/CREDITS.md。
const SAMPLE_URLS: Partial<Record<SoundName, string>> = {
  snap: 'sounds/pop.mp3',
  correct: 'sounds/pop.mp3',
  star: 'sounds/pop.mp3',
  // mistake / fanfare は合成のまま（pop は否定音/ファンファーレに不向き）
}

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
  // デコード済みバッファ（url → buffer）。読み込み失敗は null で記録し合成に落とす。
  private buffers = new Map<string, AudioBuffer | null>()

  constructor() {
    this.enabled = loadSoundEnabled()
  }

  /** 音源を取得・デコードしてキャッシュ（失敗時は null＝以後フォールバック）。 */
  private async loadSample(url: string): Promise<void> {
    if (this.buffers.has(url)) return
    const ctx = this.ensureCtx()
    if (!ctx) return
    const base = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')
    try {
      const res = await fetch(base + url)
      if (!res.ok) throw new Error(`fetch ${res.status}`)
      const arr = await res.arrayBuffer()
      const buf = await ctx.decodeAudioData(arr)
      this.buffers.set(url, buf)
    } catch {
      this.buffers.set(url, null) // 以後この cue は合成にフォールバック
    }
  }

  /** デコード済みバッファを再生。未ロード/失敗なら false を返す（合成に委ねる）。 */
  private playSample(url: string, gain = 0.7, at = 0): boolean {
    const ctx = this.ensureCtx()
    if (!ctx) return false
    const buf = this.buffers.get(url)
    if (!buf) {
      void this.loadSample(url) // 次回用に取りに行く（今回は合成にフォールバック）
      return false
    }
    const src = ctx.createBufferSource()
    const g = ctx.createGain()
    g.gain.value = gain
    src.buffer = buf
    src.connect(g).connect(ctx.destination)
    src.start(ctx.currentTime + at)
    return true
  }

  isEnabled(): boolean {
    return this.enabled
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled
    saveSoundEnabled(enabled)
    if (enabled) {
      // ON にした瞬間のユーザー操作で AudioContext を unlock（自動再生制約）
      this.ensureCtx()
      // 先読み（初回イベントが合成フォールバックにならないように）
      for (const url of new Set(Object.values(SAMPLE_URLS))) {
        void this.loadSample(url)
      }
    }
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
    // 音源があれば再生。未ロード/失敗なら合成にフォールバック。
    const url = SAMPLE_URLS[name]
    if (url && this.playSample(url)) return
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
    const url = SAMPLE_URLS.star
    for (let i = 0; i < count; i++) {
      const at = (i * 90) / 1000
      // 音源があれば連続再生、なければ合成クリック
      if (url && this.playSample(url, 0.6, at)) continue
      this.tone({ type: 'square', from: 1200, durMs: 28, gain: 0.12 }, at)
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
