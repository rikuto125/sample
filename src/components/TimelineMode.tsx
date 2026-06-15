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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import type { Card, TimelineStage } from '../game/types'
import { checkTimeline } from '../game/engine'
import { Sticky } from './Sticky'
import { SortableSticky } from './SortableSticky'
import { Icon } from './Icon'
import { shuffle } from '../game/shuffle'
import { soundEngine as sound } from '../game/sound'

interface Props {
  stage: TimelineStage
  onCorrect: (mistakes: number, usedHint: boolean) => void
  onMistake: (reason: string) => void
}

export function TimelineMode({ stage, onCorrect, onMistake }: Props) {
  // 手札（並べる前のプール）。イベント＋ダミーをシャッフル
  const initialHand = useMemo(
    () => shuffle([...stage.events, ...stage.distractors]),
    [stage],
  )
  const [hand, setHand] = useState<Card[]>(initialHand)
  const [placed, setPlaced] = useState<Card[]>([])
  const [justPlaced, setJustPlaced] = useState<string | null>(null)
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
      // ADR 0001: ダミーのタップは★を下げない（試行錯誤を罰しない）。
      // 弾きトーストで種別を教える学習FBのみ。mistakes には数えない。
      // 誤配置音は onMistake → handleMistake が鳴らす（二重発火させない）。
      onMistake(
        card.reason ??
          'それはイベントではありません。過去に起きた事実（〜した／された）だけを置けます。',
      )
      return
    }
    sound.play('snap')
    setHand((h) => h.filter((c) => c.id !== card.id))
    setPlaced((p) => [...p, card])
    setJustPlaced(card.id)
    window.setTimeout(() => setJustPlaced(null), 220)
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
        <div className="timeline-slots" aria-label="タイムライン（上が過去、下が未来）">
          <div className="time-axis-end top" aria-hidden>
            <Icon name="up" size={14} /> 過去（先に起きた事実）
          </div>
          <SortableContext
            items={placed.map((c) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className={`timeline-col ${placed.length > 0 ? 'filled' : ''}`}>
              {placed.length === 0 && (
                <div className="slot-empty">
                  <Icon name="target" size={22} />
                  上から順に、起きた順で並べよう
                </div>
              )}
              {placed.map((card, i) => (
                <button
                  key={card.id}
                  className="slot-wrap btn-reset"
                  onClick={() => removeToHand(card)}
                  aria-label={`${card.labelJa} を手札に戻す`}
                >
                  <SortableSticky
                    card={card}
                    slot={i}
                    justLanded={justPlaced === card.id}
                  />
                </button>
              ))}
            </div>
          </SortableContext>
          <div className="time-axis-end bottom" aria-hidden>
            <Icon name="down" size={14} /> 未来（あとに起きた事実）
          </div>
        </div>

        <div className="hand">
          <div className="hand-label">
            手札（タップで配置・付箋をドラッグで並べ替え）
          </div>
          <div className="hand-cards">
            {hand.map((card) => (
              <button
                key={card.id}
                className="btn-reset"
                onClick={() => placeFromHand(card)}
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
            className="btn-ghost btn-hint"
            onClick={() => {
              setShowHint(true)
              setUsedHint(true)
            }}
          >
            <Icon name="hint" size={18} /> ヒント（星評価が下がります）
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
            この並びで確定 <Icon name="next" size={18} />
          </button>
        </div>
      </div>
    </DndContext>
  )
}
