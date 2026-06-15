import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core'
import type { SandboxCard } from '../game/sandboxTypes'
import {
  clampCard,
  clampScale,
  fitViewport,
  initialViewport,
  viewCenterWorld,
  WORLD_W,
  WORLD_H,
  type Viewport,
} from '../game/sandboxView'
import { Sticky } from './Sticky'
import { Icon } from './Icon'

interface SandboxCanvasProps {
  cards: SandboxCard[]
  onMove: (cardId: string, x: number, y: number) => void
  onRemove: (cardId: string) => void
  onRelabel: (cardId: string, labelJa: string) => void
  /** お手本プレビュー: 編集不可・ドラッグ不可・初期 fit 表示 */
  readOnly?: boolean
}

/** Editor から「新規カードの起点（ビュー中心のワールド座標）」を取るための命令的ハンドル。 */
export interface SandboxCanvasHandle {
  viewCenter: () => { x: number; y: number }
}

const CardView = memo(
  function CardView({
    card,
    scale,
    selected,
    editing,
    editDraft,
    readOnly,
    onSelect,
    onRemove,
    onEditStart,
    onEditChange,
    onEditCommit,
    onEditCancel,
  }: {
    card: SandboxCard
    scale: number
    selected: boolean
    editing: boolean
    editDraft: string
    readOnly: boolean
    onSelect: (id: string) => void
    onRemove: (id: string) => void
    onEditStart: (id: string) => void
    onEditChange: (value: string) => void
    onEditCommit: () => void
    onEditCancel: () => void
  }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({ id: card.id, disabled: readOnly || editing })
    const style: React.CSSProperties = {
      position: 'absolute',
      left: card.x,
      top: card.y,
      // ドラッグ中のみ transform を当てる（確定後に「新 left/top + 旧 transform」の
      // 1フレーム窓を作らない＝移動直後にカードが飛ぶのを予防）。
      // delta はスクリーン px なので world の scale で割り戻す。
      transform:
        isDragging && transform
          ? `translate(${transform.x / scale}px, ${transform.y / scale}px)`
          : undefined,
      opacity: isDragging ? 0.7 : 1,
      zIndex: isDragging ? 10 : selected ? 5 : 1,
      touchAction: 'none',
    }
    const dragProps = readOnly || editing ? {} : { ...attributes, ...listeners }
    return (
      <div
        ref={setNodeRef}
        data-card
        className={`sandbox-card ${selected ? 'selected' : ''}`}
        style={style}
        {...dragProps}
        onClick={() => !readOnly && onSelect(card.id)}
      >
        <Sticky
          card={card}
          inHand
          small
          editing={editing}
          editDraft={editDraft}
          onEditChange={onEditChange}
          onEditCommit={onEditCommit}
          onEditCancel={onEditCancel}
          onEditStart={readOnly ? undefined : () => onEditStart(card.id)}
        />
        {!readOnly && selected && !editing && (
          <button
            className="sandbox-card-del btn-reset"
            // 削除ボタンでドラッグを開始させない
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              onRemove(card.id)
            }}
            aria-label={`${card.labelJa} を削除`}
          >
            ×
          </button>
        )}
      </div>
    )
  },
  (a, b) =>
    a.card.x === b.card.x &&
    a.card.y === b.card.y &&
    a.card.labelJa === b.card.labelJa &&
    a.card.kind === b.card.kind &&
    a.scale === b.scale &&
    a.selected === b.selected &&
    a.editing === b.editing &&
    a.editDraft === b.editDraft &&
    a.readOnly === b.readOnly,
)

/**
 * 2D 自由配置キャンバス（学習ゲームの並べ替えとは別の DndContext）。
 * 固定ワールド（WORLD_W×WORLD_H）を viewport の中で pan / zoom する。
 * ドラッグ中の transient 座標は dnd-kit の transform に委ね、確定時のみ 1 回 commit する。
 */
