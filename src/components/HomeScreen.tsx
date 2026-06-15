import { STAGES, CHAPTERS } from '../data/stages'
import { useStore } from '../store'
import { clearedCount } from '../game/progress'
import { CARD_META } from '../game/cardMeta'
import { track } from '../game/analytics'
import type { Stage } from '../game/types'

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
        <div className="progressbar">
          <i style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <p className="pct">
          {done} / {total} ステージ・{totalStarCount}★
        </p>
      </div>

      {CHAPTERS.map((chapter) => {
        const stages = chapter.stageIds
          .map((id) => STAGES.find((s) => s.id === id))
          .filter((s): s is Stage => s != null)
        const chapterDone = stages.every((s) => progress.stars[s.id] != null)
        const chapterCleared = stages.filter(
          (s) => progress.stars[s.id] != null,
        ).length
        return (
          <section key={chapter.id} className="chapter">
            <h3 className={`chapter-title ${chapterDone ? 'done' : ''}`}>
              <span className="chapter-icon">{chapter.icon}</span>
              {chapter.title}
              {chapterDone && <span className="chapter-badge">クリア</span>}
            </h3>
            <div
              className="progressbar chapter-progress"
              aria-label={`章の進捗 ${chapterCleared} / ${stages.length}`}
            >
              <i style={{ width: `${(chapterCleared / stages.length) * 100}%` }} />
            </div>
            <div className="stage-map">
              {stages.map((s) => {
                const i = indexOf.get(s.id)!
                const stars = progress.stars[s.id]
                const locked = i > startIdx && stars == null
                return (
                  <button
                    key={s.id}
                    className={`stage-node ${stars != null ? 'cleared' : ''} ${locked ? 'locked' : ''}`}
                    disabled={locked}
                    onClick={() => startStage(i)}
                  >
                    <span className="node-icon">{s.icon}</span>
                    <span className="node-body">
                      <span className="node-name">{s.name}</span>
                      <span className="node-mode">{s.modeLabel}</span>
                    </span>
                    <span className="node-stars">
                      {stars != null
                        ? '★'.repeat(stars) + '☆'.repeat(3 - stars)
                        : locked
                          ? '🔒'
                          : '▶'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )
      })}

      <button className="btn-primary" onClick={() => startStage(startIdx)}>
        {done === 0 ? 'はじめる' : done >= total ? 'もう一度挑戦' : 'つづきから'}
      </button>

      {done >= total && (
        <button className="btn-ghost" onClick={() => dispatch({ type: 'goComplete' })}>
          完走画面を見る 🎉
        </button>
      )}

      <VocabCodex unlocked={progress.unlockedVocab} />
    </div>
  )
}

function VocabCodex({ unlocked }: { unlocked: string[] }) {
  // 重複する vocab id を除いた全語彙
  const seen = new Set<string>()
  const all = STAGES.map((s) => s.vocab).filter((v) => {
    if (seen.has(v.id)) return false
    seen.add(v.id)
    return true
  })
  if (unlocked.length === 0) return null
  return (
    <div className="codex">
      <h3 className="codex-title">
        📖 用語図鑑（{unlocked.filter((id) => all.some((v) => v.id === id)).length}/
        {all.length}）
      </h3>
      <div className="codex-grid">
        {all.map((v) => {
          const got = unlocked.includes(v.id)
          const m = CARD_META[v.kind]
          return (
            <div
              key={v.id}
              className={`codex-card ${got ? 'got' : 'empty'}`}
              style={got ? { background: m.color, color: m.ink } : undefined}
            >
              {got ? (
                <>
                  <span className="codex-icon" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="codex-ja">{v.ja}</span>
                  <span className="codex-en">{v.en}</span>
                </>
              ) : (
                <span className="codex-locked">？？？</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
