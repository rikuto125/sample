import { useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Card, TimelineStage } from '../game/types'
import { checkTimeline } from '../game/engine'
import { Sticky } from './Sticky'
import { shuffle } from '../game/shuffle'

interface Props {
  stage: TimelineStage
  onCorrect: (mistakes: number, usedHint: boolean) => void
  onMistake: (reason: string) => void
}

function SortableSticky({ card, slot }: { card: Card; slot: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      {...attributes}
      {...listeners}
    >
      <div className="slot-index" aria-hidden>
        {slot + 1}
      </div>
      <Sticky card={card} dragging={isDragging} inHand />
    </div>
  )
}

export function TimelineMode({ stage, onCorrect, onMistake }: Props) {
  // 手札（並べる前のプール）。イベント＋ダミーをシャッフル
  const initialHand = useMemo(
    () => shuffle([...stage.events, ...stage.distractors]),
    [stage],
  )
  const [hand, setHand] = useState<Card[]>(initialHand)
  const [placed, setPlaced] = useState<Card[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function placeFromHand(card: Card) {
    if (card.isDistractor) {
      setMistakes((m) => m + 1)
      onMistake(
        card.reason ??
          'それはイベントではありません。過去に起きた事実（〜した／された）だけを置けます。',
      )
      return
    }
    setHand((h) => h.filter((c) => c.id !== card.id))
    setPlaced((p) => [...p, card])
  }

  function removeToHand(card: Card) {
    setPlaced((p) => p.filter((c) => c.id !== card.id))
    setHand((h) => [...h, card])
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over || active.id === over.id) return
    setPlaced((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id)
      const newIndex = items.findIndex((c) => c.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  function check() {
    const result = checkTimeline(stage, { placed: placed.map((c) => c.id) })
    if (result.correct) {
      onCorrect(mistakes, usedHint)
    } else {
      setMistakes((m) => m + 1)
      if (!result.completeSet) {
        onMistake('まだ全部のイベントが置かれていないか、余分なカードがあります。')
      } else {
        onMistake('順序が違います。「どちらが先に起きた事実か」を考えてみよう。')
      }
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="timeline-board">
        <div className="timeline-slots" aria-label="タイムライン（左が過去、右が未来）">
          <span className="axis-label past">← 過去</span>
          <SortableContext
            items={placed.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="slots-row">
              {placed.length === 0 && (
                <div className="slot-empty">ここに時系列で並べよう</div>
              )}
              {placed.map((card, i) => (
                <button
                  key={card.id}
                  className="slot-wrap"
                  onClick={() => removeToHand(card)}
                  aria-label={`${card.labelJa} を手札に戻す`}
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  <SortableSticky card={card} slot={i} />
                </button>
              ))}
            </div>
          </SortableContext>
          <span className="axis-label future">未来 →</span>
        </div>

        <div className="hand">
          <div className="hand-label">
            手札（タップで配置・付箋をドラッグで並べ替え）
          </div>
          <div className="hand-cards">
            {hand.map((card) => (
              <button
                key={card.id}
                onClick={() => placeFromHand(card)}
                style={{ background: 'none', border: 'none', padding: 0 }}
                aria-label={`${card.labelJa} を配置`}
              >
                <Sticky card={card} inHand />
              </button>
            ))}
            {hand.length === 0 && (
              <span className="hand-empty">すべて配置しました。順序を確認！</span>
            )}
          </div>
        </div>

        <div className="play-actions">
          <button
            className="btn-ghost"
            onClick={() => {
              setShowHint(true)
              setUsedHint(true)
            }}
          >
            💡 ヒント（星評価が下がります）
          </button>
          {showHint && (
            <p className="hint-text">
              一番最初に起きた「事実」はどれ？ 原因→結果の順に並べると、
              自然と時系列になります。
            </p>
          )}
          <button
            className="btn-primary"
            disabled={placed.length === 0}
            onClick={check}
          >
            この並びで確定 ▶
          </button>
        </div>
      </div>
    </DndContext>
  )
}
