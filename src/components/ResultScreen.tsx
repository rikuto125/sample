import { useState } from 'react'
import { STAGES } from '../data/stages'
import { useStore } from '../store'
import { CARD_META } from '../game/cardMeta'
import { track } from '../game/analytics'

export function ResultScreen() {
  const { state, dispatch } = useStore()
  const stage = STAGES[state.stageIdx]
  const stars = state.lastStars ?? 1
  const isLast = state.stageIdx >= STAGES.length - 1
  const [showMore, setShowMore] = useState(false)
  const m = CARD_META[stage.vocab.kind]

  return (
    <div className="screen result screen-dark">
      <div className="result-title">STAGE CLEAR!</div>
      <div className="stars-big" aria-label={`${stars}つ星`}>
        {'★'.repeat(stars)}
        <span className="dim">{'★'.repeat(3 - stars)}</span>
      </div>
      <div className="result-sub">
        {stars === 3 && 'ノーミス！ 完璧な理解です。'}
        {stars === 2 && 'クリア！ ノーミスで★3を狙えます。'}
        {stars === 1 && 'クリア！ ヒントなしで★2以上に挑戦しよう。'}
      </div>

      <div className="vocab-card" style={{ background: m.color, color: m.ink }}>
        <div className="vocab-new" aria-hidden>
          NEW! 用語を獲得
        </div>
        <div className="vocab-icon">{m.icon}</div>
        <div className="vocab-ja">{stage.vocab.ja}</div>
        <div className="vocab-en">{stage.vocab.en}</div>
        <div className="vocab-def">{stage.vocab.def}</div>
      </div>

      <div className="reality">
        <strong>💡 実務ではこうなっている</strong>
        <p>{stage.reality.short}</p>
        {stage.reality.long && (
          <>
            {showMore ? (
              <p className="reality-long">{stage.reality.long}</p>
            ) : (
              <button className="more-btn" onClick={() => setShowMore(true)}>
                もっと見る ▾
              </button>
            )}
          </>
        )}
        {stage.mode === 'trigger' && stage.chain && (
          <div className="chain-box">
            <strong>🔗 因果の連鎖</strong>
            <p>{stage.chain.description}</p>
          </div>
        )}
      </div>

      {isLast ? (
        <button
          className="btn-primary"
          onClick={() => {
            track('game_complete')
            dispatch({ type: 'goComplete' })
          }}
        >
          第1章クリア！ 完走画面へ 🎉
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            const nextIdx = state.stageIdx + 1
            track('stage_start', { stage: STAGES[nextIdx].id })
            dispatch({ type: 'nextStage' })
          }}
        >
          つぎのステージへ ▶
        </button>
      )}
      <button
        className="btn-ghost on-dark"
        onClick={() => dispatch({ type: 'goHome' })}
      >
        ホームへ
      </button>
    </div>
  )
}
