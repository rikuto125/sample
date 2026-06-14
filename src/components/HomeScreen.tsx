import { STAGES } from '../data/stages'
import { useStore } from '../store'
import { clearedCount } from '../game/progress'
import { CARD_META } from '../game/cardMeta'

export function HomeScreen() {
  const { state, dispatch } = useStore()
  const { progress } = state
  const done = clearedCount(progress)
  const total = STAGES.length
  const firstUncleared = STAGES.findIndex((s) => progress.stars[s.id] == null)
  const startIdx = firstUncleared < 0 ? 0 : firstUncleared

  return (
    <div className="screen home">
      <div className="hero">
        <div className="kicker">EVENTSTORMING を手が覚える</div>
        <h1>
          <span className="app">StormQuest</span>
        </h1>
        <p className="domain">第1章 — 🍕 ピザデリバリーの注文業務</p>
        <div className="progressbar">
          <i style={{ width: `${(done / total) * 100}%` }} />
        </div>
        <p className="pct">
          {done} / {total} ステージ・{Object.values(progress.stars).reduce((a, b) => a + b, 0)}★
        </p>
      </div>

      <div className="stage-map">
        {STAGES.map((s, i) => {
          const stars = progress.stars[s.id]
          const locked = i > startIdx && stars == null
          return (
            <button
              key={s.id}
              className={`stage-node ${stars != null ? 'cleared' : ''} ${locked ? 'locked' : ''}`}
              disabled={locked}
              onClick={() => dispatch({ type: 'startStage', idx: i })}
            >
              <span className="node-icon">{s.icon}</span>
              <span className="node-body">
                <span className="node-name">{s.name}</span>
                <span className="node-mode">{s.modeLabel}</span>
              </span>
              <span className="node-stars">
                {stars != null ? '★'.repeat(stars) + '☆'.repeat(3 - stars) : locked ? '🔒' : '▶'}
              </span>
            </button>
          )
        })}
      </div>

      <button
        className="btn-primary"
        onClick={() => dispatch({ type: 'startStage', idx: startIdx })}
      >
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
  const all = STAGES.map((s) => s.vocab)
  if (unlocked.length === 0) return null
  return (
    <div className="codex">
      <h3 className="codex-title">📖 用語図鑑（{unlocked.length}/{all.length}）</h3>
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
                  <span className="codex-icon" aria-hidden>{m.icon}</span>
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
