import { CARD_META } from '../game/cardMeta'
import { Icon } from './Icon'
import type { CardKind } from '../game/types'

const ORDER: CardKind[] = [
  'event',
  'command',
  'actor',
  'policy',
  'externalSystem',
  'readModel',
]

interface LegendProps {
  kinds?: CardKind[]
  /** 渡されたときだけチップがタップ可能になり、種別の定義を開く（後方互換） */
  onOpenDef?: (kind: CardKind) => void
}

export function Legend({ kinds = ORDER, onOpenDef }: LegendProps) {
  return (
    <div className="legend" aria-label="記法の凡例">
      {kinds.map((k) => {
        const m = CARD_META[k]
        const style = { background: m.color, color: m.ink }
        // onOpenDef がある時だけ button 化（タップで定義）。無い時は従来の span。
        if (onOpenDef) {
          return (
            <button
              key={k}
              type="button"
              className="chip"
              style={style}
              onClick={() => onOpenDef(k)}
              aria-label={`${m.labelJa}の意味を見る`}
              aria-haspopup="dialog"
            >
              <Icon name={m.icon} size={14} />
              {m.labelJa}
              <Icon name="info" size={13} className="chip-i" />
            </button>
          )
        }
        return (
          <span key={k} className="chip" style={style}>
            <Icon name={m.icon} size={14} />
            {m.labelJa}
          </span>
        )
      })}
    </div>
  )
}
