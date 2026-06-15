import { describe, it, expect } from 'vitest'
import {
  checkTimeline,
  checkTriggers,
  scoreStars,
  isValidLink,
  commandPasses,
  applyCommand,
  judgeGateDecision,
} from './engine'
import type {
  AggregateCommand,
  AggregateState,
  TimelineStage,
  TriggerStage,
} from './types'

const timeline: TimelineStage = {
  id: 't',
  mode: 'timeline',
  name: 't',
  icon: '',
  modeLabel: '',
  scenario: '',
  instruction: '',
  vocab: { id: 'v', ja: '', en: '', kind: 'event', def: '' },
  reality: { short: '' },
  events: [
    { id: 'a', kind: 'event', labelJa: 'A' },
    { id: 'b', kind: 'event', labelJa: 'B' },
    { id: 'c', kind: 'event', labelJa: 'C' },
  ],
  distractors: [
    { id: 'x', kind: 'command', labelJa: 'X', isDistractor: true },
  ],
  orderConstraints: [
    ['a', 'b'],
    ['b', 'c'],
  ],
}

describe('checkTimeline（半順序判定）', () => {
  it('正しい順序なら correct', () => {
    const r = checkTimeline(timeline, { placed: ['a', 'b', 'c'] })
    expect(r.correct).toBe(true)
    expect(r.violatedConstraints).toHaveLength(0)
  })

  it('順序が逆だと制約違反で不正解', () => {
    const r = checkTimeline(timeline, { placed: ['b', 'a', 'c'] })
    expect(r.correct).toBe(false)
    expect(r.violatedConstraints).toContainEqual(['a', 'b'])
  })

  it('制約に縛られない並びは複数正解になりうる（半順序）', () => {
    // a<b, b<c のみ。制約外の自由度はないが、制約が緩いケースを別ステージで検証する想定。
    // ここでは a,b,c の唯一順序が制約を満たすことを確認。
    const r = checkTimeline(timeline, { placed: ['a', 'c', 'b'] })
    expect(r.correct).toBe(false)
  })

  it('ダミーが混入すると不正解', () => {
    const r = checkTimeline(timeline, { placed: ['a', 'b', 'c', 'x'] })
    expect(r.hasDistractor).toBe(true)
    expect(r.correct).toBe(false)
  })

  it('イベントが足りないと completeSet=false', () => {
    const r = checkTimeline(timeline, { placed: ['a', 'b'] })
    expect(r.completeSet).toBe(false)
    expect(r.correct).toBe(false)
  })
})

const trigger: TriggerStage = {
  id: 'g',
  mode: 'trigger',
  name: 'g',
  icon: '',
  modeLabel: '',
  scenario: '',
  instruction: '',
  vocab: { id: 'v', ja: '', en: '', kind: 'policy', def: '' },
  reality: { short: '' },
  commands: [
    { id: 'c1', kind: 'command', labelJa: 'C1' },
    { id: 'c2', kind: 'command', labelJa: 'C2' },
  ],
  triggers: [
    { id: 't1', kind: 'actor', labelJa: 'T1' },
    { id: 't2', kind: 'externalSystem', labelJa: 'T2' },
    { id: 't3', kind: 'actor', labelJa: 'T3' },
  ],
  validLinks: {
    c1: ['t1', 't3'], // 複数正解
    c2: ['t2'],
  },
}

describe('checkTriggers（複数正解を許容）', () => {
  it('全コマンドが許容トリガーなら correct', () => {
    const r = checkTriggers(trigger, { c1: 't1', c2: 't2' })
    expect(r.correct).toBe(true)
  })

  it('複数正解の別解でも correct', () => {
    const r = checkTriggers(trigger, { c1: 't3', c2: 't2' })
    expect(r.correct).toBe(true)
  })

  it('1つでも誤接続なら不正解', () => {
    const r = checkTriggers(trigger, { c1: 't2', c2: 't2' })
    expect(r.correct).toBe(false)
    expect(r.perCommand.c1).toBe(false)
  })

  it('未接続があると不正解', () => {
    const r = checkTriggers(trigger, { c1: 't1' })
    expect(r.correct).toBe(false)
  })
})

