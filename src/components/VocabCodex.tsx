import { STAGES } from '../data/stages'
import { CARD_META } from '../game/cardMeta'
import { Icon } from './Icon'

/**
 * 用語図鑑（コレクション）。獲得済み語彙を色＋アイコン＋ラベルで、未獲得は錠前で表示。
 * 空きスロットが学習動機になる（design-system §3.2）。
 */
export function VocabCodex({ unlocked }: { unlocked: string[] }) {
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
        <Icon name="readModel" size={18} /> 用語図鑑（
        {unlocked.filter((id) => all.some((v) => v.id === id)).length}/{all.length}）
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
                  <span className="codex-icon">
                    <Icon name={m.icon} size={18} />
                  </span>
                  <span className="codex-ja">{v.ja}</span>
                  <span className="codex-en">{v.en}</span>
                </>
              ) : (
                <span className="codex-locked">
                  <Icon name="lock" size={16} />
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
