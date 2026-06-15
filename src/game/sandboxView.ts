import type { SandboxCard } from './sandboxTypes'

// キャンバスのビュー幾何（純粋関数）。座標 clamp・全体表示 fit・新規配置の空き探索。
// engine.ts / progress.ts には依存しない（採点とは無関係の自由制作）。
// CARD_W/CARD_H は screens.css の `.sandbox-world .sticky.small` の width/height と
// 厳密一致させること（ここを変えたら CSS も同値に変える＝clamp とはみ出し防止の前提）。

export const WORLD_W = 4000
export const WORLD_H = 3000
export const CARD_W = 132
export const CARD_H = 112
export const ZOOM_MIN = 0.35
export const ZOOM_MAX = 1.6
/** 「全体表示」用の下限。手動ズームの下限(ZOOM_MIN)より下まで縮めて全体を必ず収める。 */
export const ZOOM_FIT_MIN = 0.12

export interface Viewport {
  panX: number
  panY: number
  scale: number
}

export const initialViewport: Viewport = { panX: 0, panY: 0, scale: 1 }

export function clampScale(s: number): number {
  return Math.min(Math.max(ZOOM_MIN, s), ZOOM_MAX)
}

/** カードをワールド内に必ず収める（負・右下はみ出しを両方止める）。 */
export function clampCard(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(0, x), WORLD_W - CARD_W),
    y: Math.min(Math.max(0, y), WORLD_H - CARD_H),
  }
}

export interface Bounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

/** 全カードの外接矩形。空なら null（fit の土台）。reduce で巨大配列でも安全。 */
export function boundsOf(
  cards: readonly Pick<SandboxCard, 'x' | 'y'>[],
): Bounds | null {
  if (cards.length === 0) return null
  return cards.reduce<Bounds>(
    (b, c) => ({
      minX: Math.min(b.minX, c.x),
      minY: Math.min(b.minY, c.y),
      maxX: Math.max(b.maxX, c.x + CARD_W),
      maxY: Math.max(b.maxY, c.y + CARD_H),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  )
}

/** 全カードがビューポートに収まる Viewport（縦横とも中央寄せ）。 */
export function fitViewport(
  cards: readonly Pick<SandboxCard, 'x' | 'y'>[],
  vpW: number,
  vpH: number,
): Viewport {
  const b = boundsOf(cards)
  if (!b || vpW <= 0 || vpH <= 0) return initialViewport
  const pad = 40
  const bw = b.maxX - b.minX + pad * 2
  const bh = b.maxY - b.minY + pad * 2
  // 「全体表示」は ZOOM_MIN より下まで許す（横長の図も必ず全体が収まる）。
  const raw = Math.min(vpW / bw, vpH / bh)
  const scale = Math.min(Math.max(ZOOM_FIT_MIN, raw), ZOOM_MAX)
  return {
    scale,
    panX: -(b.minX - pad) * scale + (vpW - bw * scale) / 2,
    panY: -(b.minY - pad) * scale + (vpH - bh * scale) / 2,
  }
}

/** ビューポート中心のワールド座標（新規カードの起点。カード中心を合わせる）。 */
export function viewCenterWorld(
  vp: Viewport,
  vpW: number,
  vpH: number,
): { x: number; y: number } {
  return {
    x: (vpW / 2 - vp.panX) / vp.scale - CARD_W / 2,
    y: (vpH / 2 - vp.panY) / vp.scale - CARD_H / 2,
  }
}

/**
 * origin を起点に、既存カードと重ならない空きセルを格子走査で探す。
 * stale closure な n=cards.length を捨て、実占有座標を見て決める。
 * 全リング埋まり時も clampCard 内に収める（画面外に出さない）。
 */
export function nextCardPosition(
  cards: readonly Pick<SandboxCard, 'x' | 'y'>[],
  origin: { x: number; y: number },
): { x: number; y: number } {
  const stepX = CARD_W + 16
  const stepY = CARD_H + 16
  const occupied = (x: number, y: number): boolean =>
    cards.some(
      (c) => Math.abs(c.x - x) < stepX * 0.6 && Math.abs(c.y - y) < stepY * 0.6,
    )
  for (let ring = 0; ring < 12; ring++) {
    for (let dy = 0; dy <= ring; dy++) {
      for (let dx = 0; dx <= ring; dx++) {
        if (dx < ring && dy < ring) continue
        const p = clampCard(origin.x + dx * stepX, origin.y + dy * stepY)
        if (!occupied(p.x, p.y)) return p
      }
    }
  }
  return clampCard(origin.x, origin.y)
}
