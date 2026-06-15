import { describe, expect, it } from 'vitest'
import { CARD_META } from './cardMeta'
import { GLOSSARY, KIND_TO_GLOSSARY_ID, refVocab } from './glossary'
import { STAGES } from '../data/stages'
import type { CardKind } from './types'

const KINDS = Object.keys(CARD_META) as CardKind[]

describe('GLOSSARY — 種別経路の網羅と整合', () => {
  it('全 CardKind が代表用語 id を持ち、その GLOSSARY エントリの kind が一致する', () => {
    for (const k of KINDS) {
      const id = KIND_TO_GLOSSARY_ID[k]
      expect(GLOSSARY[id], `KIND_TO_GLOSSARY_ID['${k}']='${id}' が GLOSSARY にない`).toBeDefined()
      expect(GLOSSARY[id].kind).toBe(k)
    }
  })

  it('全エントリの def は非空・句点（。）で終わる（章注記は note に分離）', () => {
    for (const [id, e] of Object.entries(GLOSSARY)) {
      expect(e.def.length, `${id} の def が空`).toBeGreaterThan(0)
      expect(e.def.endsWith('。'), `${id} の def が句点で終わっていない: ${e.def}`).toBe(true)
    }
  })

  it('kind を持たない補助用語はアイコンを持つ（色は付けないがアイコン＋ラベルの二重は維持）', () => {
    for (const [id, e] of Object.entries(GLOSSARY)) {
      if (e.kind == null) {
        expect(e.icon, `${id} は kind なしなのに icon もない`).toBeTruthy()
      }
    }
  })
})

describe('GLOSSARY — 文言が記法の核（色・時制）をズラしていない', () => {
  // ドメインの正確さ① / 唯一解の嘘をつかない② を文言レベルで回帰検出
  const checks: [string, string[]][] = [
    ['event', ['過去']],
    ['command', ['現在', 'する']],
    ['policy', ['したら', '自動']],
    ['aggregate', ['境界']],
    ['externalSystem', ['管理外']],
  ]
  it.each(checks)('%s の def に必須キーワードが含まれる', (id, keywords) => {
    const def = GLOSSARY[id].def
    for (const kw of keywords) {
      expect(def.includes(kw), `${id} の def に「${kw}」がない: ${def}`).toBe(true)
    }
  })

  it('集約不変条件は Phase 8 規約との別物注記を note で保持する（混同防止を消さない）', () => {
    expect(GLOSSARY.aggregateInvariant.note).toContain('Phase 8')
  })
})

describe('GLOSSARY — 二重管理の解消（stages の def が GLOSSARY 由来）', () => {
  it('全ステージの vocab.def は GLOSSARY のどれかの def と一致する', () => {
    const defs = new Set(Object.values(GLOSSARY).map((e) => e.def))
    for (const s of STAGES) {
      expect(defs.has(s.vocab.def), `${s.id} の vocab.def が GLOSSARY 由来でない: ${s.vocab.def}`).toBe(true)
    }
  })

  it('refVocab は GLOSSARY の def をそのまま返す', () => {
    expect(refVocab('event').def).toBe(GLOSSARY.event.def)
    // kind を持たない補助用語は kindOverride で CardKind を補う
    expect(refVocab('stateTransition', 'aggregate')).toMatchObject({
      def: GLOSSARY.stateTransition.def,
      kind: 'aggregate',
    })
  })

  it('refVocab は kind も kindOverride も無いと投げる', () => {
    expect(() => refVocab('aggregateInvariant')).toThrow()
  })
})

describe('GLOSSARY — 題材語を用語として混ぜない（ネガティブ）', () => {
  it('ピザ・タスク・付箋などの具体題材語を id にしない', () => {
    const forbidden = ['pizza', 'task', 'sticky', 'order', 'payment', 'ピザ', 'タスク']
    for (const id of Object.keys(GLOSSARY)) {
      expect(forbidden, `${id} は題材語`).not.toContain(id)
    }
  })
})

describe('GLOSSARY — 直感(intuition)の足場', () => {
  const withIntuition = Object.values(GLOSSARY).filter((e) => e.intuition)

  it('intuition を持つのは想定4語のみ（読めている語に足さない＝過剰適用検出）', () => {
    const ids = withIntuition.map((e) => e.id).sort()
    expect(ids).toEqual(
      ['aggregate', 'aggregateInvariant', 'command', 'event'].sort(),
    )
  })

  it('hook / same はともに非空', () => {
    for (const e of withIntuition) {
      expect(e.intuition!.hook.length, `${e.id} の hook が空`).toBeGreaterThan(0)
      expect(e.intuition!.same.length, `${e.id} の same が空`).toBeGreaterThan(0)
    }
  })

  it('intuition.same は def の逐語コピーでない（比喩は定義の劣化複製でない＝誠実さ）', () => {
    for (const e of withIntuition) {
      expect(e.intuition!.same, `${e.id}`).not.toBe(e.def)
    }
  })

  it('集約の intuition は「境界/番人/守る」のいずれかを含む（箱/入れ物の誤比喩を機械検出）', () => {
    const same = GLOSSARY.aggregate.intuition!.same
    expect(/境界|番人|守|ルール/.test(same), same).toBe(true)
    expect(same.includes('箱'), '集約を「箱」と表現しない').toBe(false)
    expect(same.includes('入れ物'), '集約を「入れ物」と表現しない').toBe(false)
  })
})

describe('GLOSSARY — ENTRIES 由来の導出（id 重複の silent dedupe 検出）', () => {
  it('各 GLOSSARY エントリの key と entry.id が一致する（Object.fromEntries の取り違え防止）', () => {
    for (const [key, entry] of Object.entries(GLOSSARY)) {
      expect(entry.id, `GLOSSARY['${key}'].id`).toBe(key)
    }
  })

  it('全 CardKind が KIND_TO_GLOSSARY_ID を持ち、その先の GLOSSARY エントリが存在する', () => {
    for (const k of KINDS) {
      const id = KIND_TO_GLOSSARY_ID[k]
      expect(id, `kind ${k} の代表 id`).toBeTruthy()
      expect(GLOSSARY[id], `GLOSSARY['${id}']`).toBeDefined()
      expect(GLOSSARY[id].kind).toBe(k)
    }
  })
})
