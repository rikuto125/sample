import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card } from '../game/types'
import { Sticky } from './Sticky'

interface SortableStickyProps {
  card: Card
  slot: number
  justLanded: boolean
}

/**
 * タイムラインの並べ替え1アイテム（dnd-kit sortable）。
 * SortableContext 内でのみ使う（dnd-kit の不変条件）。
 */
export function SortableSticky({ card, slot, justLanded }: SortableStickyProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })
  // 掴む juice（§4.2 scale1.08/rotate-4deg）。dnd-kit の translate に scale/rotate を合成。
  const base = CSS.Transform.toString(transform) ?? ''
  return (
    <div
      ref={setNodeRef}
      className={`tl-item ${justLanded ? 'snap-land' : ''}`}
      style={{
        transform: isDragging ? `${base} scale(1.04)` : base,
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <span className="tl-num" aria-hidden>
        {slot + 1}
      </span>
      <Sticky card={card} dragging={isDragging} inHand className="tl-sticky" />
    </div>
  )
}
