import { useMemo, useState } from 'react'
import type { Card, CardKind, TriggerStage } from '../game/types'
import { checkTriggers, isValidLink } from '../game/engine'
import { CARD_META } from '../game/cardMeta'
import { Sticky } from './Sticky'
import { shuffle } from '../game/shuffle'
import { soundEngine as sound } from '../game/sound'

interface Props {
  stage: TriggerStage
  onCorrect: (mistakes: number, usedHint: boolean) => void
  onMistake: (reason: string) => void
  /** 付箋の i ボタンで種別の定義を開く */
  onInfo?: (kind: CardKind) => void
}

/**
 * トリガー接続モード。
 * 操作: トレイのトリガーをタップ選択 → コマンドのスロットをタップで接続。
 * （ドラッグより確実で、モバイル・キーボード・SR すべてで動く。デザイン仕様のタップ代替を主動線に）
 */
export function TriggerMode({ stage, onCorrect, onMistake, onInfo }: Props) {
  const trayCards = useMemo(() => shuffle(stage.triggers), [stage])
  const [selected, setSelected] = useState<Card | null>(null)
  const [links, setLinks] = useState<Record<string, string>>({})
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [justLinked, setJustLinked] = useState<string | null>(null)

  const triggerById = useMemo(
    () => new Map(stage.triggers.map((t) => [t.id, t])),
    [stage],
  )

  function connect(commandId: string) {
    if (!selected) {
      onMistake('先に下のトレイからトリガーを1枚選んでね。')
      return
    }
    if (isValidLink(stage, commandId, selected.id)) {
      setLinks((l) => ({ ...l, [commandId]: selected.id }))
      setSelected(null)
      sound.play('snap')
      // MODE2 接続演出（赤破線→緑実線+✓）を 250ms 当てる
      setJustLinked(commandId)
      window.setTimeout(() => setJustLinked(null), 260)
    } else {
      setMistakes((m) => m + 1)
      onMistake(
        selected.reason ??
          `${CARD_META[selected.kind].labelJa}「${selected.labelJa}」はこのコマンドの引き金ではありません。誰の意思・どの事実が起こすのか考えてみよう。`,
      )
    }
  }

  function check() {
    const result = checkTriggers(stage, links)
    if (result.correct) {
      onCorrect(mistakes, usedHint)
    } else {
      setMistakes((m) => m + 1)
      onMistake('まだ接続されていないコマンドがあります。孤立コマンドをゼロに！')
    }
  }

  const allLinked = stage.commands.every((c) => links[c.id])

  return (
    <div className="trigger-board">
      <div className="commands-col">
        {stage.commands.map((cmd) => {
          const linkedId = links[cmd.id]
          const linked = linkedId ? triggerById.get(linkedId) : undefined
          return (
            <div key={cmd.id} className="command-row">
              <button
                className={`trigger-slot ${linked ? 'filled' : 'empty'} ${selected ? 'active' : ''} ${justLinked === cmd.id ? 'just-linked' : ''}`}
                onClick={() => connect(cmd.id)}
                aria-label={
                  linked
                    ? `${cmd.labelJa} のトリガー: ${linked.labelJa}（変更）`
                    : `${cmd.labelJa} にトリガーを接続`
                }
              >
                {linked ? (
                  <Sticky card={linked} small />
                ) : (
                  <span className="slot-hint">＋ トリガー</span>
                )}
              </button>
              <span className="connector" aria-hidden>
                →
              </span>
              <Sticky card={cmd} onInfo={onInfo} showInfo={onInfo != null} />
            </div>
          )
        })}
      </div>

      <div className="tray">
        <div className="hand-label">
          トリガーを選ぶ（Actor / Policy / External）→ 上のスロットをタップ
        </div>
        <div className="hand-cards">
          {trayCards.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelected(selected?.id === t.id ? null : t)}
              style={{
                background: 'none',
                border:
                  selected?.id === t.id
                    ? '3px solid var(--accent)'
                    : '3px solid transparent',
                borderRadius: 'calc(var(--radius-sticky) + 3px)',
                padding: 0,
              }}
              aria-pressed={selected?.id === t.id}
              aria-label={`${CARD_META[t.kind].labelJa} ${t.labelJa} を選択`}
            >
              <Sticky card={t} small />
            </button>
          ))}
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
            「人の意思」で起きるなら Actor（黄）、「◯◯したら自動で」なら Policy（紫）、
            外のシステムが知らせてくるなら External（ピンク）。
          </p>
        )}
        <button className="btn-primary" disabled={!allLinked} onClick={check}>
          接続を確定 ▶
        </button>
      </div>
    </div>
  )
}
