import type { Chapter, InvariantGateStage, Stage } from '../game/types'
import { refVocab } from '../game/glossary'

// ============================================================
// 第1章 — ピザデリバリーの注文業務（MVP: 4ステージ）
//
// 設計方針（DESIGN.md）:
// - MODE1 は半順序制約で採点（唯一解を強制しない）
// - 難易度カーブ: 正常系 → ダミー混入 → 例外/外部システム混入
// - 最終ステージ(MODE2)で Event→Policy→Command の因果連鎖を1本組ませる
// - 色はカード種別から導出（ここでは kind のみ指定）
// ============================================================

export const STAGES: Stage[] = [
  // ---- Stage 1: タイムライン入門（正常系のみ）----
  {
    id: 'ch1-s1',
    mode: 'timeline',
    name: '注文から焼き上がりまで',
    icon: 'clock',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      'お客さんがピザを注文して支払いを済ませた。店は調理を始め、やがてピザが焼き上がった。',
    instruction: 'ドメインイベント（オレンジ・過去形）を時系列に並べよう',
    events: [
      { id: 's1-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's1-paid', kind: 'event', labelJa: '支払いが完了した' },
      { id: 's1-cooking', kind: 'event', labelJa: '調理が開始された' },
      { id: 's1-baked', kind: 'event', labelJa: 'ピザが焼き上がった' },
    ],
    distractors: [],
    orderConstraints: [
      ['s1-ordered', 's1-paid'],
      ['s1-paid', 's1-cooking'],
      ['s1-cooking', 's1-baked'],
    ],
    vocab: { id: 'v-event', ...refVocab('event') },
    reality: {
      short:
        '「注文確定」と「支払い完了」は必ず別イベント。現金後払いの業態では順序が入れ替わる。',
      long: 'だから時系列を付箋で見える化する価値がある。順序や粒度は文脈で変わり、その議論自体が現場の発見になる。',
    },
  },

  // ---- Stage 2: ダミーカード混入（コマンド/リードモデルを弾く）----
  {
    id: 'ch1-s2',
    mode: 'timeline',
    name: '配達まで通しで',
    icon: 'scooter',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '注文と支払いのあと、ピザが焼き上がると配達員が割り当てられ、無事に届けられた。ただし手札にはイベントでないカードが紛れている…！',
    instruction: 'イベントだけを時系列に。イベントでないカードは置けない！',
    events: [
      { id: 's2-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's2-paid', kind: 'event', labelJa: '支払いが完了した' },
      { id: 's2-baked', kind: 'event', labelJa: 'ピザが焼き上がった' },
      { id: 's2-assigned', kind: 'event', labelJa: '配達員が割り当てられた' },
      { id: 's2-delivered', kind: 'event', labelJa: '配達が完了した' },
    ],
    distractors: [
      {
        id: 's2-d-deliver',
        kind: 'command',
        labelJa: '配達する',
        isDistractor: true,
        reason:
          '「配達する」は置けません — それはコマンド（水色）。イベントは「配達された」のように過去に起きた事実です。',
      },
      {
        id: 's2-d-status',
        kind: 'readModel',
        labelJa: '注文状況画面',
        isDistractor: true,
        reason:
          '「注文状況画面」は置けません — それはリードモデル（緑）。意思決定のために見る画面であって、起きた事実ではありません。',
      },
    ],
    orderConstraints: [
      ['s2-ordered', 's2-paid'],
      ['s2-paid', 's2-baked'],
      ['s2-baked', 's2-assigned'],
      ['s2-assigned', 's2-delivered'],
    ],
    vocab: { id: 'v-command', ...refVocab('command') },
    reality: {
      short:
        'リードモデル（緑）はイベントの積み重ねから作られる「見るためのデータ」。',
      long: '業務の時間軸そのものには載らない。コマンド（青）は意図、イベント（オレンジ）は事実。時制で見分ける。',
    },
  },

  // ---- Stage 3: 例外フロー＋外部システム（裏の複雑さ体験）----
  {
    id: 'ch1-s3',
    mode: 'timeline',
    name: '配達が遅れた!?',
    icon: 'alert',
    modeLabel: 'MODE 1 例外フロー',
    scenario:
      'ピザは焼き上がり配達員も決まった。しかし決済確認の遅れと配達遅延が発生！ 店は顧客に補償クーポンを発行し、ピザはようやく届いた。単純そうな業務の裏に、外部システムと例外が潜む。',
    instruction: '例外フローも時系列に。イベントでないカードは弾こう',
    events: [
      { id: 's3-baked', kind: 'event', labelJa: 'ピザが焼き上がった' },
      { id: 's3-assigned', kind: 'event', labelJa: '配達員が割り当てられた' },
      { id: 's3-delayed', kind: 'event', labelJa: '配達が遅延した' },
      {
        id: 's3-coupon',
        kind: 'event',
        labelJa: '顧客に補償クーポンが発行された',
      },
      { id: 's3-delivered', kind: 'event', labelJa: '配達が完了した' },
    ],
    distractors: [
      {
        id: 's3-d-issue',
        kind: 'command',
        labelJa: 'クーポンを発行する',
        isDistractor: true,
        reason:
          '「クーポンを発行する」は置けません — それはコマンド（水色）。起きた事実なら「発行された」のはずです。',
      },
      {
        id: 's3-d-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        isDistractor: true,
        reason:
          '「決済ゲートウェイ」は置けません — それは外部システム（ピンク）。時間軸に並ぶ事実ではなく、イベントを起こす"外側の住人"です。',
      },
    ],
    orderConstraints: [
      ['s3-baked', 's3-assigned'],
      ['s3-assigned', 's3-delayed'],
      ['s3-delayed', 's3-coupon'],
      ['s3-coupon', 's3-delivered'],
    ],
    vocab: { id: 'v-readModel', ...refVocab('readModel') },
    reality: {
      short:
        '例外フロー（遅延・キャンセル・払い戻し）こそドメイン知識の宝庫。',
      long: 'EventStorming ではハッピーパスより例外系で Pain Point が見つかる。単純そうな業務にも外部システム連携と例外が大量に潜む——それに気づくことが本当の学び。',
    },
  },

  // ---- Stage 4: トリガー接続＋因果連鎖（MODE2 / EventStorming の本丸）----
  {
    id: 'ch1-s4',
    mode: 'trigger',
    name: '誰がトリガー？ そして因果の連鎖',
    icon: 'plug',
    modeLabel: 'MODE 2 トリガー接続',
    scenario:
      'コマンド（水色）は誰かが起こす。注文は顧客の意思、決済記録は外部システムのWebhook。そして「焼き上がった」という"事実"が、ポリシー（紫）を通じて次のコマンドを自動で呼ぶ——これがEventStormingの本丸だ。',
    instruction:
      '各コマンドに、それを起こすトリガーを1枚つなごう（Actor=黄 / Policy=紫 / External=ピンク）。孤立コマンド（起動経路の宙吊り）をゼロにせよ',
    vocab: { id: 'v-policy', ...refVocab('policy') },
    commands: [
      { id: 's4-c-order', kind: 'command', labelJa: '注文を確定する' },
      { id: 's4-c-pay', kind: 'command', labelJa: '支払いを記録する' },
      { id: 's4-c-assign', kind: 'command', labelJa: '配達員を割り当てる' },
    ],
    triggers: [
      {
        id: 's4-t-customer',
        kind: 'actor',
        labelJa: '顧客',
        labelEn: 'Customer',
      },
      {
        id: 's4-t-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        labelEn: 'Payment Gateway',
      },
      {
        id: 's4-t-policyBake',
        kind: 'policy',
        labelJa: '焼き上がったら配達を手配する',
        labelEn: 'When baked, arrange delivery',
      },
      {
        id: 's4-t-manager',
        kind: 'actor',
        labelJa: '店長',
        labelEn: 'Manager',
        reason:
          '店長が毎回手作業で割り当てるとピーク時に破綻します。「焼き上がったら〜する」の自動ルール（ポリシー）に任せられそう。',
      },
      {
        id: 's4-t-mapapi',
        kind: 'externalSystem',
        labelJa: '地図API',
        labelEn: 'Map API',
        reason:
          '地図APIは経路を教えてくれるだけ。割り当ての引き金にはなりません。',
      },
    ],
    validLinks: {
      's4-c-order': ['s4-t-customer'],
      's4-c-pay': ['s4-t-gateway'],
      's4-c-assign': ['s4-t-policyBake'],
    },
    chain: {
      eventId: 's3-baked',
      policyId: 's4-t-policyBake',
      commandId: 's4-c-assign',
      description:
        '「ピザが焼き上がった」(Event) → 「焼き上がったら配達を手配する」(Policy) → 「配達員を割り当てる」(Command)。事実がルールを通じて次の行動を自動で呼ぶ。これが Event → Policy → Command の因果連鎖。',
    },
    reality: {
      short:
        'Phase 8 の正しい不変条件は「孤立コマンドをゼロにする」。実際は1コマンドが複数経路で起動されうる。',
      long: '「ちょうど1つ」は学習用の足場。現実では人が手動でもポリシーからでも同じコマンドが起動する。本質は Event→Policy→Command の連鎖で、宙吊りのコマンド（誰も起こさない）がないこと。',
    },
  },

  // ============================================================
  // 第2章 — タスク管理ドメイン（集約と不変条件）
  //
  // 一次資料: 松岡『ドメイン駆動設計 サンプルコード&FAQ』
  //   - 7.2.2 Task.postpone: postponeCount >= MAX(3) で DomainException
  //   - 集約 = 不変条件を守る一貫性境界（5.2 / 5.3）
  // MODE3: 不変条件ゲート。「今この集約状態でコマンドは通るか」を判断させる。
  // ============================================================

  // ---- Stage 5: 集約とは何か（導入・全部通る正常系）----
  {
    id: 'ch2-s1',
    mode: 'invariant',
    name: '集約のしごと',
    icon: 'box',
    modeLabel: 'MODE 3 不変条件ゲート',
    scenario:
      'タスク管理アプリ。「タスク」は集約— 不変条件を守る一貫性の境界だ。コマンドは必ず集約を通り、集約がルールに照らして発行可否を決める。',
    instruction:
      '届いたコマンドは、今の集約の状態で不変条件を満たすか？ 満たすなら通し、破るなら弾く。',
    aggregateJa: 'タスク',
    initialState: { postponeCount: 0, done: 0 },
    aggregateVocab: { id: 'v-aggregate', ...refVocab('aggregate') },
    vocab: { id: 'v-aggregate', ...refVocab('aggregate') },
    steps: [
      {
        id: 'ch2-s1-start',
        labelJa: 'タスクに着手する',
        emitsEventJa: 'タスクに着手された',
        guards: [{ key: 'done', op: 'eq', value: 0 }],
        effects: {},
        rejectReason: '完了済みのタスクには着手できません。',
      },
      {
        id: 'ch2-s1-postpone',
        labelJa: 'タスクを延期する',
        emitsEventJa: 'タスクが延期された',
        guards: [
          { key: 'postponeCount', op: 'lt', value: 3 },
          { key: 'done', op: 'eq', value: 0 },
        ],
        effects: { postponeCount: 1 },
        rejectReason: '最大延期回数（3回）を超えています。',
      },
      {
        id: 'ch2-s1-complete',
        labelJa: 'タスクを完了する',
        emitsEventJa: 'タスクが完了した',
        guards: [{ key: 'done', op: 'eq', value: 0 }],
        effects: { done: 1 },
        rejectReason: '完了済みのタスクは再度完了できません。',
      },
    ],
    reality: {
      short:
        '集約は「データの入れ物」ではなく「ルールの番人」。コマンドは必ず集約を通り、集約がイベントの発行可否を決める。',
      long: 'DDDでは集約ルートのメソッド（create/postpone/complete…）以外から状態を変えられないようにする（private setter）。これにより、どんな経路でも不変条件が破られないことを保証する。',
    },
  },

  // ---- Stage 6: 不変条件で拒否される（最大延期回数）----
  {
    id: 'ch2-s2',
    mode: 'invariant',
    name: '延期は3回まで',
    icon: 'gate',
    modeLabel: 'MODE 3 不変条件ゲート',
    scenario:
      'タスクには「延期は最大3回まで」という不変条件がある。同じ「延期する」コマンドが届き続ける。集約の今の状態を見て、その都度どうなるか判断しよう。',
    instruction:
      '今の延期回数と不変条件を照らし合わせて、このコマンドを通すか弾くか決める。',
    aggregateJa: 'タスク',
    initialState: { postponeCount: 0, done: 0 },
    aggregateVocab: {
      id: 'v-invariant',
      ...refVocab('aggregateInvariant', 'aggregate'),
    },
    vocab: { id: 'v-invariant', ...refVocab('aggregateInvariant', 'aggregate') },
    steps: [
      {
        id: 'ch2-s2-p1',
        labelJa: 'タスクを延期する（1回目）',
        emitsEventJa: 'タスクが延期された',
        guards: [{ key: 'postponeCount', op: 'lt', value: 3 }],
        effects: { postponeCount: 1 },
        rejectReason: '最大延期回数（3回）を超えています。',
      },
      {
        id: 'ch2-s2-p2',
        labelJa: 'タスクを延期する（2回目）',
        emitsEventJa: 'タスクが延期された',
        guards: [{ key: 'postponeCount', op: 'lt', value: 3 }],
        effects: { postponeCount: 1 },
        rejectReason: '最大延期回数（3回）を超えています。',
      },
      {
        id: 'ch2-s2-p3',
        labelJa: 'タスクを延期する（3回目）',
        emitsEventJa: 'タスクが延期された',
        guards: [{ key: 'postponeCount', op: 'lt', value: 3 }],
        effects: { postponeCount: 1 },
        rejectReason: '最大延期回数（3回）を超えています。',
      },
      {
        id: 'ch2-s2-p4',
        labelJa: 'タスクを延期する（4回目）',
        emitsEventJa: 'タスクが延期された',
        guards: [{ key: 'postponeCount', op: 'lt', value: 3 }],
        effects: { postponeCount: 1 },
        rejectReason:
          '延期回数が3回に達しているため拒否されます（不変条件 postponeCount < 3 を破る）。',
      },
    ],
    reality: {
      short:
        '同じコマンドが状態によって通ったり拒否されたりする——これが「集約が不変条件を守る」の核心。',
      long: 'もしこのルールをUseCase層やDB制約に散らすと、抜け道ができて不整合が起きる。集約に閉じ込めるから「どこから呼んでも3回まで」が保証される（書籍7.2.2）。',
    },
  },

  // ---- Stage 7: 複数の不変条件（完了済みへの操作拒否）----
  {
    id: 'ch2-s3',
    mode: 'invariant',
    name: '完了したら、もう動かせない',
    icon: 'finish',
    modeLabel: 'MODE 3 不変条件ゲート',
    scenario:
      'タスクには複数の不変条件がある。延期回数の上限に加え、状態遷移 UNDONE→DONE が起きると許されるコマンドが変わる。状態を追いながら総仕上げ。',
    instruction:
      '今の状態（延期回数・完了したか）と不変条件を照らして、コマンドごとに通すか弾くか決める。',
    aggregateJa: 'タスク',
    initialState: { postponeCount: 1, done: 0 },
    aggregateVocab: {
      id: 'v-state-transition',
      ...refVocab('stateTransition', 'aggregate'),
    },
    vocab: { id: 'v-state-transition', ...refVocab('stateTransition', 'aggregate') },
    steps: [
      {
        id: 'ch2-s3-postpone',
        labelJa: 'タスクを延期する',
        emitsEventJa: 'タスクが延期された',
        guards: [
          { key: 'postponeCount', op: 'lt', value: 3 },
          { key: 'done', op: 'eq', value: 0 },
        ],
        effects: { postponeCount: 1 },
        rejectReason: '完了済み、または延期上限のため拒否されます。',
      },
      {
        id: 'ch2-s3-complete',
        labelJa: 'タスクを完了する',
        emitsEventJa: 'タスクが完了した',
        guards: [{ key: 'done', op: 'eq', value: 0 }],
        effects: { done: 1 },
        rejectReason: '完了済みのタスクは再度完了できません。',
      },
      {
        id: 'ch2-s3-postpone2',
        labelJa: 'タスクを延期する',
        emitsEventJa: 'タスクが延期された',
        guards: [
          { key: 'postponeCount', op: 'lt', value: 3 },
          { key: 'done', op: 'eq', value: 0 },
        ],
        effects: { postponeCount: 1 },
        rejectReason:
          '完了済み（done=1）のため拒否されます。状態遷移 DONE 後は延期できません。',
      },
      {
        id: 'ch2-s3-complete2',
        labelJa: 'タスクを完了する',
        emitsEventJa: 'タスクが完了した',
        guards: [{ key: 'done', op: 'eq', value: 0 }],
        effects: { done: 1 },
        rejectReason: '既に完了済み（done=1）のため拒否されます。',
      },
    ],
    reality: {
      short:
        '完了という状態遷移が、その後に許されるコマンドを変える。集約は「今どの状態か」で振る舞いを変える生き物。',
      long: 'EventStormingでこの集約を見つけたら、次はドメインモデル図で「タスク」集約の属性（postponeCount, status）と不変条件（吹き出し）を描く。ゲームで掴んだ感覚が、実際のモデリングにそのままつながる。',
    },
  },
]

// ============================================================
// 章（chapter）構成
// ============================================================
export const CHAPTERS: Chapter[] = [
  {
    id: 'ch1',
    title: '第1章 — ピザデリバリーの注文業務',
    icon: 'pizza',
    stageIds: ['ch1-s1', 'ch1-s2', 'ch1-s3', 'ch1-s4'],
  },
  {
    id: 'ch2',
    title: '第2章 — タスク管理ドメイン（集約と不変条件）',
    icon: 'checklist',
    stageIds: ['ch2-s1', 'ch2-s2', 'ch2-s3'],
  },
]

/** 型ガード: 不変条件ゲートステージか */
export function isInvariantStage(s: Stage): s is InvariantGateStage {
  return s.mode === 'invariant'
}

/** stageId から所属章を逆引きする（純粋関数）。 */
export function chapterOf(stageId: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.stageIds.includes(stageId))
}

/** その stage が所属章の最後のステージか（章クリア判定に使う・純粋関数）。 */
export function isChapterLastStage(stageId: string): boolean {
  const c = chapterOf(stageId)
  return c != null && c.stageIds[c.stageIds.length - 1] === stageId
}
