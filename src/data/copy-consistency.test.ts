import { describe, expect, it } from 'vitest'
import { STAGES, isInvariantStage } from './stages'
import { GLOSSARY } from '../game/glossary'
import type { Stage } from '../game/types'

// 文言の表記揺れ・内部資料参照の回帰検出。
// プレイヤーが目にする文字列（scenario / instruction / reason / reality / chain / vocab）と
// 定義シートに出る GLOSSARY の def/note を1つの配列に集め、横断ルールで検査する。
// ここで失敗したら「正＝CONTEXT.md」に寄せて直す（DESIGN.md 優先順位①②）。

/** 1ステージのプレイヤー可視文字列をすべて集める。 */
function stageStrings(s: Stage): string[] {
  const out: string[] = [s.name, s.scenario, s.instruction, s.modeLabel]
  out.push(s.reality.short)
  if (s.reality.long) out.push(s.reality.long)
  if (s.mode === 'timeline') {
    for (const d of s.distractors) if (d.reason) out.push(d.reason)
  } else if (s.mode === 'trigger') {
    for (const t of s.triggers) if (t.reason) out.push(t.reason)
    if (s.chain) out.push(s.chain.description)
  } else if (isInvariantStage(s)) {
    for (const step of s.steps) {
      out.push(step.labelJa, step.emitsEventJa, step.rejectReason)
    }
  }
  return out
}

/** プレイヤー可視の全文字列（stages + GLOSSARY def/note/intuition）。 */
const PLAYER_TEXT: string[] = [
  ...STAGES.flatMap(stageStrings),
  ...Object.values(GLOSSARY).flatMap((e) => {
    const xs = [e.def]
    if (e.note) xs.push(e.note)
    if (e.intuition) xs.push(e.intuition.hook, e.intuition.same)
    return xs
  }),
]

describe('表記揺れ — コマンド色は「水色」に統一（青を使わない）', () => {
  // CLAUDE.md / DESIGN.md §4: 記法色は業界標準に厳密一致。コマンド=水色。
  it('プレイヤー可視文に「（青）」「（青→」等のコマンド色表現がない', () => {
    const offenders = PLAYER_TEXT.filter((t) => /（青[）→]/.test(t))
    expect(offenders, `「青」でコマンド色を呼んでいる: ${offenders.join(' / ')}`).toEqual([])
  })
})

describe('表記揺れ — 用語の正式名に統一（口語略を使わない）', () => {
  it('「読モ」を使わない（リードモデルに統一）', () => {
    const offenders = PLAYER_TEXT.filter((t) => t.includes('読モ'))
    expect(offenders, `「読モ」が残っている: ${offenders.join(' / ')}`).toEqual([])
  })

  it('外部決済システムは「決済ゲートウェイ」に統一（決済代行を使わない）', () => {
    const offenders = PLAYER_TEXT.filter((t) => t.includes('決済代行'))
    expect(offenders, `「決済代行」が残っている: ${offenders.join(' / ')}`).toEqual([])
  })

  it('Domain Event の野良同義語「出来事」を本文で使わない（事実/イベントに統一）', () => {
    const offenders = PLAYER_TEXT.filter((t) => t.includes('出来事'))
    expect(offenders, `「出来事」が残っている: ${offenders.join(' / ')}`).toEqual([])
  })
})

describe('内部資料の参照をプレイヤー可視文に出さない', () => {
  // 書籍・章番号（§x.x / DDD-FAQ / 書籍N.N.N）は内部の参照であり、ゲーム本文に書かない。
  const FORBIDDEN = [/§/, /DDD-FAQ/i, /書籍\d/, /サンプルコード&FAQ/, /Hector/i]
  it('§ / DDD-FAQ / 書籍N.N / Hector を含まない', () => {
    const offenders = PLAYER_TEXT.filter((t) => FORBIDDEN.some((re) => re.test(t)))
    expect(offenders, `内部資料参照が残っている: ${offenders.join(' / ')}`).toEqual([])
  })
})

describe('表記揺れ — 強調引用符は全角 “ ” に統一（半角 " を本文に混ぜない）', () => {
  it('プレイヤー可視文に半角ストレートダブルクォートがない', () => {
    const offenders = PLAYER_TEXT.filter((t) => t.includes('"'))
    expect(offenders, `半角 " が残っている: ${offenders.join(' / ')}`).toEqual([])
  })
})

describe('時制 — event カードは過去形 / command カードは現在形（記法の核）', () => {
  // EventStorming の核: event=「〜した／された」、command=「〜する」。labelJa で機械検証。
  const PAST = /(した|された|れた|った|いた|んだ|なった|た)$/
  // 現在形（終止形）は う段かなで終わる: う/く/ぐ/す/つ/ぬ/ぶ/む/る。
  const PRESENT = /[うくぐすつぬぶむる]$/

  it('全ステージの event カード labelJa は過去形（〜た）で終わる', () => {
    const bad: string[] = []
    for (const s of STAGES) {
      const events =
        s.mode === 'timeline'
          ? s.events
          : s.mode === 'trigger'
            ? s.triggers.filter((t) => t.kind === 'event')
            : []
      for (const e of events) if (!PAST.test(e.labelJa)) bad.push(`${s.id}: ${e.labelJa}`)
    }
    expect(bad, `過去形でない event: ${bad.join(' / ')}`).toEqual([])
  })

  it('全ステージの command カード labelJa は現在形（〜る等）で終わる', () => {
    const bad: string[] = []
    for (const s of STAGES) {
      const commands =
        s.mode === 'timeline'
          ? s.distractors.filter((d) => d.kind === 'command')
          : s.mode === 'trigger'
            ? [
                ...s.commands.filter((c) => c.kind === 'command'),
                ...s.triggers.filter((t) => t.kind === 'command'),
              ]
            : []
      for (const c of commands) {
        if (PAST.test(c.labelJa) || !PRESENT.test(c.labelJa)) {
          bad.push(`${s.id}: ${c.labelJa}`)
        }
      }
    }
    expect(bad, `現在形でない command: ${bad.join(' / ')}`).toEqual([])
  })
})
