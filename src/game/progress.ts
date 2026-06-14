import type { Progress, Stars } from './types'

const KEY = 'stormquest.progress'
const VERSION = 1

const empty = (): Progress => ({
  version: VERSION,
  stars: {},
  unlockedVocab: [],
})

/** localStorage から読み込む。壊れていたら握りつぶしてリセット */
export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return empty()
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (parsed.version !== VERSION || typeof parsed.stars !== 'object') {
      return empty()
    }
    return {
      version: VERSION,
      stars: parsed.stars ?? {},
      unlockedVocab: Array.isArray(parsed.unlockedVocab)
        ? parsed.unlockedVocab
        : [],
    }
  } catch {
    return empty()
  }
}

export function saveProgress(p: Progress): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(p))
  } catch {
    // ストレージ不可（プライベートモード等）でもゲームは続行可能にする
  }
}

export function resetProgress(): void {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* noop */
  }
}

/** ステージクリアを記録。既存より良い星なら更新。語彙も解放 */
export function recordClear(
  prev: Progress,
  stageId: string,
  stars: Stars,
  vocabId: string,
): Progress {
  const best = Math.max(prev.stars[stageId] ?? 0, stars) as Stars
  const unlocked = prev.unlockedVocab.includes(vocabId)
    ? prev.unlockedVocab
    : [...prev.unlockedVocab, vocabId]
  return {
    ...prev,
    stars: { ...prev.stars, [stageId]: best },
    unlockedVocab: unlocked,
  }
}

export function totalStars(p: Progress): number {
  return Object.values(p.stars).reduce((a, b) => a + b, 0)
}

export function clearedCount(p: Progress): number {
  return Object.keys(p.stars).length
}
