import { CARD_META } from '../game/cardMeta'
import type { CardKind } from '../game/types'

const ORDER: CardKind[] = [
  'event',
  'command',
  'actor',
  'policy',
  'externalSystem',
  'readModel',
]

export function Legend({ kinds = ORDER }: { kinds?: CardKind[] }) {
  return (
    <div className="legend" aria-label="記法の凡例">
      {kinds.map((k) => {
        const m = CARD_META[k]
        return (
          <span
            key={k}
            className="chip"
            style={{ background: m.color, color: m.ink }}
          >
            <span aria-hidden>{m.icon}</span>
            {m.labelJa}
          </span>
        )
      })}
    </div>
  )
}
