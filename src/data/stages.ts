import type { Chapter, InvariantGateStage, Stage } from '../game/types'
import { refVocab } from '../game/glossary'

// ============================================================
// 第1章 — ピザデリバリーの注文業務（4ステージ）
//
// 設計方針（DESIGN.md）:
// - MODE1 は半順序制約で採点（唯一解を強制しない）
// - 難易度カーブ: 正常系 → ダミー混入 → 例外/外部システム混入
// - 章末の MODE2 で Event→Policy→Command の因果連鎖を1本組ませる
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
    instruction: 'ドメインイベント（オレンジ・過去形）を、古い順（上から）に時系列で並べよう',
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
      long: '業務の時間軸そのものには載らない。コマンド（水色）は意図、イベント（オレンジ）は事実。時制で見分ける。',
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
          '「決済ゲートウェイ」は置けません — それは外部システム（ピンク）。時間軸に並ぶ事実ではなく、イベントを起こす“外側の住人”です。',
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
      'コマンド（水色）は誰かが起こす。注文は顧客の意思、決済記録は外部システムのWebhook。そして「焼き上がった」という“事実”が、ポリシー（紫）を通じて次のコマンドを自動で呼ぶ——これがEventStormingの本丸だ。',
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
  //   - Task.postpone: postponeCount >= MAX(3) で拒否（不変条件）
  //   - 集約 = 不変条件を守る一貫性境界
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
      'タスク管理アプリ。「タスク」は集約——不変条件を守る一貫性の境界だ。コマンドは必ず集約を通り、集約がルールに照らして発行可否を決める。',
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
      long: 'もしこのルールをUseCase層やDB制約に散らすと、抜け道ができて不整合が起きる。集約に閉じ込めるから「どこから呼んでも3回まで」が保証される。',
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

  // ============================================================
  // 第3章 — サブスク課金ドメイン（集約をまたぐ整合性を“ドメインイベント”で繋ぐ）
  //
  // 第2章「単一集約の不変条件」の次に「複数集約の整合性は“ドメインイベント”で繋ぐ」へ。
  // 実装の勘所＝ある集約がイベントを発行し、ポリシーが別集約のコマンドを起こす。
  // 重要: 時間（更新日の到来）そのものはポリシーでない。「更新日が到来した」を外部の時計が
  // 起こした“事実（イベント）”として扱い、それに反応する「◯◯したら課金する」がポリシー。
  // 既存3モード（timeline/trigger）のみ＝エンジン改変ゼロ。
  // ============================================================

  // ---- Stage 8: 申し込みから初回課金まで（越境の“順番”を掴む・正常系）----
  {
    id: 'ch3-s1',
    mode: 'timeline',
    name: '申し込みから初回課金まで',
    icon: 'clock',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '顧客がプランに申し込み、サブスクリプションが開始した。やがて最初の更新日が到来し、それを受けて初回の課金が成立した。「顧客サブスク」集約での事実と、それに連なる「請求」集約の事実——2つの集約をまたいで事実（イベント）が流れる。',
    instruction: '2つの集約をまたぐ事実を時系列に。越境（集約をまたぐこと）の「順番」を掴もう',
    events: [
      {
        id: 's1-subscribed',
        kind: 'event',
        labelJa: 'サブスクリプションが開始された',
      },
      { id: 's1-renewal-due', kind: 'event', labelJa: '更新日が到来した' },
      { id: 's1-charged', kind: 'event', labelJa: '課金が成立した' },
      { id: 's1-receipt', kind: 'event', labelJa: '領収書が発行された' },
    ],
    distractors: [],
    orderConstraints: [
      ['s1-subscribed', 's1-renewal-due'],
      ['s1-renewal-due', 's1-charged'],
      ['s1-charged', 's1-receipt'],
    ],
    vocab: { id: 'v-cross-consistency', ...refVocab('crossAggregateConsistency', 'aggregate') },
    reality: {
      short:
        '「更新日が到来した」は時間が起こした“事実”。それを引き金に別集約（請求）の課金が走る——これが集約をまたぐ流れ。',
      long: '時間（更新日）そのものはポリシーでもコマンドでもない。スケジューラはあくまで「呼び出し元」で、ドメインに現れるのは「更新日が到来した」という事実（イベント）。それに反応する「更新日が来たら課金する」がポリシー。',
    },
  },

  // ---- Stage 9: 決済が失敗したら（越境の例外フロー）----
  {
    id: 'ch3-s2',
    mode: 'timeline',
    name: '決済が失敗したら',
    icon: 'alert',
    modeLabel: 'MODE 1 例外フロー',
    scenario:
      '更新日が到来して課金を試みたが、決済が失敗した。請求集約は支払いを延滞扱いにし、ポリシーが「顧客サブスク」集約へ猶予を効かせ、再試行の末に課金が成立した。単純な「更新→課金」の裏に、越境の例外フローが潜む。',
    instruction: '越境の例外フローも時系列に。イベントでないカードは弾こう',
    events: [
      { id: 's2-renewal-due', kind: 'event', labelJa: '更新日が到来した' },
      { id: 's2-charge-failed', kind: 'event', labelJa: '課金が失敗した' },
      {
        id: 's2-overdue',
        kind: 'event',
        labelJa: '支払いが延滞扱いになった',
      },
      {
        id: 's2-grace-granted',
        kind: 'event',
        labelJa: '猶予期間が付与された',
      },
      { id: 's2-charged', kind: 'event', labelJa: '課金が成立した' },
    ],
    distractors: [
      {
        id: 's2-d-charge',
        kind: 'command',
        labelJa: '課金する',
        isDistractor: true,
        reason:
          '「課金する」は置けません — それはコマンド（水色）。起きた事実なら「課金が成立した／失敗した」のはずです。',
      },
      {
        id: 's2-d-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        isDistractor: true,
        reason:
          '「決済ゲートウェイ」は置けません — それは外部システム（ピンク）。時間軸に並ぶ事実ではなく、結果を知らせてくる“外側の住人”です。',
      },
    ],
    orderConstraints: [
      ['s2-renewal-due', 's2-charge-failed'],
      ['s2-charge-failed', 's2-overdue'],
      ['s2-overdue', 's2-grace-granted'],
      ['s2-grace-granted', 's2-charged'],
    ],
    vocab: { id: 'v-cross-consistency-2', ...refVocab('crossAggregateConsistency', 'aggregate') },
    reality: {
      short:
        '越境の整合性は「失敗したら？」でこそ難しい。延滞・猶予・再試行が、2つの集約をイベントで往復しながら進む。',
      long: '請求集約の「課金が失敗した」というイベントに、「顧客サブスク」集約側のポリシー（猶予を付与する）が反応する。整合性をユースケースに直書きせず、イベント＋ポリシーで繋ぐから、どの経路から課金が走っても同じ例外処理が効く。',
    },
  },

  // ---- Stage 10: 越境の配線（Event→Policy→Command を別集約へ）----
  {
    id: 'ch3-s3',
    mode: 'trigger',
    name: '越境の配線：更新日が課金を呼ぶ',
    icon: 'plug',
    modeLabel: 'MODE 2 トリガー接続',
    scenario:
      'いよいよ越境の本丸。コマンドは誰かが起こす——解約は顧客の意思、入金記録は外部の決済ゲートウェイのWebhook。そして「更新日が到来した」という「顧客サブスク」集約の“事実”が、ポリシー（紫）を通じて別集約（請求）の「課金する」を自動で呼ぶ。これが集約をまたぐ Event→Policy→Command。',
    instruction:
      '各コマンドに、それを起こすトリガーを1枚つなごう（Actor=黄 / Policy=紫 / External=ピンク）。孤立コマンド（誰も起こさないコマンド）をゼロにせよ',
    vocab: { id: 'v-crossing', ...refVocab('crossingByDomainEvent', 'policy') },
    commands: [
      { id: 's3-c-charge', kind: 'command', labelJa: '課金する' },
      { id: 's3-c-record-payment', kind: 'command', labelJa: '入金を記録する' },
      {
        id: 's3-c-cancel',
        kind: 'command',
        labelJa: 'サブスクリプションを解約する',
      },
    ],
    triggers: [
      {
        id: 's3-t-policy-renewal',
        kind: 'policy',
        labelJa: '更新日が来たら課金する',
        labelEn: 'When renewal due, charge',
      },
      {
        id: 's3-t-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        labelEn: 'Payment Gateway',
      },
      {
        id: 's3-t-customer',
        kind: 'actor',
        labelJa: '顧客',
        labelEn: 'Customer',
      },
      {
        id: 's3-t-clock',
        kind: 'externalSystem',
        labelJa: 'スケジューラ',
        labelEn: 'Scheduler',
        reason:
          'スケジューラは「呼び出し元」で、課金を直接起こす引き金ではありません。ドメインに現れるのは「更新日が到来した」という事実で、それに反応する“ポリシー”が課金を呼びます。',
      },
      {
        id: 's3-t-admin',
        kind: 'actor',
        labelJa: '運用担当者',
        labelEn: 'Operator',
        reason:
          '運用担当者が毎月手で課金するとスケールしません。「更新日が来たら課金する」という自動ルール（ポリシー）に任せるのが越境の整合性。',
      },
    ],
    validLinks: {
      's3-c-charge': ['s3-t-policy-renewal'],
      's3-c-record-payment': ['s3-t-gateway'],
      's3-c-cancel': ['s3-t-customer'],
    },
    chain: {
      eventId: 's1-renewal-due',
      policyId: 's3-t-policy-renewal',
      commandId: 's3-c-charge',
      description:
        '「更新日が到来した」(Event・「顧客サブスク」集約) → 「更新日が来たら課金する」(Policy) → 「課金する」(Command・請求集約)。1つの集約の事実が、ポリシーを通じて別の集約のコマンドを呼ぶ。これが集約をまたぐ Event→Policy→Command の越境。',
    },
    reality: {
      short:
        '集約をまたぐ整合性は「イベント＋ポリシー」で繋ぐのが定石。時間トリガーも“事実”として扱えば記法は崩れない。',
      long: '整合性をユースケース（呼び出し元）に直書きすると、別経路から呼んだとき崩れる。ドメインイベントを発行し、ポリシーが別集約のコマンドを起こす形にすると、整合性がドメイン層に閉じて「どこから呼んでも守られる」。次はぜひ実ワークショップで、自分の業務の越境を付箋で繋いでみてください。',
    },
  },

  // ============================================================
  // 第4章 — 在庫と注文（補償トランザクション / Saga：失敗したら取り消す）
  //   注文集約 × 在庫集約 × 決済集約。成功系の越境(第3章)に「失敗フォーク」を足す。
  //   集約をまたぐロールバックは無い＝確定事実は消えず補償イベントを積む（結果整合性）。
  // ============================================================

  // ---- ch4-s1: 注文確定から出荷まで（正常系・越境の順番）----
  {
    id: 'ch4-s1',
    mode: 'timeline',
    name: '注文確定から出荷まで',
    icon: 'box',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '顧客が注文を確定した。在庫集約はその事実を受けて在庫を引き当て、引き当てが成功すると出荷準備が整い、商品が出荷された。注文集約の事実と在庫集約の事実が、2つの集約をまたいで連なる正常フロー。',
    instruction: '2つの集約をまたぐ事実を時系列に。越境の「順番」を掴もう',
    events: [
      { id: 's4a-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's4a-allocated', kind: 'event', labelJa: '在庫が引き当てられた' },
      { id: 's4a-ready', kind: 'event', labelJa: '出荷準備が完了した' },
      { id: 's4a-shipped', kind: 'event', labelJa: '商品が出荷された' },
    ],
    distractors: [],
    orderConstraints: [
      ['s4a-ordered', 's4a-allocated'],
      ['s4a-allocated', 's4a-ready'],
      ['s4a-ready', 's4a-shipped'],
    ],
    vocab: { id: 'v-cross-consistency-3', ...refVocab('crossAggregateConsistency', 'aggregate') },
    reality: {
      short:
        '「注文確定」と「在庫引き当て」は別集約の別イベント。確定は注文集約、引き当ては在庫集約が決める。',
      long: '2つの集約を1トランザクションで更新するか分けるかは設計判断。同じトランザクションに収めればロールバックも効く。分けて結果整合性を選んだとき、注文の事実に在庫が反応する＝イベント＋ポリシーで繋ぐ。次のステージで「失敗したら？」を見る。',
    },
  },

  // ---- ch4-s2: 在庫が足りなかったら（補償フロー）----
  {
    id: 'ch4-s2',
    mode: 'timeline',
    name: '在庫が足りなかったら',
    icon: 'alert',
    modeLabel: 'MODE 1 補償フロー',
    scenario:
      '注文が確定し在庫の引き当てを試みたが、在庫が不足して引き当てに失敗した。確定済みの注文は「なかったこと」にはできない——打ち消す新しい事実として注文が取り消され、顧客に在庫切れが通知された。失敗の波及を時系列で掴む。',
    instruction: '失敗とその補償も時系列に。イベントでないカードは弾こう',
    events: [
      { id: 's4b-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's4b-failed', kind: 'event', labelJa: '在庫の引き当てに失敗した' },
      { id: 's4b-cancelled', kind: 'event', labelJa: '注文が取り消された' },
      { id: 's4b-notified', kind: 'event', labelJa: '在庫切れが顧客に通知された' },
    ],
    distractors: [
      {
        id: 's4b-d-cancel',
        kind: 'command',
        labelJa: '注文を取り消す',
        isDistractor: true,
        reason:
          '「注文を取り消す」は置けません — それはコマンド（水色）。起きた事実なら「取り消された」のはずです。',
      },
      {
        id: 's4b-d-system',
        kind: 'externalSystem',
        labelJa: '在庫管理システム',
        isDistractor: true,
        reason:
          '「在庫管理システム」は置けません — それは外部システム（ピンク）。時間軸に並ぶ事実ではなく、外側の住人です。',
      },
    ],
    orderConstraints: [
      ['s4b-ordered', 's4b-failed'],
      ['s4b-failed', 's4b-cancelled'],
      ['s4b-cancelled', 's4b-notified'],
    ],
    vocab: { id: 'v-compensating', ...refVocab('compensatingTransaction', 'event') },
    reality: {
      short:
        '集約を分けて結果整合性を選ぶと、またいだロールバックは使えない。確定した事実は消えず、「取り消された」という打ち消す事実（補償イベント）を積む。',
      long: 'これが結果整合性。在庫集約の「引き当てに失敗した」という失敗イベントに、注文集約側の補償ポリシーが反応して「注文を取り消す」。同じトランザクションに収めればロールバックできるが、集約・サービスを分散させたから補償が要る——失敗を事実として扱い補償で整えるのが定石（Saga）。',
    },
  },

  // ---- ch4-s3: 補償が連鎖する（決済も巻き戻す）----
  {
    id: 'ch4-s3',
    mode: 'timeline',
    name: '補償が連鎖する',
    icon: 'back',
    modeLabel: 'MODE 1 補償フロー',
    scenario:
      '注文が確定し決済も成立したが、その後の在庫引き当てに失敗。すでに成立した決済も打ち消す必要がある。注文取消→返金という補償の連鎖が、3つの集約（注文・在庫・決済）をまたいで走る。長い補償フローを時系列で再構成する。',
    instruction: '補償の連鎖を時系列に。イベントでないカードは弾こう',
    events: [
      { id: 's4c-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's4c-paid', kind: 'event', labelJa: '決済が成立した' },
      { id: 's4c-failed', kind: 'event', labelJa: '在庫の引き当てに失敗した' },
      { id: 's4c-cancelled', kind: 'event', labelJa: '注文が取り消された' },
      { id: 's4c-refunded', kind: 'event', labelJa: '返金が完了した' },
    ],
    distractors: [
      {
        id: 's4c-d-refund',
        kind: 'command',
        labelJa: '返金する',
        isDistractor: true,
        reason:
          '「返金する」は置けません — それはコマンド（水色・意図）。起きた事実なら「返金が完了した」です。',
      },
      {
        id: 's4c-d-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        isDistractor: true,
        reason:
          '「決済ゲートウェイ」は置けません — それは外部システム（ピンク）。外側の住人で、時間軸の事実ではありません。',
      },
    ],
    orderConstraints: [
      ['s4c-ordered', 's4c-paid'],
      ['s4c-paid', 's4c-failed'],
      ['s4c-failed', 's4c-cancelled'],
      ['s4c-cancelled', 's4c-refunded'],
    ],
    vocab: { id: 'v-eventual', ...refVocab('eventualConsistency', 'aggregate') },
    reality: {
      short:
        '補償は1段とは限らない。成立済みの事実を順に打ち消す（決済→返金）連鎖になる。',
      long: 'Saga は「どこまで進んだか」を覚えていて、失敗地点から実行済みの操作を打ち消していく（多くは逆順）。EventStorming でこの長い補償フローを付箋で可視化すると、現場の「失敗時にどこまで巻き戻すか」という Pain Point が露わになる。',
    },
  },

  // ---- ch4-s4: 補償の配線（失敗が取消を呼ぶ・trigger）----
  {
    id: 'ch4-s4',
    mode: 'trigger',
    name: '補償の配線：失敗が取消を呼ぶ',
    icon: 'plug',
    modeLabel: 'MODE 2 トリガー接続',
    scenario:
      '補償の本丸。コマンドは誰かが起こす——注文確定は顧客の意思、入荷記録は外部の倉庫システムのWebhook。そして「在庫の引き当てに失敗した」という在庫集約の“事実”が、補償ポリシー（紫）を通じて注文集約の「注文を取り消す」を自動で呼ぶ。これが失敗フォークの Event→Policy→Command。',
    instruction:
      '各コマンドに、それを起こすトリガーを1枚つなごう（Actor=黄 / Policy=紫 / External=ピンク）。孤立コマンド（誰も起こさないコマンド）をゼロにせよ',
    vocab: { id: 'v-saga', ...refVocab('saga', 'policy') },
    commands: [
      { id: 's4d-c-order', kind: 'command', labelJa: '注文を確定する' },
      { id: 's4d-c-receive', kind: 'command', labelJa: '入荷を記録する' },
      { id: 's4d-c-cancel', kind: 'command', labelJa: '注文を取り消す' },
    ],
    triggers: [
      {
        id: 's4d-t-customer',
        kind: 'actor',
        labelJa: '顧客',
        labelEn: 'Customer',
      },
      {
        id: 's4d-t-warehouse',
        kind: 'externalSystem',
        labelJa: '倉庫システム',
        labelEn: 'Warehouse System',
      },
      {
        id: 's4d-t-policy-comp',
        kind: 'policy',
        labelJa: '引き当てに失敗したら注文を取り消す',
        labelEn: 'When allocation fails, cancel order',
      },
      {
        id: 's4d-t-operator',
        kind: 'actor',
        labelJa: '運用担当者',
        labelEn: 'Operator',
        reason:
          '毎回手で取り消すとスケールしません。失敗イベントに反応する補償ポリシーに任せるのが結果整合性。',
      },
      {
        id: 's4d-t-invsys',
        kind: 'externalSystem',
        labelJa: '在庫管理システム',
        labelEn: 'Inventory System',
        reason:
          '在庫数を教えるだけで、取消の引き金ではありません。引き金は「引き当てに失敗した」という事実とそれに反応するポリシーです。',
      },
    ],
    validLinks: {
      's4d-c-order': ['s4d-t-customer'],
      's4d-c-receive': ['s4d-t-warehouse'],
      's4d-c-cancel': ['s4d-t-policy-comp'],
    },
    chain: {
      eventId: 's4b-failed',
      policyId: 's4d-t-policy-comp',
      commandId: 's4d-c-cancel',
      description:
        '「在庫の引き当てに失敗した」(Event・在庫集約) → 「引き当てに失敗したら注文を取り消す」(Policy) → 「注文を取り消す」(Command・注文集約)。失敗の事実が補償ポリシーを通じて別集約の取消コマンドを呼ぶ。これが補償の Event→Policy→Command。',
    },
    reality: {
      short:
        '補償も整合性は「失敗イベント＋補償ポリシー」で繋ぐ。取消を誰も起こさないと巻き戻らない（孤立コマンドをゼロに）。',
      long: '補償をユースケースに直書きすると、別経路で失敗したとき巻き戻し漏れが出る。失敗をドメインイベントとして発行し補償ポリシーが反応する形にすれば、どこから失敗しても同じ補償が走る。これが Saga の勘所。次はぜひ実ワークショップで、自分の業務の失敗系を補償イベントとして繋いでみてください。',
    },
  },

  // ============================================================
  // 第5章 — イベント粒度・時制の落とし穴（Phase 2 Event Identification の陥穽）
  //   題材は平易（カフェ）に、論点は記法そのもの。時制の誤り／粒度のブレを弁別する。
  // ============================================================

  // ---- ch5-s1: 時制（"した" と "する"）----
  {
    id: 'ch5-s1',
    mode: 'timeline',
    name: '“した” と “する” を見分ける',
    icon: 'alert',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      'カフェの注文業務をイベントで並べる。手札には“事実（過去形）”に化けた“意図（現在形）”が紛れている。現在形は「これからやること」＝コマンドであって、起きた事実ではない。時制でだけ見分けよう。',
    instruction: '過去形の事実だけを時系列に。現在形（意図＝コマンド）は弾こう',
    events: [
      { id: 's5a-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's5a-paid', kind: 'event', labelJa: '代金が支払われた' },
      { id: 's5a-served', kind: 'event', labelJa: 'ドリンクが提供された' },
    ],
    distractors: [
      {
        id: 's5a-d-pay',
        kind: 'command',
        labelJa: '代金を支払う',
        isDistractor: true,
        reason:
          '現在形は意図＝コマンド（水色）です。起きた事実なら「支払われた」のはずです。',
      },
      {
        id: 's5a-d-serve',
        kind: 'command',
        labelJa: 'ドリンクを提供する',
        isDistractor: true,
        reason:
          '現在形は意図＝コマンド（水色）です。起きた事実なら「提供された」のはずです。',
      },
    ],
    orderConstraints: [
      ['s5a-ordered', 's5a-paid'],
      ['s5a-paid', 's5a-served'],
    ],
    vocab: { id: 'v-wrong-tense', ...refVocab('wrongTense', 'command') },
    reality: {
      short:
        '過去形か現在形かだけで、イベントかコマンドかが決まる。迷ったら「もう起きた？／これからやる？」。',
      long: 'ワークショップで一番よく出る事故が、コマンドを過去形に直し忘れて時間軸に混ぜること。付箋を声に出して読み、「〜した／された」で終わらないものは時間軸から外す——これだけで議論が締まる。',
    },
  },

  // ---- ch5-s2: 粒度（粗すぎ・細かすぎ）----
  {
    id: 'ch5-s2',
    mode: 'timeline',
    name: '粗すぎ・細かすぎ',
    icon: 'alert',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '同じ業務でも、付箋の“粒度”がバラバラだと時間軸が読めない。粗すぎる要約も、テクニカルすぎる操作ログも、ドメインイベントの時間軸には載らない。ドメインの言葉で、業務として意味のある粒度のイベントだけを並べよう。',
    instruction: 'ドメイン粒度の事実だけを時系列に。粗すぎ・テクニカルすぎは弾こう',
    events: [
      { id: 's5b-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's5b-allocated', kind: 'event', labelJa: '在庫から商品が引き当てられた' },
      { id: 's5b-shipped', kind: 'event', labelJa: '商品が発送された' },
      { id: 's5b-delivered', kind: 'event', labelJa: '配達が完了した' },
    ],
    distractors: [
      {
        id: 's5b-d-coarse',
        kind: 'command',
        labelJa: '注文を処理する',
        isDistractor: true,
        reason:
          '粗すぎる「処理する」は何が起きたか曖昧で、現在形＝意図＝コマンド（水色）。業務として意味のある事実に分解しましょう。',
      },
      {
        id: 's5b-d-tech',
        kind: 'externalSystem',
        labelJa: '注文レコードがINSERTされた',
        isDistractor: true,
        reason:
          'DB操作はテクニカルな実装事象（外部の仕組み＝ピンク）。ドメインの事実ではありません。',
      },
      {
        id: 's5b-d-ui',
        kind: 'command',
        labelJa: '購入ボタンをクリックする',
        isDistractor: true,
        reason:
          'クリックは顧客の操作＝意図＝コマンド（水色）。ドメインの事実は「注文が確定した」です。',
      },
    ],
    orderConstraints: [
      ['s5b-ordered', 's5b-allocated'],
      ['s5b-allocated', 's5b-shipped'],
      ['s5b-shipped', 's5b-delivered'],
    ],
    vocab: { id: 'v-granularity', ...refVocab('granularityDrift', 'event') },
    reality: {
      short:
        'ドメインイベントは「業務として意味のある粒度」。DB操作やUIクリックは細かすぎ、「処理された」は粗すぎ。',
      long: '粒度は文脈で変わり、その議論こそ発見。本章は“唯一の正解粒度がある”とは言わない——「この場の業務にとって意味があるか」を問う目を養う。実ワークショップでは「それはドメインの言葉？ 実装の言葉？」が合言葉。',
    },
  },

  // ---- ch5-s3: 総仕上げ（時制も粒度も外す）----
  {
    id: 'ch5-s3',
    mode: 'timeline',
    name: '総仕上げ：時制も粒度も外す',
    icon: 'target',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '本章の総仕上げ。時制の誤り（意図の混入）と粒度のブレ（テクニカル/過細）が同時に紛れる。ドメインの言葉で、過去に起きた事実だけを、業務として意味のある粒度で並べきろう。',
    instruction: '過去形・ドメイン粒度の事実だけを時系列に。3種の落とし穴を弾こう',
    events: [
      { id: 's5c-reserved', kind: 'event', labelJa: '予約が確定した' },
      { id: 's5c-arrived', kind: 'event', labelJa: '来店が記録された' },
      { id: 's5c-served', kind: 'event', labelJa: '飲食が提供された' },
      { id: 's5c-paid', kind: 'event', labelJa: '会計が完了した' },
    ],
    distractors: [
      {
        id: 's5c-d-pay',
        kind: 'command',
        labelJa: '会計する',
        isDistractor: true,
        reason: '現在形＝意図＝コマンド（水色）。事実なら「会計が完了した」です。',
      },
      {
        id: 's5c-d-tech',
        kind: 'externalSystem',
        labelJa: 'POSにトランザクションが記録された',
        isDistractor: true,
        reason:
          'テクニカルな実装事象（外部の仕組み＝ピンク）で、ドメインの事実ではありません。',
      },
      {
        id: 's5c-d-screen',
        kind: 'readModel',
        labelJa: 'お客様情報画面',
        isDistractor: true,
        reason:
          '意思決定のために見る画面（リードモデル＝緑）で、時間軸に並ぶ事実ではありません。',
      },
    ],
    orderConstraints: [
      ['s5c-reserved', 's5c-arrived'],
      ['s5c-arrived', 's5c-served'],
      ['s5c-served', 's5c-paid'],
    ],
    vocab: { id: 'v-technical-event', ...refVocab('technicalEvent', 'externalSystem') },
    reality: {
      short:
        '時制・粒度・種別の3つを同時に外せれば、Phase 2 Event Identification は卒業。',
      long: 'EventStorming Phase 2 で時間が溶けるのは、たいていこの3つの混入が原因。「過去形か」「ドメインの言葉か」「業務として意味のある粒度か」の3問を毎回唱えるだけで、付箋の質が跳ね上がる。次は実ワークショップで、自分の業務の付箋をこの3問でレビューしてみよう。',
    },
  },

  // ============================================================
  // 第6章 — リードモデル / CQRS（イベントから読み取りモデルが導かれる）
  //   緑カードの実演。trigger モードを読み替え: スロット=リードモデル、トレイ=事実。
  //   軽量クエリモデルの範囲（厳密 CQRS/イベントソーシングは扱わない）。
  // ============================================================

  // ---- ch6-s1: この画面はどの事実でできている？----
  {
    id: 'ch6-s1',
    mode: 'trigger',
    name: 'この画面は、どの事実でできている？',
    icon: 'readModel',
    modeLabel: 'MODE 2 リードモデル',
    scenario:
      '顧客の「注文状況画面」は魔法で出てくるのではない。注文や配送の“事実（イベント）”が積み重なって、見るための画面（リードモデル・緑）になる。各リードモデルに、それを更新する事実をつなごう。',
    instruction:
      '各リードモデル（緑）に、それを更新する事実（イベント）をつなごう。意図や外部システムは弾く',
    vocab: { id: 'v-readmodel-derive', ...refVocab('readModel') },
    commands: [
      { id: 's6a-rm-order', kind: 'readModel', labelJa: '注文状況画面' },
      { id: 's6a-rm-track', kind: 'readModel', labelJa: '配送追跡画面' },
    ],
    triggers: [
      { id: 's6a-e-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's6a-e-shipped', kind: 'event', labelJa: '商品が発送された' },
      { id: 's6a-e-delivered', kind: 'event', labelJa: '配達が完了した' },
      {
        id: 's6a-d-order',
        kind: 'command',
        labelJa: '注文を確定する',
        reason:
          'コマンド（水色・意図）です。リードモデルは“起きた事実”の積み重ねから作られ、意図そのものは載りません。',
      },
      {
        id: 's6a-d-gateway',
        kind: 'externalSystem',
        labelJa: '決済ゲートウェイ',
        reason:
          '外部システム（ピンク）は事実を起こす側で、画面の構成要素ではありません。',
      },
    ],
    validLinks: {
      's6a-rm-order': ['s6a-e-ordered', 's6a-e-shipped', 's6a-e-delivered'],
      's6a-rm-track': ['s6a-e-shipped', 's6a-e-delivered'],
    },
    reality: {
      short:
        'リードモデルは事実の積み重ねから導かれる“見るためのデータ”。集約（更新用）とは別物。',
      long: 'これを軽量CQRS（クエリモデル）と呼ぶ。表示用に“集約”を作るのは定義違反——参照用モデルとして分ける。EventStorming の付箋では緑は事実（イベント）から養われると描く。実装では複数集約を join して作ることが多い（イベントを溜めて投影するイベントソーシングは本ゲームの範囲外）。',
    },
  },

  // ---- ch6-s2: 1つの事実が複数の画面を更新する ----
  {
    id: 'ch6-s2',
    mode: 'trigger',
    name: '1つの事実が、複数の画面を更新する',
    icon: 'readModel',
    modeLabel: 'MODE 2 リードモデル',
    scenario:
      '「商品が発送された」という1つの事実は、顧客の追跡画面も、倉庫の在庫ダッシュボードも更新する。事実は1つでも、それを見たい人・画面は複数。複数のリードモデルに、それを養う事実をつなごう。',
    instruction:
      '各リードモデル（緑）に、それを養う事実（イベント）をつなごう。1つの事実が複数画面を更新してよい',
    vocab: { id: 'v-lightweight-query', ...refVocab('lightweightQueryModel', 'readModel') },
    commands: [
      { id: 's6b-rm-inv', kind: 'readModel', labelJa: '在庫ダッシュボード' },
      { id: 's6b-rm-sales', kind: 'readModel', labelJa: '受注状況ダッシュボード' },
      { id: 's6b-rm-track', kind: 'readModel', labelJa: '配送追跡画面' },
    ],
    triggers: [
      { id: 's6b-e-allocated', kind: 'event', labelJa: '在庫が引き当てられた' },
      { id: 's6b-e-shipped', kind: 'event', labelJa: '商品が発送された' },
      { id: 's6b-e-ordered', kind: 'event', labelJa: '注文が確定した' },
      {
        id: 's6b-d-system',
        kind: 'externalSystem',
        labelJa: '在庫管理システム',
        reason:
          '外側のシステム（ピンク）で、画面を構成する“事実”ではありません。',
      },
      {
        id: 's6b-d-allocate',
        kind: 'command',
        labelJa: '在庫を引き当てる',
        reason:
          '意図＝コマンド（水色）です。リードモデルは起きた事実から作ります。',
      },
    ],
    validLinks: {
      's6b-rm-inv': ['s6b-e-allocated', 's6b-e-shipped'],
      's6b-rm-sales': ['s6b-e-ordered'],
      's6b-rm-track': ['s6b-e-shipped'],
    },
    reality: {
      short:
        '事実は1つでも、それを見たい画面は複数。だからリードモデルは「どの画面が、どの事実を必要とするか」で設計する。',
      long: '「参照系を全てクエリモデルにする必要はない」——必要なところだけ。EventStorming では緑の付箋を最後にまとめて貼り、「この事実を見て誰が何を判断するか」を問うと、抜けていた画面要件が出てくる。',
    },
  },

  // ---- ch6-s3: リードモデルは集約ではない（更新と参照を分ける）----
  {
    id: 'ch6-s3',
    mode: 'trigger',
    name: 'リードモデルは集約ではない',
    icon: 'readModel',
    modeLabel: 'MODE 2 リードモデル',
    scenario:
      '総仕上げ。コマンドは集約を更新し（水色→集約）、リードモデルは事実から導かれる（緑←イベント）。更新用モデル（集約）と参照用モデル（リードモデル）は別物だ。事実とリードモデルの導出関係を最後に締めくくる。',
    instruction:
      '各リードモデル（緑）に、それを導く事実（イベント）をつなごう。集約や意図は弾く',
    vocab: { id: 'v-cqrs', ...refVocab('cqrs', 'readModel') },
    commands: [
      { id: 's6c-rm-mypage', kind: 'readModel', labelJa: '顧客マイページ' },
      { id: 's6c-rm-admin', kind: 'readModel', labelJa: '管理者の注文一覧' },
    ],
    triggers: [
      { id: 's6c-e-ordered', kind: 'event', labelJa: '注文が確定した' },
      { id: 's6c-e-refunded', kind: 'event', labelJa: '返金が完了した' },
      { id: 's6c-e-delivered', kind: 'event', labelJa: '配達が完了した' },
      {
        id: 's6c-d-aggregate',
        kind: 'aggregate',
        labelJa: '注文',
        reason:
          '集約（淡黄）は“更新用モデル”。リードモデルは集約そのものではなく、集約が出した事実から導かれる別物です。',
      },
      {
        id: 's6c-d-order',
        kind: 'command',
        labelJa: '注文を確定する',
        reason:
          '意図＝コマンド（水色）で、事実ではありません。',
      },
    ],
    validLinks: {
      's6c-rm-mypage': ['s6c-e-ordered', 's6c-e-delivered', 's6c-e-refunded'],
      's6c-rm-admin': ['s6c-e-ordered', 's6c-e-refunded'],
    },
    reality: {
      short:
        '更新（コマンド→集約）と参照（イベント→リードモデル）は別の道。同じ“注文”でも、更新する集約と見るためのリードモデルは別物。',
      long: '「集約は必ずまとめて更新するまとまり。表示用の集約は定義違反」。リードモデルは複数集約をまたいで join して導く参照専用モデル。次は実ワークショップで、自分の業務の画面要件を緑の付箋で“どの事実から導かれるか”として並べてみよう。',
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
  {
    id: 'ch3',
    title: '第3章 — サブスク課金ドメイン（集約をまたぐ整合性）',
    icon: 'clock',
    stageIds: ['ch3-s1', 'ch3-s2', 'ch3-s3'],
  },
  {
    id: 'ch4',
    title: '第4章 — 在庫と注文（補償トランザクション / Saga）',
    icon: 'box',
    stageIds: ['ch4-s1', 'ch4-s2', 'ch4-s3', 'ch4-s4'],
  },
  {
    id: 'ch5',
    title: '第5章 — イベント粒度・時制の落とし穴',
    icon: 'alert',
    stageIds: ['ch5-s1', 'ch5-s2', 'ch5-s3'],
  },
  {
    id: 'ch6',
    title: '第6章 — リードモデル / CQRS',
    icon: 'readModel',
    stageIds: ['ch6-s1', 'ch6-s2', 'ch6-s3'],
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
