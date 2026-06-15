import { CARD_META } from '../game/cardMeta'
import type { Card, CardKind } from '../game/types'

interface StickyProps {
  card: Card
  /** 種別メタ（色＋アイコン＋ラベル）を表示するか */
  showMeta?: boolean
  small?: boolean
  dragging?: boolean
  inHand?: boolean
  className?: string
  style?: React.CSSProperties
  /** i ボタンで種別の定義を引けるようにする（ドラッグしない局面でのみ渡す） */
  onInfo?: (kind: CardKind) => void
  /** onInfo があっても、この値が false の間は i を出さない（ドラッグ中など） */
  showInfo?: boolean
}

/**
 * EventStorming 付箋。色＋アイコン＋ラベルの三重で種別を表現する（色覚多様性対応）。
 * 色は CARD_META[kind] から取り、コンポーネントに直書きしない。
 */
export function Sticky({
  card,
  showMeta = true,
  small,
  dragging,
  inHand,
  className = '',
  style,
  onInfo,
  showInfo = false,
}: StickyProps) {
  const meta = CARD_META[card.kind]
  const withInfo = showMeta && showInfo && onInfo != null
  return (
    <div
      className={`sticky ${small ? 'small' : ''} ${dragging ? 'dragging' : ''} ${inHand ? 'in-hand' : ''} ${className}`}
      style={{ background: meta.color, color: meta.ink, ...style }}
      role="group"
      aria-label={`${meta.labelJa}: ${card.labelJa}`}
    >
      {showMeta && (
        <span className="meta" style={{ color: meta.ink }}>
          <span className="icon" aria-hidden>
            {meta.icon}
          </span>
          {meta.labelJa}
          {withInfo && (
            <button
              type="button"
              className="sticky-info"
              style={{ color: meta.ink }}
              // dnd-kit のドラッグ sensor へ伝播させない（i タップ≠ドラッグ開始）
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onInfo(card.kind)
              }}
              aria-label={`${meta.labelJa}の意味`}
            >
              ⓘ
            </button>
          )}
        </span>
      )}
      <span className="text">{card.labelJa}</span>
      {card.labelEn && (
        <span
          style={{
            display: 'block',
            fontSize: '0.72em',
            opacity: 0.7,
            fontWeight: 600,
          }}
        >
          {card.labelEn}
        </span>
      )}
    </div>
  )
}
