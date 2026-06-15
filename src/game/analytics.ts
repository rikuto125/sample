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

interface AnalyticsEvent {
  name: EventName
  props?: Record<string, string | number | boolean>
  t: number
}

declare global {
  interface Window {
    __sq_events?: AnalyticsEvent[]
  }
}

export function track(
  name: EventName,
  props?: Record<string, string | number | boolean>,
): void {
  if (typeof window === 'undefined') return
  window.__sq_events ??= []
  window.__sq_events.push({ name, props, t: Date.now() })
  // 開発時の可視化。本番ビルドでは呼ばれてもノイズにならない程度。
  if (import.meta.env?.DEV) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', name, props ?? {})
  }
}
