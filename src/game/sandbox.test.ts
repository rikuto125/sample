import { describe, expect, it } from 'vitest'
import sandboxSrc from './sandbox.ts?raw'
import sandboxTypesSrc from './sandboxTypes.ts?raw'
import sandboxViewSrc from './sandboxView.ts?raw'
import notationSrc from './notation.ts?raw'
import cardMetaSrc from './cardMeta.ts?raw'
import sampleWorksSrc from '../data/sampleWorks.ts?raw'
import {
  emptyStore,
  createWork,
  deleteWork,
  addCard,
  moveCard,
  updateCardLabel,
  removeCard,
  exportWorkJson,
  summarizeWork,
  cloneSample,
} from './sandbox'
import { CARD_KIND_ORDER } from './cardMeta'
import {
  clampCard,
  clampScale,
  fitViewport,
  viewCenterWorld,
  nextCardPosition,
  WORLD_W,
  WORLD_H,
  CARD_W,
  CARD_H,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_FIT_MIN,
} from './sandboxView'
import { detectTense } from './notation'
import { SAMPLE_WORKS } from '../data/sampleWorks'
import type { CardKind } from './types'

describe('sandbox 操作（純粋・新オブジェクトを返す）', () => {
  it('createWork でワークが追加され lastOpenedId が立つ', () => {
    const { store, id } = createWork(emptyStore(), '注文フロー', 'EC受注', 1000)
    expect(Object.keys(store.works)).toHaveLength(1)
    expect(store.works[id].title).toBe('注文フロー')
    expect(store.works[id].domainDescription).toBe('EC受注')
    expect(store.lastOpenedId).toBe(id)
    expect(store.works[id].cards).toEqual([])
  })

  it('空タイトルは「無題のワーク」になる', () => {
    const { store, id } = createWork(emptyStore(), '   ', '', 1)
    expect(store.works[id].title).toBe('無題のワーク')
  })

  it('addCard → moveCard → updateCardLabel → removeCard が更新時刻を進める', () => {
    let { store, id } = createWork(emptyStore(), 'w', '', 1000)
    store = addCard(store, id, 'event', '注文が確定した', 10, 20, 2000)
    const card = store.works[id].cards[0]
    expect(card.kind).toBe('event')
    expect(card.labelJa).toBe('注文が確定した')
    expect(store.works[id].updatedAt).toBe(2000)

    store = moveCard(store, id, card.id, 99, 88, 3000)
    expect(store.works[id].cards[0]).toMatchObject({ x: 99, y: 88 })
    expect(store.works[id].updatedAt).toBe(3000)

    store = updateCardLabel(store, id, card.id, '注文が受け付けられた', 4000)
    expect(store.works[id].cards[0].labelJa).toBe('注文が受け付けられた')

    store = removeCard(store, id, card.id, 5000)
    expect(store.works[id].cards).toHaveLength(0)
    expect(store.works[id].updatedAt).toBe(5000)
  })

  it('deleteWork で消え、lastOpenedId も外れる', () => {
    const created = createWork(emptyStore(), 'w', '', 1)
    const after = deleteWork(created.store, created.id)
    expect(after.works[created.id]).toBeUndefined()
    expect(after.lastOpenedId).toBeNull()
  })

  it('操作は元の store を破壊しない（不変）', () => {
    const base = emptyStore()
    createWork(base, 'w', '', 1)
    expect(Object.keys(base.works)).toHaveLength(0)
  })

  it('exportWorkJson は schema/version/work を含む', () => {
    const { store, id } = createWork(emptyStore(), 'w', 'd', 1)
    const json = JSON.parse(exportWorkJson(store.works[id]))
    expect(json.schema).toBe('stormquest.sandbox.work')
    expect(json.version).toBe(1)
    expect(json.work.id).toBe(id)
  })
})

describe('内訳サマリ summarizeWork（Editor と Hub の単一真実源）', () => {
  it('全7種を CARD_KIND_ORDER 順に0埋めで返す', () => {
    const { store, id } = createWork(emptyStore(), 'w', '', 1)
    const s = summarizeWork(store.works[id])
    expect(s.rows).toHaveLength(7)
    expect(s.rows.map((r) => r.kind)).toEqual([...CARD_KIND_ORDER])
    expect(s.rows.every((r) => r.count === 0)).toBe(true)
    expect(s.total).toBe(0)
  })

  it('total が cards.length と一致し、rows 総和とも一致する', () => {
    let { store, id } = createWork(emptyStore(), 'w', '', 1)
    store = addCard(store, id, 'event', 'A した', 0, 0, 2)
    store = addCard(store, id, 'event', 'B した', 0, 0, 3)
    store = addCard(store, id, 'command', 'C する', 0, 0, 4)
    const work = store.works[id]
    const s = summarizeWork(work)
    expect(s.total).toBe(work.cards.length)
    expect(s.rows.reduce((acc, r) => acc + r.count, 0)).toBe(s.total)
    expect(s.rows.find((r) => r.kind === 'event')?.count).toBe(2)
    expect(s.rows.find((r) => r.kind === 'command')?.count).toBe(1)
  })

  it('元のワークを破壊しない（純粋）', () => {
    const { store, id } = createWork(emptyStore(), 'w', '', 1)
    const before = store.works[id].cards.length
    summarizeWork(store.works[id])
    expect(store.works[id].cards.length).toBe(before)
  })
})

describe('CARD_KIND_ORDER', () => {
  it('7種・重複なし', () => {
    expect(CARD_KIND_ORDER).toHaveLength(7)
    expect(new Set(CARD_KIND_ORDER).size).toBe(7)
  })
})

