import { useCallback, useMemo, useRef } from 'react'
import { useStore, commitSandbox } from '../store'
import {
  addCard,
  moveCard,
  removeCard,
  updateCardLabel,
  exportWorkJson,
  summarizeWork,
} from '../game/sandbox'
import { nextCardPosition } from '../game/sandboxView'
import type { CardKind } from '../game/types'
import type { SandboxStore } from '../game/sandboxTypes'
import { CARD_META } from '../game/cardMeta'
import { SandboxPalette } from './SandboxPalette'
import { SandboxCanvas, type SandboxCanvasHandle } from './SandboxCanvas'
import { Icon } from './Icon'

/** ファイル名用に簡易スラッグ化（日本語はそのまま、空白/記号をハイフンに）。 */
function slug(s: string): string {
  return s.trim().replace(/[\s/\\:*?"<>|]+/g, '-').slice(0, 40) || 'work'
}

function downloadJson(filename: string, json: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** 1つのワークを編集する画面。パレットで足し、キャンバスで配置し、JSON で持ち出す。 */
export function SandboxEditorScreen() {
  const { state, dispatch } = useStore()
  const work = state.activeWorkId
    ? state.sandbox.works[state.activeWorkId]
    : null

  // 最新 sandbox を ref で持ち、安定 callback から stale closure なく読む。
  const sandboxRef = useRef<SandboxStore>(state.sandbox)
  sandboxRef.current = state.sandbox
  const canvasRef = useRef<SandboxCanvasHandle>(null)
  const workId = work?.id ?? null

  const apply = useCallback(
    (next: SandboxStore) => {
      dispatch({ type: 'setSandbox', sandbox: commitSandbox(next) })
    },
    [dispatch],
  )

  const handleAdd = useCallback(
    (kind: CardKind, labelJa: string) => {
      if (!workId) return
      const store = sandboxRef.current
      const current = store.works[workId]
      if (!current) return
      // ビュー中心を起点に、既存カードと重ならない空きセルへ置く（必ず画面内）。
      const origin = canvasRef.current?.viewCenter() ?? { x: 60, y: 60 }
      const { x, y } = nextCardPosition(current.cards, origin)
      apply(addCard(store, workId, kind, labelJa, x, y, Date.now()))
    },
    [workId, apply],
  )

  const handleMove = useCallback(
    (cardId: string, x: number, y: number) => {
      if (!workId) return
      apply(moveCard(sandboxRef.current, workId, cardId, x, y, Date.now()))
    },
    [workId, apply],
  )

  const handleRemove = useCallback(
    (cardId: string) => {
      if (!workId) return
      apply(removeCard(sandboxRef.current, workId, cardId, Date.now()))
    },
    [workId, apply],
  )

  const handleRelabel = useCallback(
    (cardId: string, labelJa: string) => {
      if (!workId) return
      apply(updateCardLabel(sandboxRef.current, workId, cardId, labelJa, Date.now()))
    },
    [workId, apply],
  )

  // 派生 state は render 中に計算（useEffect で持たない）。
  const summary = useMemo(() => (work ? summarizeWork(work) : null), [work])

  if (!work || !summary) {
    return (
      <div className="screen sandbox-editor">
        <button className="back" onClick={() => dispatch({ type: 'goSandboxHub' })}>
          <Icon name="back" size={16} /> 一覧へ
        </button>
        <p>ワークが見つかりません。</p>
      </div>
    )
  }

  function handleExport() {
    downloadJson(`stormquest-work-${slug(work!.title)}.json`, exportWorkJson(work!))
  }

  return (
    <div className="screen sandbox-editor">
      <div className="sandbox-editor-head">
        <button className="back" onClick={() => dispatch({ type: 'goSandboxHub' })}>
          <Icon name="back" size={16} /> 一覧へ
        </button>
        <h2 className="sandbox-editor-title">{work.title}</h2>
        <button className="btn-ghost sandbox-export" onClick={handleExport}>
          <Icon name="download" size={16} /> JSON で書き出す
        </button>
      </div>

      <div className="sandbox-editor-body">
        <SandboxPalette onAdd={handleAdd} />
        <SandboxCanvas
          ref={canvasRef}
          cards={work.cards}
          onMove={handleMove}
          onRemove={handleRemove}
          onRelabel={handleRelabel}
        />
        <aside className="sandbox-summary" aria-label="付箋の内訳">
          <h3>内訳</h3>
          <ul>
            {summary.rows.map((row) => (
              <li
                key={row.kind}
                className={`sandbox-summary-row ${row.count === 0 ? 'is-empty' : ''}`}
                style={{ color: CARD_META[row.kind].ink }}
              >
                <Icon name={CARD_META[row.kind].icon} size={14} />{' '}
                {CARD_META[row.kind].labelJa}
                <span className="sandbox-summary-count">{row.count}</span>
              </li>
            ))}
          </ul>
          <p className="sandbox-summary-total">合計 {summary.total} 枚</p>
        </aside>
      </div>
    </div>
  )
}