describe('isValidLink', () => {
  it('許容集合に含まれれば true', () => {
    expect(isValidLink(trigger, 'c1', 't3')).toBe(true)
    expect(isValidLink(trigger, 'c1', 't2')).toBe(false)
  })
})

describe('scoreStars', () => {
  it('ノーミス＋ヒント不使用で3星', () => {
    expect(scoreStars({ mistakes: 0, usedHint: false })).toBe(3)
  })
  it('ミスありヒント不使用で2星', () => {
    expect(scoreStars({ mistakes: 2, usedHint: false })).toBe(2)
  })
  it('ヒント使用で1星', () => {
    expect(scoreStars({ mistakes: 0, usedHint: true })).toBe(1)
  })
})

// MODE3 不変条件ゲート（DDD書籍7.2.2 Task.postpone を題材）
const postpone: AggregateCommand = {
  id: 'postpone',
  labelJa: 'タスクを延期する',
  emitsEventJa: 'タスクが延期された',
  // 不変条件: 延期は最大3回まで（postponeCount < 3）かつ未完了（done == 0）
  guards: [
    { key: 'postponeCount', op: 'lt', value: 3 },
    { key: 'done', op: 'eq', value: 0 },
  ],
  effects: { postponeCount: +1 },
  rejectReason: '最大延期回数（3回）を超えています。',
}

const complete: AggregateCommand = {
  id: 'complete',
  labelJa: 'タスクを完了する',
  emitsEventJa: 'タスクが完了した',
  guards: [{ key: 'done', op: 'eq', value: 0 }],
  effects: { done: +1 },
  rejectReason: '完了済みのタスクは再度完了できません。',
}

describe('commandPasses（集約の不変条件）', () => {
  it('延期は0回時は通る', () => {
    expect(commandPasses({ postponeCount: 0, done: 0 }, postpone)).toBe(true)
  })
  it('延期は3回到達で拒否される（書籍 MAX_POSTPONE_COUNT=3）', () => {
    expect(commandPasses({ postponeCount: 3, done: 0 }, postpone)).toBe(false)
  })
  it('完了済みなら延期は拒否される', () => {
    expect(commandPasses({ postponeCount: 0, done: 1 }, postpone)).toBe(false)
  })
})

describe('applyCommand（状態遷移）', () => {
  it('延期成功で postponeCount が1増える', () => {
    const r = applyCommand({ postponeCount: 0, done: 0 }, postpone)
    expect(r.passed).toBe(true)
    expect(r.next.postponeCount).toBe(1)
  })
  it('延期を3回繰り返すと4回目は拒否され状態は変わらない', () => {
    let s: AggregateState = { postponeCount: 0, done: 0 }
    s = applyCommand(s, postpone).next
    s = applyCommand(s, postpone).next
    s = applyCommand(s, postpone).next
    expect(s.postponeCount).toBe(3)
    const fourth = applyCommand(s, postpone)
    expect(fourth.passed).toBe(false)
    expect(fourth.next.postponeCount).toBe(3)
  })
  it('完了すると done=1 になり、以降の完了は拒否', () => {
    const r = applyCommand({ postponeCount: 0, done: 0 }, complete)
    expect(r.passed).toBe(true)
    expect(r.next.done).toBe(1)
    expect(applyCommand(r.next, complete).passed).toBe(false)
  })
})

describe('judgeGateDecision（プレイヤーの判断の正誤）', () => {
  it('「通す」と判断して実際に通るなら正解', () => {
    const r = judgeGateDecision({ postponeCount: 0, done: 0 }, postpone, true)
    expect(r.correct).toBe(true)
    expect(r.passes).toBe(true)
  })
  it('「通す」と判断したが不変条件違反なら不正解', () => {
    const r = judgeGateDecision({ postponeCount: 3, done: 0 }, postpone, true)
    expect(r.correct).toBe(false)
    expect(r.passes).toBe(false)
  })
  it('「拒否」と判断して実際に拒否されるなら正解', () => {
    const r = judgeGateDecision({ postponeCount: 3, done: 0 }, postpone, false)
    expect(r.correct).toBe(true)
  })
})
