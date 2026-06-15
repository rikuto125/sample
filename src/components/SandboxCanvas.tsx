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
import { Sticky } from './Sticky'

interface SandboxCanvasProps {
  cards: SandboxCard[]
  onMove: (cardId: string, x: number, y: number) => void
  onRemove: (cardId: string) => void
}

function DraggableCard({
  card,
  onRemove,
}: {
  card: SandboxCard
  onRemove: (id: string) => void
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id })
  const style: React.CSSProperties = {
    position: 'absolute',
    left: card.x,
    top: card.y,
    transform: transform
      ? `translate(${transform.x}px, ${transform.y}px)`
      : undefined,
    opacity: isDragging ? 0.7 : 1,
    zIndex: isDragging ? 10 : 1,
    touchAction: 'none',
  }
  // Sticky は CARD_META[kind] から色/アイコン/ラベルを導出（記法を歪めない）。
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Sticky card={card} inHand small />
      <button
        className="sandbox-card-del btn-reset"
        // ドラッグ開始と競合させない
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          onRemove(card.id)
        }}
        aria-label={`${card.labelJa} を削除`}
      >
        ×
      </button>
    </div>
  )
}

/**
 * 2D 自由配置キャンバス（学習ゲームの並べ替えとは別の DndContext）。
 * SortableContext は使わず、useDraggable で絶対座標を動かす。
 */
export function SandboxCanvas({ cards, onMove, onRemove }: SandboxCanvasProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  )

  function handleDragEnd(e: DragEndEvent) {
    const card = cards.find((c) => c.id === e.active.id)
    if (!card) return
    onMove(card.id, card.x + e.delta.x, card.y + e.delta.y)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="sandbox-canvas" aria-label="EventStorming キャンバス">
        {cards.length === 0 && (
          <p className="sandbox-canvas-empty">
            左のパレットから付箋を足して、ドラッグで並べよう
          </p>
        )}
        {cards.map((card) => (
          <DraggableCard key={card.id} card={card} onRemove={onRemove} />
        ))}
      </div>
    </DndContext>
  )
}
