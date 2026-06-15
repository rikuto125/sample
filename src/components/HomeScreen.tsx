import { STAGES, CHAPTERS } from '../data/stages'
import { useStore } from '../store'
import { clearedCount } from '../game/progress'
import { track } from '../game/analytics'
import { Icon, Stars } from './Icon'
import { Mascot } from './Mascot'
import { VocabCodex } from './VocabCodex'
import { Star } from 'lucide-react'
import type { Stage } from '../game/types'

/** パスのノードを左右に振る横オフセット（Duolingo 風の蛇行）。 */
const PATH_OFFSETS = [0, 40, 58, 40, 0, -40, -58, -40]

export function HomeScreen() {
  const { state, dispatch } = useStore()
  const { progress } = state
  const done = clearedCount(progress)
  const total = STAGES.length
  // 連続ロック: 最初の未クリアステージまで解放
  const firstUncleared = STAGES.findIndex((s) => progress.stars[s.id] == null)
  const startIdx = firstUncleared < 0 ? 0 : firstUncleared
  const totalStarCount = Object.values(progress.stars).reduce((a, b) => a + b, 0)

  // stageId -> 全体での index（ロック判定に使う）
  const indexOf = new Map(STAGES.map((s, i) => [s.id, i]))

  // 着手を計測（完走率の分母）。stageIdx が変わる着手で1回発火。
  function startStage(idx: number) {
    track('stage_start', { stage: STAGES[idx].id })
    dispatch({ type: 'startStage', idx })
  }

  return (
    <div className="screen home">
      <div className="hero">
        <div className="kicker">EVENTSTORMING を手が覚える</div>
        <h1>
          <span className="app">StormQuest</span>
        </h1>
        <p className="hero-tag">
          本では掴めなかった「色と文法」を、手を動かして15分で。
        </p>
        <div className="progressbar">
          <i style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <p className="pct">
          {done} / {total} ステージ・{totalStarCount}{' '}
          <Star size={13} fill="currentColor" strokeWidth={2} className="pct-star" aria-hidden />
        </p>
      </div>

      {CHAPTERS.map((chapter, ci) => {
        const stages = chapter.stageIds
          .map((id) => STAGES.find((s) => s.id === id))
          .filter((s): s is Stage => s != null)
        const chapterDone = stages.every((s) => progress.stars[s.id] != null)
        const chapterCleared = stages.filter(
          (s) => progress.stars[s.id] != null,
        ).length
        return (
          <section key={chapter.id} className="unit">
            {/* セクション帯（Duolingo のユニットヘッダ風） */}
            <div className={`unit-banner ${chapterDone ? 'done' : ''}`}>
              <span className="unit-icon">
                <Icon name={chapter.icon} size={22} />
              </span>
              <span className="unit-text">
                <span className="unit-kicker">
                  SECTION {ci + 1} ・ {chapterCleared}/{stages.length}
                </span>
                <span className="unit-title">{chapter.title}</span>
              </span>
              {chapterDone && (
                <span className="unit-badge" aria-label="クリア">
                  <Icon name="check" size={16} />
                </span>
              )}
            </div>

            {/* 蛇行する学習パス */}
            <ol className="path">
              {stages.map((s) => {
                const i = indexOf.get(s.id)!
                const stars = progress.stars[s.id]
                const cleared = stars != null
                const isCurrent = i === startIdx
                const locked = i > startIdx && stars == null
                const off = PATH_OFFSETS[i % PATH_OFFSETS.length]
                return (
                  <li
                    key={s.id}
                    className={`path-row ${off <= 0 ? 'lean-left' : 'lean-right'}`}
                    style={{ ['--off' as string]: `${off}px` }}
                  >
                    {isCurrent && <div className="start-flag">ここから</div>}
                    <button
                      className={`path-node ${cleared ? 'cleared' : ''} ${isCurrent ? 'current' : ''} ${locked ? 'locked' : ''}`}
                      disabled={locked}
                      onClick={() => startStage(i)}
                      aria-label={`${s.name}・${s.modeLabel}${cleared ? `・${stars}つ星クリア済み` : locked ? '・ロック中' : '・挑戦できます'}`}
                    >
                      <Icon name={locked ? 'lock' : s.icon} size={30} />
                    </button>
                    <span className="path-caption">
                      <span className="path-name">{s.name}</span>
                      {cleared ? (
                        <Stars value={stars} size={13} />
                      ) : (
                        <span className="path-mode">{s.modeLabel}</span>
                      )}
                    </span>
                    {isCurrent && (
                      <Mascot mood="happy" size={80} className="path-mascot" />
                    )}
                  </li>
                )
              })}
            </ol>
          </section>
        )
      })}

      <button className="btn-primary" onClick={() => startStage(startIdx)}>
        {done === 0 ? 'はじめる' : done >= total ? 'もう一度挑戦' : 'つづきから'}
      </button>

      {done >= total && (
        <button className="btn-ghost" onClick={() => dispatch({ type: 'goComplete' })}>
          <Icon name="trophy" size={18} /> 完走画面を見る
        </button>
      )}

      <VocabCodex unlocked={progress.unlockedVocab} />
    </div>
  )
}
