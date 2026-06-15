import { useState } from 'react'
import type { CardKind } from '../game/types'
import { CARD_META } from '../game/cardMeta'
import { kindHint, tenseAdvice } from '../game/notation'
import { Icon } from './Icon'

interface SandboxPaletteProps {
  onAdd: (kind: CardKind, labelJa: string) => void
}

const KINDS: CardKind[] = [
  'event',
  'command',
  'actor',
  'policy',
  'externalSystem',
  'readModel',
  'aggregate',
]

/**
 * 種別を選んでラベルを入力し付箋を足すパレット。
 * 色/アイコン/ラベルは CARD_META[kind] から導出（ユーザーに色を選ばせない＝記法を歪めない）。
 * 時制助言は event/command/policy のみ（他種別に時制概念は無い）。
 */
export function SandboxPalette({ onAdd }: SandboxPaletteProps) {
  const [kind, setKind] = useState<CardKind>('event')
  const [label, setLabel] = useState('')
  const meta = CARD_META[kind]
  const hint = kindHint(kind)
  const advice = tenseAdvice(kind, label)

  function add() {
    if (!label.trim()) return
    onAdd(kind, label)
    setLabel('')
  }

  return (
    <div className="sandbox-palette">
      <div className="sandbox-palette-kinds" role="group" aria-label="付箋の種別">
        {KINDS.map((k) => {
          const m = CARD_META[k]
          return (
            <button
              key={k}
              type="button"
              className={`sandbox-kind-btn ${kind === k ? 'selected' : ''}`}
              style={{ background: m.color, color: m.ink }}
              aria-pressed={kind === k}
              onClick={() => setKind(k)}
            >
              <Icon name={m.icon} size={14} /> {m.labelJa}
            </button>
          )
        })}
      </div>

      <label className="sandbox-input-label" style={{ color: meta.ink }}>
        <span className="sandbox-input-kind">
          <Icon name={meta.icon} size={14} /> {meta.labelJa}
        </span>
        <input
          className="sandbox-input"
          value={label}
          placeholder={hint.placeholder}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
          aria-label={`${meta.labelJa} のラベル`}
        />
      </label>

      {/* 時制助言（強制しない・該当時のみ） */}
      {advice && <p className="sandbox-advice">💡 {advice}</p>}

      <button
        type="button"
        className="btn-primary sandbox-add"
        onClick={add}
        disabled={!label.trim()}
      >
        <Icon name="plus" size={16} /> 付箋を足す
      </button>
    </div>
  )
}
