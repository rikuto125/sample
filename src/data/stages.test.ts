import { describe, it, expect } from 'vitest'
import { STAGES } from './stages'

// ステージデータの妥当性検証。ステージ追加時の事故を防ぐ。
describe('STAGES データ整合性', () => {
  it('id は一意', () => {
    const ids = STAGES.map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  for (const stage of STAGES) {
    describe(stage.id, () => {
      if (stage.mode === 'timeline') {
        it('events は全て event 種別', () => {
          expect(stage.events.every((e) => e.kind === 'event')).toBe(true)
        })
        it('distractors は event 以外（弾く対象）', () => {
          expect(stage.distractors.every((d) => d.kind !== 'event')).toBe(true)
        })
        it('orderConstraints の参照先は events 内に実在', () => {
          const ids = new Set(stage.events.map((e) => e.id))
          for (const [a, b] of stage.orderConstraints) {
            expect(ids.has(a)).toBe(true)
            expect(ids.has(b)).toBe(true)
          }
        })
      } else {
        it('validLinks の command/trigger 参照先は実在', () => {
          const cmdIds = new Set(stage.commands.map((c) => c.id))
          const trigIds = new Set(stage.triggers.map((t) => t.id))
          for (const [cmdId, valids] of Object.entries(stage.validLinks)) {
            expect(cmdIds.has(cmdId)).toBe(true)
            for (const v of valids) expect(trigIds.has(v)).toBe(true)
          }
        })
        it('全 command に validLinks が定義されている（孤立コマンドゼロ）', () => {
          for (const c of stage.commands) {
            expect(stage.validLinks[c.id]?.length ?? 0).toBeGreaterThan(0)
          }
        })
        it('chain がある場合は policy/command 参照先が実在', () => {
          if (stage.chain) {
            const trigIds = new Set(stage.triggers.map((t) => t.id))
            const cmdIds = new Set(stage.commands.map((c) => c.id))
            expect(trigIds.has(stage.chain.policyId)).toBe(true)
            expect(cmdIds.has(stage.chain.commandId)).toBe(true)
          }
        })
      }
    })
  }
})
