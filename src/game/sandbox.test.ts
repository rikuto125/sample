import { describe, expect, it } from 'vitest'
import sandboxSrc from './sandbox.ts?raw'
import sandboxTypesSrc from './sandboxTypes.ts?raw'
import notationSrc from './notation.ts?raw'
import {
  emptyStore,
  createWork,
  deleteWork,
  addCard,
  moveCard,
  updateCardLabel,
  removeCard,
  exportWorkJson,
} from './sandbox'

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

describe('sandbox は採点系を import しない（別系統の機械的保証）', () => {
  const sources: [string, string][] = [
    ['sandbox.ts', sandboxSrc],
    ['sandboxTypes.ts', sandboxTypesSrc],
    ['notation.ts', notationSrc],
  ]
  it.each(sources)('%s が engine.ts / progress.ts を import しない', (_file, src) => {
    expect(src).not.toMatch(/from '\.\/engine'/)
    expect(src).not.toMatch(/from '\.\/progress'/)
  })
})
