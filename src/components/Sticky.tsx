import { CARD_META } from '../game/cardMeta'
import { Icon } from './Icon'
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
  // ---- ラベル編集（個人ワークのキャンバスでのみ使う。controlled） ----
  /** 編集モード。true のとき本文ラベルが入力欄に化ける */
  editing?: boolean
  /** 編集中の下書き値（controlled。親が state で保持） */
  editDraft?: string
  /** 入力のたびに呼ぶ（親の下書き state を更新） */
  onEditChange?: (value: string) => void
  /** 確定（Enter / 明示ボタン）。blur では確定しない */
  onEditCommit?: () => void
  /** 取り消し（Escape） */
  onEditCancel?: () => void
  /** ✎ ボタンで編集を開始する（編集していないときのみ表示） */
  onEditStart?: () => void
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
  editing = false,
  editDraft = '',
  onEditChange,
  onEditCommit,
  onEditCancel,
  onEditStart,
}: StickyProps) {
  const meta = CARD_META[card.kind]
  const withInfo = showMeta && showInfo && onInfo != null
  const canEdit = onEditStart != null
  return (
    <div
      className={`sticky ${small ? 'small' : ''} ${dragging ? 'dragging' : ''} ${inHand ? 'in-hand' : ''} ${className}`}
      style={{ background: meta.color, color: meta.ink, ...style }}
      role="group"
      aria-label={`${meta.labelJa}: ${card.labelJa}`}
    >
      {showMeta && (
        <span className="meta" style={{ color: meta.ink }}>
          <Icon name={meta.icon} size={15} className="icon" />
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
              <Icon name="info" size={14} />
            </button>
          )}
          {canEdit && !editing && (
            <button
              type="button"
              className="sticky-info"
              style={{ color: meta.ink }}
              // ✎ タップでドラッグを開始させない
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onEditStart?.()
              }}
              aria-label={`${card.labelJa} を編集`}
            >
              <Icon name="edit" size={14} />
            </button>
          )}
        </span>
      )}
      {editing ? (
        <input
          className="sandbox-card-edit"
          value={editDraft}
          autoFocus
          // 入力は controlled。blur では確定しない（Enter / 明示のみ）。
          onPointerDown={(e) => e.stopPropagation()}
          onChange={(e) => onEditChange?.(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onEditCommit?.()
            } else if (e.key === 'Escape') {
              e.preventDefault()
              onEditCancel?.()
            }
          }}
          aria-label={`${meta.labelJa}のラベルを編集`}
        />
      ) : (
        <span className="text">{card.labelJa}</span>
      )}
      {card.labelEn && !editing && (
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