describe('ビュー幾何 sandboxView（clamp / fit / 新規配置）', () => {
  it('clampCard は負値を0に、超過をワールド内端に丸める', () => {
    expect(clampCard(-50, -50)).toEqual({ x: 0, y: 0 })
    expect(clampCard(99999, 99999)).toEqual({
      x: WORLD_W - CARD_W,
      y: WORLD_H - CARD_H,
    })
    expect(clampCard(100, 200)).toEqual({ x: 100, y: 200 })
  })

  it('clampScale はズーム範囲に収める', () => {
    expect(clampScale(0.01)).toBe(ZOOM_MIN)
    expect(clampScale(99)).toBe(ZOOM_MAX)
    expect(clampScale(1)).toBe(1)
  })

  it('viewCenterWorld は scale を割り戻して往復一致する', () => {
    for (const scale of [ZOOM_MIN, 1, ZOOM_MAX]) {
      const vp = { panX: 120, panY: 80, scale }
      const c = viewCenterWorld(vp, 480, 600)
      // 逆算: ワールド座標 → スクリーン中心 に戻ると ビューポート中央になる
      const screenX = (c.x + CARD_W / 2) * scale + vp.panX
      const screenY = (c.y + CARD_H / 2) * scale + vp.panY
      expect(screenX).toBeCloseTo(240)
      expect(screenY).toBeCloseTo(300)
    }
  })

  it('fitViewport は空なら初期ビュー、ありなら全カードを収める scale を返す', () => {
    expect(fitViewport([], 480, 600).scale).toBe(1)
    // 横長の図は ZOOM_MIN を下回ってでも全体を収める（全体表示の目的）。
    const cards = [
      { x: 0, y: 0 },
      { x: 2000, y: 1500 },
    ]
    const vp = fitViewport(cards, 480, 600)
    expect(vp.scale).toBeGreaterThanOrEqual(ZOOM_FIT_MIN)
    expect(vp.scale).toBeLessThanOrEqual(ZOOM_MAX)
    // 全カードがビューポート内に収まる（fit の本質）
    const SCREEN = (wx: number) => wx * vp.scale + vp.panX
    expect(SCREEN(0)).toBeGreaterThanOrEqual(-1)
    expect(SCREEN(2000 + 132)).toBeLessThanOrEqual(480 + 1)
  })

  it('nextCardPosition は既存カードと重ならない座標を返す', () => {
    const origin = { x: 100, y: 100 }
    const existing = [{ x: 100, y: 100 }]
    const p = nextCardPosition(existing, origin)
    const overlaps =
      Math.abs(p.x - 100) < (CARD_W + 16) * 0.6 &&
      Math.abs(p.y - 100) < (CARD_H + 16) * 0.6
    expect(overlaps).toBe(false)
    // 空なら origin（clamp 後）
    expect(nextCardPosition([], origin)).toEqual(clampCard(100, 100))
  })
})

describe('cloneSample（お手本から自分のワークを作る）', () => {
  it('id と時刻を採番し直し、サンプル本体は不変', () => {
    const sample = SAMPLE_WORKS[0]
    const before = JSON.stringify(sample)
    const { store, id } = cloneSample(emptyStore(), sample, 9999)
    expect(id).not.toBe(sample.id)
    expect(store.works[id].cards).toHaveLength(sample.cards.length)
    expect(store.works[id].status).toBe('in-progress')
    expect(store.works[id].createdAt).toBe(9999)
    expect(store.works[id].cards[0].id).not.toBe(sample.cards[0].id)
    expect(store.lastOpenedId).toBe(id)
    expect(JSON.stringify(sample)).toBe(before) // サンプル不変
  })

  it('タイトルから【お手本】を外す', () => {
    const { store, id } = cloneSample(emptyStore(), SAMPLE_WORKS[0], 1)
    expect(store.works[id].title).not.toMatch(/お手本/)
  })
})

describe('お手本サンプルが EventStorming 記法として正しい', () => {
  for (const sample of SAMPLE_WORKS) {
    describe(sample.title, () => {
      const byKind = (k: CardKind) => sample.cards.filter((c) => c.kind === k)

      it('event は全て過去形', () => {
        for (const e of byKind('event')) {
          expect(detectTense(e.labelJa), e.labelJa).toBe('past')
        }
      })

      it('command は全て現在形', () => {
        for (const c of byKind('command')) {
          expect(detectTense(c.labelJa), c.labelJa).toBe('present')
        }
      })

      it('カード id に重複がない', () => {
        const ids = sample.cards.map((c) => c.id)
        expect(new Set(ids).size).toBe(ids.length)
      })

      it('全カードがワールド内に収まる（画面外に置かない）', () => {
        for (const c of sample.cards) {
          expect(clampCard(c.x, c.y), c.labelJa).toEqual({ x: c.x, y: c.y })
        }
      })

      it('外部システムを含むなら孤立させない（コマンドが存在する）', () => {
        if (byKind('externalSystem').length > 0) {
          expect(byKind('command').length).toBeGreaterThan(0)
        }
      })
    })
  }
})

describe('sandbox は採点系を import しない（別系統の機械的保証）', () => {
  const sources: [string, string][] = [
    ['sandbox.ts', sandboxSrc],
    ['sandboxTypes.ts', sandboxTypesSrc],
    ['sandboxView.ts', sandboxViewSrc],
    ['notation.ts', notationSrc],
    ['cardMeta.ts', cardMetaSrc],
    ['sampleWorks.ts', sampleWorksSrc],
  ]
  it.each(sources)('%s が engine.ts / progress.ts を import しない', (_file, src) => {
    expect(src).not.toMatch(/from '\.\/engine'/)
    expect(src).not.toMatch(/from '\.\/progress'/)
    expect(src).not.toMatch(/from '\.\.\/game\/engine'/)
    expect(src).not.toMatch(/from '\.\.\/game\/progress'/)
  })
})
