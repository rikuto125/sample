import { useState } from 'react'
import type {
  AggregateState,
  CardKind,
  InvariantGateStage,
} from '../game/types'
import { commandPasses, applyCommand } from '../game/engine'
import { CARD_META } from '../game/cardMeta'
import { soundEngine as sound } from '../game/sound'
import { haptics } from '../game/haptics'

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
  // 判断「後」に出す結果フィードバック（通った→発行イベント / 弾いた→理由）。
  // 判断「前」に答えを漏らさないため、ここでしか emitsEventJa / rejectReason を出さない。
  const [feedback, setFeedback] = useState<string | null>(null)

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
      setFeedback(
        passes
          ? `${eventMeta.icon} ${step.emitsEventJa}（イベント発行）`
          : `⛔ 弾いた — ${step.rejectReason}`,
      )
      const nextIdx = idx + 1
      setTimeout(() => setFlash(null), 600)
      setTimeout(() => setFeedback(null), 1400)
      if (nextIdx >= stage.steps.length) {
        onCorrect(mistakes, usedHint) // 最終正解は handleCorrect が 'correct' を鳴らす
      } else {
        sound.play('snap') // 途中の正しい判断
        haptics.fire('snap')
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
      {/* 進捗（問題 n/N）— ヘッダ直下に置き、何の進捗かを明示 */}
      <div className="gate-count" aria-label={`問題 ${Math.min(idx + 1, stage.steps.length)} / ${stage.steps.length}`}>
        問題 {Math.min(idx + 1, stage.steps.length)} / {stage.steps.length}
      </div>

      {/* 集約の状態カード（最重要）。塗りつぶしでなく左ボーダー＋枠で色面積を抑える。
          集約は「境界」なので枠線表現が概念とも一致する。 */}
      <div
        className={`aggregate-panel ${flash ?? ''}`}
        style={{ borderLeftColor: aggMeta.ink }}
      >
        <div className="agg-head">
          <span className="agg-badge" style={{ background: aggMeta.color, color: aggMeta.ink }}>
            <span aria-hidden>{aggMeta.icon}</span> 集約
          </span>
          <span className="agg-name">{stage.aggregateJa}</span>
        </div>
        <div className="agg-state" aria-label={`集約の状態 ${describeState(state)}`}>
          {'postponeCount' in state && (
            <span className="state-pill">
              延期回数 <strong>{state.postponeCount}</strong> / 3
            </span>
          )}
          {'done' in state && (
            <span className="state-pill">
              状態 <strong>{state.done ? '完了' : '未完了'}</strong>
            </span>
          )}
        </div>
        {/* 不変条件 = 照合すべきルール。カードの主役として強調 */}
        <div className="agg-invariants">
          <div className="agg-invariants-label">守るべき不変条件</div>
          <ul>
            <li>延期は最大 3 回まで</li>
            <li>完了済みのタスクは変更できない</li>
          </ul>
        </div>
      </div>

      {!done && (
        <>
          {/* 届いたコマンド（「これを判定せよ」と明示。判断前のネタバレなし） */}
          <div className="incoming-command">
            <span className="incoming-ask">
              このコマンドは通る？ 状態と不変条件を照らして判断
            </span>
            <div className="cmd-card" style={{ borderLeftColor: cmdMeta.ink }}>
              <span className="cmd-badge" style={{ background: cmdMeta.color, color: cmdMeta.ink }}>
                <span aria-hidden>{cmdMeta.icon}</span> コマンド
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
              <span className="cmd-label">{step.labelJa}</span>
            </div>
          </div>

          {/* 判断「後」の結果フィードバック */}
          {feedback && (
            <div className={`gate-feedback ${flash ?? ''}`} role="status">
              {feedback}
            </div>
          )}

          {/* 2択：色だけに頼らず 記号(✓/⊘)＋ラベル で冗長化（色覚対応） */}
          <div className="gate-decision">
            <button className="gate-btn pass" onClick={() => decide(true)}>
              <span className="gate-icon" aria-hidden>✓</span> 通す
            </button>
            <button className="gate-btn reject" onClick={() => decide(false)}>
              <span className="gate-icon" aria-hidden>⊘</span> 弾く
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
          ヒント（★が下がる）
        </button>
        {showHint && (
          <p className="hint-text">
            集約の「延期回数」と「状態」を、上の不変条件と照らし合わせよう。
            どれかを破るなら弾く、どれも破らないなら通す。
          </p>
        )}
      </div>
    </div>
  )
}
