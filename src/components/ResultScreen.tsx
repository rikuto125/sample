import { useEffect, useState } from 'react'
import { STAGES, chapterOf, isChapterLastStage } from '../data/stages'
import { useStore } from '../store'
import { CARD_META } from '../game/cardMeta'
import { track } from '../game/analytics'
import { Icon } from './Icon'
import { MascotImage } from './MascotImage'
import { soundEngine as sound } from '../game/sound'

export function ResultScreen() {
  const { state, dispatch } = useStore()
  const stage = STAGES[state.stageIdx]
  const stars = state.lastStars ?? 1
  const isLast = state.stageIdx >= STAGES.length - 1
  const [showMore, setShowMore] = useState(false)
  const m = CARD_META[stage.vocab.kind]

  // 星獲得音（カチッ×星数）。視覚等価物は ★表示テキスト自体（§6.5）。
  useEffect(() => {
    sound.playStars(stars)
  }, [stars])

  // 章末（ただし全体の最終ステージでない）なら章クリア帯を出す。
  // 章は CardKind でないので記法色は使わず、章アイコン＋中立色で表す。
  const chapter = chapterOf(stage.id)
  const showChapterClear = isChapterLastStage(stage.id) && !isLast && chapter != null

  return (
    <div className="screen result screen-dark">
      {/* ★3/★2 は祝福(wink メダリオン)、★1 は前向きな励まし(sad 全身)。叱責にしない。 */}
      {stars >= 2 ? (
        <MascotImage mood="wink" size={96} className="result-mascot-img" />
      ) : (
        <MascotImage mood="sad" size={120} className="result-mascot-full" />
      )}
      <div className="result-title">STAGE CLEAR!</div>
      <div className="stars-big" aria-label={`${stars}つ星`}>
        {Array.from({ length: 3 }, (_, i) =>
          i < stars ? (
            <Icon
              name="star"
              key={i}
              className="star-pop star-on"
              style={{ animationDelay: `${i * 90}ms` }}
              fill="currentColor"
              strokeWidth={2}
            />
          ) : (
            <Icon name="star" key={i} className="star-off" fill="none" strokeWidth={2} />
          ),
        )}
      </div>
      <div className="result-sub">
        {stars === 3 && 'ノーミス！ 完璧な理解です。'}
        {stars === 2 && 'クリア！ ノーミスで★3を狙えます。'}
        {stars === 1 && 'クリア！ ヒントなしで★2以上に挑戦しよう。'}
      </div>

      {showChapterClear && (
        <div className="chapter-clear" role="status">
          <span className="cc-badge">
            <Icon name={chapter.icon} size={22} />
          </span>
          <span className="cc-text">{chapter.title} クリア！</span>
        </div>
      )}

      <div className="vocab-card" style={{ background: m.color, color: m.ink }}>
        <div className="vocab-new" aria-hidden>
          <Icon name="sparkles" size={13} /> NEW! 用語を獲得
        </div>
        <div className="vocab-icon">
          <Icon name={m.icon} size={30} />
        </div>
        <div className="vocab-ja">{stage.vocab.ja}</div>
        <div className="vocab-en">{stage.vocab.en}</div>
        <div className="vocab-def">{stage.vocab.def}</div>
      </div>

      <div className="reality">
        <strong>
          <Icon name="hint" size={16} /> 実務ではこうなっている
        </strong>
        <p>{stage.reality.short}</p>
        {stage.reality.long && (
          <>
            {showMore ? (
              <p className="reality-long">{stage.reality.long}</p>
            ) : (
              <button className="more-btn" onClick={() => setShowMore(true)}>
                もっと見る <Icon name="more" size={15} />
              </button>
            )}
          </>
        )}
        {stage.mode === 'trigger' && stage.chain && (
          <div className="chain-box">
            <strong>
              <Icon name="chain" size={16} /> 因果の連鎖
            </strong>
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
          全章クリア！ 完走画面へ <Icon name="trophy" size={18} />
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={() => {
            const nextIdx = state.stageIdx + 1
            if (showChapterClear) {
              track('chapter_complete', { chapter: chapter.id, stars })
            }
            track('stage_start', { stage: STAGES[nextIdx].id })
            dispatch({ type: 'nextStage' })
          }}
        >
          {showChapterClear ? 'つぎの章へ' : 'つぎのステージへ'} <Icon name="next" size={18} />
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
