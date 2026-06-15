import type {
  AggregateCommand,
  AggregateState,
  InvariantGuard,
  OrderConstraint,
  ScoreInput,
  Stars,
  TimelineStage,
  TriggerStage,
} from './types'

/**
 * MODE1 タイムラインの採点。
 * 半順序で判定する：全順序の一致ではなく、orderConstraints（前後関係の集合）を
 * すべて満たし、かつ「並べるべきイベントが過不足なく置かれている」かを見る。
 * これにより「並びには唯一の正解がある」という誤った心象を植え付けない。
 */
export interface TimelineCheck {
  /** スロットに置かれたカード id の並び（左→右） */
  placed: string[]
}

export interface TimelineResult {
  correct: boolean
  /** 置くべきイベントの集合と一致しているか */
  completeSet: boolean
  /** 違反している順序制約 */
  violatedConstraints: OrderConstraint[]
  /** ダミー（event以外）が混入しているか */
  hasDistractor: boolean
}

export function checkTimeline(
  stage: TimelineStage,
  input: TimelineCheck,
): TimelineResult {
  const expected = new Set(stage.events.map((e) => e.id))
  const distractorIds = new Set(stage.distractors.map((d) => d.id))

  const placedSet = new Set(input.placed)
  const hasDistractor = input.placed.some((id) => distractorIds.has(id))

  // 置くべきイベントが過不足なく置かれているか
  const completeSet =
    placedSet.size === expected.size &&
    [...expected].every((id) => placedSet.has(id)) &&
    !hasDistractor

  // 順序制約の検証（placed 内の index 比較）
  const indexOf = new Map(input.placed.map((id, i) => [id, i]))
  const violatedConstraints = stage.orderConstraints.filter(([before, after]) => {
    const bi = indexOf.get(before)
    const ai = indexOf.get(after)
    // どちらか未配置なら、その制約は「まだ判定不能」→未達として扱う
    if (bi === undefined || ai === undefined) return true
    return bi >= ai
  })

  const correct =
    completeSet && violatedConstraints.length === 0 && !hasDistractor

  return { correct, completeSet, violatedConstraints, hasDistractor }
}

/**
 * MODE2 トリガー接続の採点。
 * commandId -> 選んだ triggerId のマップを受け取り、validLinks に照らす。
 * 複数正解を許容する（許容集合に含まれていれば正解）。
 */
export interface TriggerResult {
  correct: boolean
  /** commandId -> その接続が正しいか */
  perCommand: Record<string, boolean>
}

export function checkTriggers(
  stage: TriggerStage,
  links: Record<string, string>,
): TriggerResult {
  const perCommand: Record<string, boolean> = {}
  for (const cmd of stage.commands) {
    const chosen = links[cmd.id]
    const valid = stage.validLinks[cmd.id] ?? []
    perCommand[cmd.id] = chosen !== undefined && valid.includes(chosen)
  }
  const correct =
    stage.commands.length > 0 &&
    Object.values(perCommand).every((ok) => ok)
  return { correct, perCommand }
}

/** 単一のトリガー接続が正しいかを判定（誤接続時に reason を出すため） */
export function isValidLink(
  stage: TriggerStage,
  commandId: string,
  triggerId: string,
): boolean {
  return (stage.validLinks[commandId] ?? []).includes(triggerId)
}

/**
 * 星評価。1=初クリア / 2=ヒント不使用でクリア / 3=ノーミス（かつヒント不使用）。
 */
export function scoreStars({ mistakes, usedHint }: ScoreInput): Stars {
  if (mistakes === 0 && !usedHint) return 3
  if (!usedHint) return 2
  return 1
}

// ============================================================
// MODE3 不変条件ゲート（第2章 / 集約と不変条件）
//
// DDD書籍7.2.2: 集約は不変条件（postponeCount >= 3 で拒否 等）を守る。
// 「コマンドが現在の集約状態で通るか」を判定し、通れば状態を更新する。
// ============================================================

/** 単一ガード（不変条件述語）の評価 */
function evalGuard(state: AggregateState, guard: InvariantGuard): boolean {
  const v = state[guard.key] ?? 0
  switch (guard.op) {
    case 'lt':
      return v < guard.value
    case 'lte':
      return v <= guard.value
    case 'gte':
      return v >= guard.value
    case 'eq':
      return v === guard.value
    default: {
      // 網羅性チェック: InvariantGuard に op の分岐漏れがあれば型エラーになる
      const _exhaustive: never = guard
      return _exhaustive
    }
  }
}

/**
 * 現在状態でコマンドが集約を通るか（全ガードを満たすか）。
 * これが「集約が不変条件を守る」の核。状態次第で同じコマンドが通ったり拒否されたりする。
 */
export function commandPasses(
  state: AggregateState,
  command: AggregateCommand,
): boolean {
  return command.guards.every((g) => evalGuard(state, g))
}

/**
 * コマンドを集約に適用して次の状態を返す（純粋）。
 * 通る場合のみ effects を反映。通らない場合は状態を変えない（イベント未発行）。
 */
export function applyCommand(
  state: AggregateState,
  command: AggregateCommand,
): { passed: boolean; next: AggregateState } {
  if (!commandPasses(state, command)) {
    return { passed: false, next: state }
  }
  const next: AggregateState = { ...state }
  for (const [key, delta] of Object.entries(command.effects)) {
    next[key] = (next[key] ?? 0) + delta
  }
  return { passed: true, next }
}

/**
 * プレイヤーの「このコマンドを通す/拒否する」という判断が正しいかを評価する。
 * decision=true（通すと判断）が commandPasses と一致すれば正解。
 */
export function judgeGateDecision(
  state: AggregateState,
  command: AggregateCommand,
  decision: boolean,
): { correct: boolean; passes: boolean } {
  const passes = commandPasses(state, command)
  return { correct: decision === passes, passes }
}
