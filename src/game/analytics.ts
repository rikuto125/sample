// 軽量・Cookieless な計測。実バックエンドは未接続（GitHub Pages 前提）。
// まずは window 上のキューに積むだけにし、後で GoatCounter 等へ差し替え可能にする。
// 成功指標（DESIGN.md §6）: 完走率 / MODE2着手率 / 用語ポップ開封率。

// 北極星=完走率/シェア率を測る穴埋め: share_clicked が片翼、onboarding_complete /
// chapter_complete が完走ファネルの節目。PII は props に入れない（Cookieless 維持）。
type EventName =
  | 'stage_start'
  | 'stage_clear'
  | 'stage_retry'
  | 'game_complete'
  | 'vocab_opened'
  | 'hint_used'
  | 'onboarding_complete'
  | 'chapter_complete'
  | 'share_clicked'

export interface AnalyticsEvent {
  name: EventName
  props?: Record<string, string | number | boolean>
  t: number
}

declare global {
  interface Window {
    __sq_events?: AnalyticsEvent[]
  }
}

/** 計測の追加 sink（GoatCounter 等）。track() を壊さず後付けする。 */
export type Sink = (e: AnalyticsEvent) => void
const sinks: Sink[] = []

export function registerSink(sink: Sink): void {
  sinks.push(sink)
}

/** テスト専用: 登録済み sink をクリア。 */
export function __resetSinks(): void {
  sinks.length = 0
}

export function track(
  name: EventName,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return
  const e: AnalyticsEvent = { name, props, t: Date.now() }
  window.__sq_events ??= []
  window.__sq_events.push(e)
  // 開発時の可視化（送信経路ではない。送信は sink）。
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', name, props ?? {})
  }
  // 追加 sink へ配送。計測がプレイを阻害しないよう必ず握りつぶす。
  for (const s of sinks) {
    try {
      s(e)
    } catch {
      // ignore: 送信失敗はプレイに影響させない
    }
  }
}
