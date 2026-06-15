import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from 'react'
import type { Progress, Stars } from './game/types'
import { loadProgress, recordClear, saveProgress } from './game/progress'
import type { SandboxStore } from './game/sandboxTypes'
import { loadSandbox, saveSandbox } from './game/sandbox'
// recordClear は commitClear 経由でのみ使う

export type Screen =
  | 'onboarding'
  | 'home'
  | 'play'
  | 'result'
  | 'complete'
  | 'sandboxHub'
  | 'sandboxEditor'

export interface AppState {
  screen: Screen
  /** プレイ中ステージの index */
  stageIdx: number
  /** 直近クリアの星（リザルト表示用） */
  lastStars: Stars | null
  progress: Progress
  // ---- サンドボックス（個人ワーク）。採点系とは直交した別系統 ----
  sandbox: SandboxStore
  /** 編集中のワーク id */
  activeWorkId: string | null
}

type Action =
  | { type: 'goHome' }
  | { type: 'finishOnboarding' }
  | { type: 'startStage'; idx: number }
  | { type: 'clearStage'; stars: Stars; progress: Progress }
  | { type: 'nextStage' }
  | { type: 'goComplete' }
  | { type: 'goSandboxHub' }
  // sandbox は commitSandbox で永続化済みの store を受け取る（reducer は副作用なし）
  | { type: 'setSandbox'; sandbox: SandboxStore }
  | { type: 'openWork'; sandbox: SandboxStore; workId: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'goHome':
      return { ...state, screen: 'home', lastStars: null }
    case 'finishOnboarding':
      return { ...state, screen: 'home' }
    case 'startStage':
      return { ...state, screen: 'play', stageIdx: action.idx }
    case 'clearStage':
      // progress は commitClear で永続化済みのものを受け取る（reducer は副作用を持たない）
      return {
        ...state,
        screen: 'result',
        lastStars: action.stars,
        progress: action.progress,
      }
    case 'nextStage':
      return { ...state, screen: 'play', stageIdx: state.stageIdx + 1, lastStars: null }
    case 'goComplete':
      return { ...state, screen: 'complete', lastStars: null }
    case 'goSandboxHub':
      return { ...state, screen: 'sandboxHub' }
    case 'setSandbox':
      return { ...state, sandbox: action.sandbox }
    case 'openWork':
      return {
        ...state,
        sandbox: action.sandbox,
        activeWorkId: action.workId,
        screen: 'sandboxEditor',
      }
    default:
      return state
  }
}

const StoreContext = createContext<{
  state: AppState
  dispatch: Dispatch<Action>
} | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const progress = loadProgress()
  const [state, dispatch] = useReducer(reducer, {
    // 進捗があればオンボーディングをスキップ
    screen: Object.keys(progress.stars).length > 0 ? 'home' : 'onboarding',
    stageIdx: 0,
    lastStars: null,
    progress,
    sandbox: loadSandbox(),
    activeWorkId: null,
  })

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}

/** ステージクリアを記録して永続化する高水準ヘルパ */
export function commitClear(
  state: AppState,
  stageId: string,
  stars: Stars,
  vocabId: string,
): Progress {
  const next = recordClear(state.progress, stageId, stars, vocabId)
  saveProgress(next)
  return next
}

/** サンドボックスの新 store を永続化して返す高水準ヘルパ（reducer は副作用なし） */
export function commitSandbox(next: SandboxStore): SandboxStore {
  saveSandbox(next)
  return next
}
