import { CARD_META } from '../game/cardMeta'
import type { Card } from '../game/types'

interface StickyProps {
  card: Card
  /** 種別メタ（色＋アイコン＋ラベル）を表示するか */
  showMeta?: boolean
  small?: boolean
  dragging?: boolean
  inHand?: boolean
  className?: string
  style?: React.CSSProperties
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
}: StickyProps) {
  const meta = CARD_META[card.kind]
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
