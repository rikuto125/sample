import type { AnalyticsEvent, Sink } from './analytics'

// GoatCounter（Cookieless・無料・静的サイト向き）への計測 sink。
//
// 不変原則:
// - Cookieless / PII 非送信: toPath は allowlist 方式。列挙したキーのみパスへ織り込み、
//   列挙外プロパティ（term 等）は値の性質に関わらず一切パスに出さない。
// - 計測がプレイを阻害しない: 送信失敗は呼び出し側(track の try/catch)で握りつぶす。
// - 未契約でも壊れない: shouldEnableGoatCounter が false なら sink を登録しない（no-op）。

interface EnvLike {
  PROD?: boolean
  VITE_GOATCOUNTER_CODE?: string
}

/** 送信を有効化するか（PROD かつ サイトコードあり、のみ true）。純粋関数。 */
export function shouldEnableGoatCounter(env: EnvLike): boolean {
  return Boolean(env.PROD && env.VITE_GOATCOUNTER_CODE)
}

/**
 * イベント→GoatCounter のパス。allowlist で低カーディナリティ軸のみ織り込む。
 * 自由文字列（term 等）は列挙しない＝パスに出ない（PII/カーディナリティ防止）。
 */
export function toPath(e: AnalyticsEvent): string {
  const p = e.props ?? {}
  const s = (v: unknown) => String(v ?? '')
  switch (e.name) {
    case 'onboarding_complete':
      return 'onboarding/complete'
    case 'stage_start':
      return `stage/start/${s(p.stage)}`
    case 'stage_clear':
      return `stage/clear/${s(p.stage)}/${s(p.stars)}star`
    case 'stage_retry':
      return `stage/retry/${s(p.stage)}`
    case 'chapter_complete':
      return `chapter/complete/${s(p.chapter)}`
    case 'game_complete':
      return 'game/complete'
    case 'share_clicked':
      return 'share/clicked'
    case 'vocab_opened':
      return `vocab/opened/${s(p.via)}` // term は出さない
    case 'hint_used':
      return 'hint/used'
    default:
      return `event/${e.name}`
  }
}

/** ダッシュボード表示用タイトル（イベント名のみ・自由文字列を含めない）。 */
export function toTitle(e: AnalyticsEvent): string {
  return e.name
}

/** GoatCounter /count への送信 sink を作る。 */
export function makeGoatCounterSink(endpoint: string): Sink {
  return (e: AnalyticsEvent) => {
    const url = `${endpoint}?p=${encodeURIComponent(
      '/' + toPath(e),
    )}&t=${encodeURIComponent(toTitle(e))}&e=1`
    // sendBeacon 優先。未対応時のみ no-referrer の GET フォールバック。
    const nav = navigator as Navigator & {
      sendBeacon?: (url: string) => boolean
    }
    if (typeof nav.sendBeacon === 'function' && nav.sendBeacon(url)) return
    const img = new Image()
    img.referrerPolicy = 'no-referrer'
    img.src = url
  }
}
