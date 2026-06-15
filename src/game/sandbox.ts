import type { CardKind } from './types'
import type {
  SandboxCard,
  SandboxStore,
  SandboxWork,
} from './sandboxTypes'

// サンドボックスの永続化＋純粋操作。学習ゲームの engine.ts / progress.ts には
// 一切依存しない（採点と無関係の別系統）。この非依存は sandbox.test.ts の
// import 境界テストで機械的に保証する。
//
// 重要: ユーザーの成果物（SandboxWork）は再生成不能。星（progress）と違い
// 「version 不一致なら全消し」はしない。未知 version でも works は読めるだけ保持する。

const KEY = 'stormquest.sandbox'
const VERSION = 1

export function emptyStore(): SandboxStore {
  return { version: VERSION, works: {}, lastOpenedId: null }
}

let seq = 0
function uid(prefix: string): string {
  // テスト容易性のため時刻＋連番。衝突回避用で暗号強度は不要。
  seq += 1
  return `${prefix}-${seq.toString(36)}-${Math.floor(performance.now())}`
}

/**
 * localStorage から読み込む。JSON 破損時のみ空に握りつぶす。
 * version 不一致でも works が配列/オブジェクトとして読めれば保持する
 * （成果物を不用意に消さない）。
 */
export function loadSandbox(): SandboxStore {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyStore()
    const parsed = JSON.parse(raw) as Partial<SandboxWork> & Partial<SandboxStore>
    const works = (parsed as Partial<SandboxStore>).works
    if (!works || typeof works !== 'object') return emptyStore()
    return {
      version: VERSION,
      works: works as Record<string, SandboxWork>,
      lastOpenedId:
        typeof (parsed as Partial<SandboxStore>).lastOpenedId === 'string'
          ? (parsed as SandboxStore).lastOpenedId
          : null,
    }
  } catch {
    // JSON 自体が壊れている場合のみ空に。正常データは上で保持済み。
    return emptyStore()
  }
}

export function saveSandbox(store: SandboxStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store))
  } catch {
    // ストレージ不可でも操作は続行可能にする
  }
}

// ---- 純粋操作（常に新しいオブジェクトを返す。reducer から呼ぶ） ----

export function createWork(
  store: SandboxStore,
  title: string,
  domainDescription: string,
  now: number,
): { store: SandboxStore; id: string } {
  const id = uid('work')
  const work: SandboxWork = {
    id,
    title: title.trim() || '無題のワーク',
    domainDescription: domainDescription.trim(),
    status: 'in-progress',
    createdAt: now,
    updatedAt: now,
    cards: [],
  }
  return {
    store: { ...store, works: { ...store.works, [id]: work }, lastOpenedId: id },
    id,
  }
}

export function deleteWork(store: SandboxStore, id: string): SandboxStore {
  const works = { ...store.works }
  delete works[id]
  return {
    ...store,
    works,
    lastOpenedId: store.lastOpenedId === id ? null : store.lastOpenedId,
  }
}

function touch(work: SandboxWork, now: number): SandboxWork {
  return { ...work, updatedAt: now }
}

function mapWork(
  store: SandboxStore,
  id: string,
  fn: (w: SandboxWork) => SandboxWork,
): SandboxStore {
  const w = store.works[id]
  if (!w) return store
  return { ...store, works: { ...store.works, [id]: fn(w) } }
}

export function addCard(
  store: SandboxStore,
  workId: string,
  kind: CardKind,
  labelJa: string,
  x: number,
  y: number,
  now: number,
): SandboxStore {
  const card: SandboxCard = { id: uid('sc'), kind, labelJa: labelJa.trim(), x, y }
  return mapWork(store, workId, (w) =>
    touch({ ...w, cards: [...w.cards, card] }, now),
  )
}

export function moveCard(
  store: SandboxStore,
  workId: string,
  cardId: string,
  x: number,
  y: number,
  now: number,
): SandboxStore {
  return mapWork(store, workId, (w) =>
    touch(
      { ...w, cards: w.cards.map((c) => (c.id === cardId ? { ...c, x, y } : c)) },
      now,
    ),
  )
}

export function updateCardLabel(
  store: SandboxStore,
  workId: string,
  cardId: string,
  labelJa: string,
  now: number,
): SandboxStore {
  return mapWork(store, workId, (w) =>
    touch(
      {
        ...w,
        cards: w.cards.map((c) =>
          c.id === cardId ? { ...c, labelJa: labelJa.trim() } : c,
        ),
      },
      now,
    ),
  )
}

export function removeCard(
  store: SandboxStore,
  workId: string,
  cardId: string,
  now: number,
): SandboxStore {
  return mapWork(store, workId, (w) =>
    touch({ ...w, cards: w.cards.filter((c) => c.id !== cardId) }, now),
  )
}

/** JSON 書き出し用のシリアライズ（新規 npm 依存ゼロ）。 */
export function exportWorkJson(work: SandboxWork): string {
  return JSON.stringify(
    { schema: 'stormquest.sandbox.work', version: VERSION, work },
    null,
    2,
  )
}
