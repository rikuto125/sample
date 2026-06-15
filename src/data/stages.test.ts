import { describe, it, expect } from 'vitest'
import { STAGES, CHAPTERS } from './stages'
import { applyCommand } from '../game/engine'

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
      } else if (stage.mode === 'trigger') {
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
      } else {
        // invariant モード（第2章）
        it('step は最低1つ、id は一意', () => {
          expect(stage.steps.length).toBeGreaterThan(0)
          const ids = stage.steps.map((s) => s.id)
          expect(new Set(ids).size).toBe(ids.length)
        })
        it('各 step は guards/effects/rejectReason を持つ', () => {
          for (const step of stage.steps) {
            expect(Array.isArray(step.guards)).toBe(true)
            expect(typeof step.effects).toBe('object')
            expect(step.rejectReason.length).toBeGreaterThan(0)
            expect(step.emitsEventJa).toMatch(/(した|された)$/) // 過去形のイベント
          }
        })
        it('集約カードの語彙は aggregate 種別', () => {
          expect(stage.aggregateVocab.kind).toBe('aggregate')
        })
        it('ステージが「通る/拒否」両方を含む（教育的に有意義）', () => {
          // initialState から steps を順に適用し、passed の真偽が両方出ることを確認
          let s = { ...stage.initialState }
          const results: boolean[] = []
          for (const step of stage.steps) {
            const r = applyCommand(s, step)
            results.push(r.passed)
            s = r.next
          }
          // 第2章の拒否を学ぶステージ(ch2-s2/s3)は両方を含むべき
          if (stage.id !== 'ch2-s1') {
            expect(results).toContain(true)
            expect(results).toContain(false)
          } else {
            // 導入ステージは全部通る
            expect(results.every((x) => x)).toBe(true)
          }
        })
      }
    })
  }
})

describe('CHAPTERS データ整合性', () => {
  it('全 chapter の stageIds は実在する STAGES を指す', () => {
    const stageIds = new Set(STAGES.map((s) => s.id))
    for (const ch of CHAPTERS) {
      for (const id of ch.stageIds) {
        expect(stageIds.has(id)).toBe(true)
      }
    }
  })
  it('全 STAGES がいずれかの chapter に属する（孤立ステージゼロ）', () => {
    const inChapters = new Set(CHAPTERS.flatMap((c) => c.stageIds))
    for (const s of STAGES) {
      expect(inChapters.has(s.id)).toBe(true)
    }
  })
})
