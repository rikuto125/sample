import { useStore, commitSandbox } from '../store'
import { addCard, moveCard, removeCard, exportWorkJson } from '../game/sandbox'
import type { CardKind } from '../game/types'
import { CARD_META } from '../game/cardMeta'
import { SandboxPalette } from './SandboxPalette'
import { SandboxCanvas } from './SandboxCanvas'
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

  if (!work) {
    return (
      <div className="screen sandbox-editor">
        <button className="back" onClick={() => dispatch({ type: 'goSandboxHub' })}>
          <Icon name="back" size={16} /> 一覧へ
        </button>
        <p>ワークが見つかりません。</p>
      </div>
    )
  }

  const workId = work.id

  function handleAdd(kind: CardKind, labelJa: string) {
    // 新しい付箋はキャンバス左上付近に少しずつずらして置く
    const n = work!.cards.length
    const x = 24 + (n % 5) * 28
    const y = 24 + (n % 5) * 24
    dispatch({
      type: 'setSandbox',
      sandbox: commitSandbox(
        addCard(state.sandbox, workId, kind, labelJa, x, y, Date.now()),
      ),
    })
  }

  function handleMove(cardId: string, x: number, y: number) {
    dispatch({
      type: 'setSandbox',
      sandbox: commitSandbox(moveCard(state.sandbox, workId, cardId, x, y, Date.now())),
    })
  }

  function handleRemove(cardId: string) {
    dispatch({
      type: 'setSandbox',
      sandbox: commitSandbox(removeCard(state.sandbox, workId, cardId, Date.now())),
    })
  }

  function handleExport() {
    downloadJson(`stormquest-work-${slug(work!.title)}.json`, exportWorkJson(work!))
  }

  // 種別ごとの枚数サマリ（CARD_META 由来の色で）
  const counts = work.cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.kind] = (acc[c.kind] ?? 0) + 1
    return acc
  }, {})

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
          cards={work.cards}
          onMove={handleMove}
          onRemove={handleRemove}
        />
        <aside className="sandbox-summary" aria-label="付箋の内訳">
          <h3>内訳</h3>
          <ul>
            {(Object.keys(counts) as CardKind[]).map((k) => (
              <li key={k} style={{ color: CARD_META[k].ink }}>
                <Icon name={CARD_META[k].icon} size={14} /> {CARD_META[k].labelJa}：
                {counts[k]}
              </li>
            ))}
            {work.cards.length === 0 && <li>まだ付箋がありません</li>}
          </ul>
        </aside>
      </div>
    </div>
  )
}
