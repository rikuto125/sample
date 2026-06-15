import { useState } from 'react'
import type {
  AggregateState,
  CardKind,
  InvariantGateStage,
} from '../game/types'
import { commandPasses, applyCommand } from '../game/engine'
import { CARD_META } from '../game/cardMeta'

interface Props {
  stage: InvariantGateStage
  onCorrect: (mistakes: number, usedHint: boolean) => void
  onMistake: (reason: string) => void
  /** 付箋の i ボタンで種別の定義を開く */
  onInfo?: (kind: CardKind) => void
}

/**
 * MODE3 不変条件ゲート。
 * プレイヤーは各ステップで「このコマンドは今の集約状態で通る？」を「通す/拒否」で判断。
 * 正しく判断できると次へ。集約の状態（postponeCount 等）を常に可視化する。
 */
export function InvariantGateMode({
  stage,
  onCorrect,
  onMistake,
  onInfo,
}: Props) {
  const [state, setState] = useState<AggregateState>({ ...stage.initialState })
  const [idx, setIdx] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [usedHint, setUsedHint] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [flash, setFlash] = useState<'ok' | 'reject' | null>(null)

  const aggMeta = CARD_META.aggregate
  const cmdMeta = CARD_META.command
  const eventMeta = CARD_META.event
  const step = stage.steps[idx]
  const done = idx >= stage.steps.length

  function decide(decision: boolean) {
    if (done) return
    const passes = commandPasses(state, step)
    if (decision === passes) {
      // 正解。状態を進める
      const { next } = applyCommand(state, step)
      setState(next)
      setFlash(passes ? 'ok' : 'reject')
      const nextIdx = idx + 1
      setTimeout(() => setFlash(null), 600)
      if (nextIdx >= stage.steps.length) {
        onCorrect(mistakes, usedHint)
      } else {
        setIdx(nextIdx)
      }
    } else {
      // 誤判断
      setMistakes((m) => m + 1)
      if (passes) {
        onMistake(
          `これは通せます。今の状態（${describeState(state)}）では不変条件を満たします。`,
        )
      } else {
        onMistake(`これは拒否されます。${step.rejectReason}`)
      }
    }
  }

  function describeState(s: AggregateState): string {
    const parts: string[] = []
    if ('postponeCount' in s) parts.push(`延期${s.postponeCount}回`)
    if ('done' in s) parts.push(s.done ? '完了済み' : '未完了')
    return parts.join('・') || '初期状態'
  }

  return (
    <div className="invariant-board">
      {/* 集約パネル（状態の見える化） */}
      <div
        className={`aggregate-panel ${flash ?? ''}`}
        style={{ borderColor: aggMeta.color }}
      >
        <div className="agg-head" style={{ background: aggMeta.color, color: aggMeta.ink }}>
          <span aria-hidden>{aggMeta.icon}</span> 集約: {stage.aggregateJa}
        </div>
        <div className="agg-state" aria-label={`集約の状態 ${describeState(state)}`}>
          {'postponeCount' in state && (
            <span className="state-chip">
              延期回数 <strong>{state.postponeCount}</strong> / 3
            </span>
          )}
          {'done' in state && (
            <span className="state-chip">
              状態 <strong>{state.done ? 'DONE（完了）' : 'UNDONE（未完了）'}</strong>
            </span>
          )}
        </div>
        <div className="agg-invariant">
          🛡️ 不変条件: 延期は最大3回まで・完了済みは変更不可
        </div>
      </div>

      {/* 進捗 */}
      <div className="gate-progress" aria-label={`${idx} / ${stage.steps.length} コマンド処理済`}>
        {stage.steps.map((_, i) => (
          <span
            key={i}
            className={`gate-dot ${i < idx ? 'cleared' : i === idx ? 'current' : ''}`}
          />
        ))}
      </div>

      {!done && (
        <>
          <div className="incoming-command">
            <span className="incoming-label">届いたコマンド</span>
            <div
              className="sticky"
              style={{ background: cmdMeta.color, color: cmdMeta.ink }}
            >
              <span className="meta" style={{ color: cmdMeta.ink }}>
                <span className="icon" aria-hidden>
                  {cmdMeta.icon}
                </span>
                コマンド
                {onInfo && (
                  <button
                    type="button"
                    className="sticky-info"
                    style={{ color: cmdMeta.ink }}
                    onClick={() => onInfo('command')}
                    aria-label="コマンドの意味"
                  >
                    ⓘ
                  </button>
                )}
              </span>
              <span className="text">{step.labelJa}</span>
            </div>
            <div className="emits-hint">
              通れば →{' '}
              <span style={{ color: eventMeta.color }}>
                {eventMeta.icon} {step.emitsEventJa}
              </span>
            </div>
          </div>

          <div className="gate-decision">
            <button className="gate-btn pass" onClick={() => decide(true)}>
              ✅ 通す（イベント発行）
            </button>
            <button className="gate-btn reject" onClick={() => decide(false)}>
              🚫 拒否する（不変条件違反）
            </button>
          </div>
        </>
      )}

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
            集約の「延期回数」と「状態」を見て、このコマンドのルール（延期は3回まで・
            完了済みは変更不可）を破らないか確認しよう。破るなら拒否が正解。
          </p>
        )}
      </div>
    </div>
  )
}