export const SandboxCanvas = forwardRef<SandboxCanvasHandle, SandboxCanvasProps>(
  function SandboxCanvas(
    { cards, onMove, onRemove, onRelabel, readOnly = false },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement | null>(null)
    const [vp, setVp] = useState<Viewport>(initialViewport)
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [editing, setEditing] = useState<{ id: string; draft: string } | null>(
      null,
    )
    // 最新 vp を同期 ref で持つ（onDragEnd / 命令的ハンドルで stale を避ける）。
    const vpRef = useRef(vp)
    vpRef.current = vp

    // お手本プレビューは要素実寸が確定してから一度だけ全体表示にする。
    // setState は ref callback（render 中）でなく layout effect で行う（render 中 setState を避ける）。
    const didFit = useRef(false)
    useLayoutEffect(() => {
      if (!readOnly || didFit.current) return
      const node = viewportRef.current
      if (!node) return
      const apply = () => {
        const r = node.getBoundingClientRect()
        if (r.width > 0 && r.height > 0) {
          didFit.current = true
          setVp(fitViewport(cards, r.width, r.height))
          return true
        }
        return false
      }
      if (apply()) return
      // 初回 0 実寸（折りたたみ直後など）に備え、実寸確定を一度だけ待つ。
      const ro = new ResizeObserver(() => {
        if (apply()) ro.disconnect()
      })
      ro.observe(node)
      return () => ro.disconnect()
    }, [readOnly, cards])

    useImperativeHandle(
      ref,
      () => ({
        viewCenter: () => {
          const r = viewportRef.current?.getBoundingClientRect()
          const w = r?.width ?? 480
          const h = r?.height ?? 480
          return viewCenterWorld(vpRef.current, w, h)
        },
      }),
      [],
    )

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(TouchSensor, {
        activationConstraint: { delay: 120, tolerance: 8 },
      }),
    )

    const handleDragEnd = useCallback(
      (e: DragEndEvent) => {
        setSelectedId(e.active.id as string)
        const card = cards.find((c) => c.id === e.active.id)
        if (!card) return
        const s = vpRef.current.scale
        const next = clampCard(card.x + e.delta.x / s, card.y + e.delta.y / s)
        if (next.x === card.x && next.y === card.y) return
        onMove(card.id, next.x, next.y)
      },
      [cards, onMove],
    )

    // 背景パン（カード上の pointerdown は dnd-kit に渡す。data-card で排他）。
    const handleBgPointerDown = useCallback(
      (e: ReactPointerEvent<HTMLDivElement>) => {
        if (readOnly) return
        const target = e.target as HTMLElement
        if (target.closest('[data-card]')) return
        setSelectedId(null)
        const startX = e.clientX
        const startY = e.clientY
        const base = vpRef.current
        const move = (ev: globalThis.PointerEvent) => {
          setVp({
            ...base,
            panX: base.panX + (ev.clientX - startX),
            panY: base.panY + (ev.clientY - startY),
          })
        }
        const up = () => {
          window.removeEventListener('pointermove', move)
          window.removeEventListener('pointerup', up)
        }
        window.addEventListener('pointermove', move)
        window.addEventListener('pointerup', up)
      },
      [readOnly],
    )

    const zoomBy = useCallback((factor: number) => {
      const v = vpRef.current
      setVp({ ...v, scale: clampScale(v.scale * factor) })
    }, [])

    const fit = useCallback(() => {
      const r = viewportRef.current?.getBoundingClientRect()
      if (!r || r.width === 0) return
      setVp(fitViewport(cards, r.width, r.height))
    }, [cards])

    const resetZoom = useCallback(() => setVp(initialViewport), [])

    // ---- カードへ渡す安定 callback（memo を実効化する） ----
    const handleSelect = useCallback((id: string) => setSelectedId(id), [])
    const handleEditStart = useCallback(
      (id: string) => {
        const c = cards.find((x) => x.id === id)
        setEditing({ id, draft: c?.labelJa ?? '' })
      },
      [cards],
    )
    const handleEditChange = useCallback(
      (value: string) => setEditing((e) => (e ? { ...e, draft: value } : e)),
      [],
    )
    const handleEditCommit = useCallback(() => {
      setEditing((e) => {
        if (e) onRelabel(e.id, e.draft)
        return null
      })
    }, [onRelabel])
    const handleEditCancel = useCallback(() => setEditing(null), [])

    return (
      <div className="sandbox-canvas-wrap">
        {!readOnly && (
          <div className="sandbox-toolbar" role="group" aria-label="表示操作">
            <button className="btn-ghost btn-sm" onClick={fit} aria-label="全体表示">
              <Icon name="target" size={14} /> 全体表示
            </button>
            <button
              className="btn-ghost btn-sm"
              onClick={() => zoomBy(0.8)}
              aria-label="縮小"
            >
              −
            </button>
            <span className="sandbox-zoom-label">{Math.round(vp.scale * 100)}%</span>
            <button
              className="btn-ghost btn-sm"
              onClick={() => zoomBy(1.25)}
              aria-label="拡大"
            >
              ＋
            </button>
            <button
              className="btn-ghost btn-sm"
              onClick={resetZoom}
              aria-label="標準サイズ"
            >
              100%
            </button>
          </div>
        )}
        <div
          ref={viewportRef}
          className={`sandbox-viewport ${readOnly ? 'is-readonly' : ''}`}
          aria-label="EventStorming キャンバス"
          onPointerDown={handleBgPointerDown}
        >
          <DndContext
            sensors={readOnly ? [] : sensors}
            onDragEnd={readOnly ? undefined : handleDragEnd}
          >
            <div
              className="sandbox-world"
              style={{
                width: WORLD_W,
                height: WORLD_H,
                transform: `translate(${vp.panX}px, ${vp.panY}px) scale(${vp.scale})`,
                transformOrigin: '0 0',
              }}
            >
              {cards.map((card) => (
                <CardView
                  key={card.id}
                  card={card}
                  scale={vp.scale}
                  selected={selectedId === card.id}
                  editing={editing?.id === card.id}
                  editDraft={editing?.id === card.id ? editing.draft : ''}
                  readOnly={readOnly}
                  onSelect={handleSelect}
                  onRemove={onRemove}
                  onEditStart={handleEditStart}
                  onEditChange={handleEditChange}
                  onEditCommit={handleEditCommit}
                  onEditCancel={handleEditCancel}
                />
              ))}
            </div>
          </DndContext>
          {cards.length === 0 && (
            <p className="sandbox-canvas-empty">
              左のパレットから付箋を足して、ドラッグで並べよう
            </p>
          )}
        </div>
      </div>
    )
  },
)
