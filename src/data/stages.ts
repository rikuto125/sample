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

  // ============================================================
  // 第3章 — サブスク課金ドメイン（集約をまたぐ整合性を“ドメインイベント”で繋ぐ）
  //
  // 第2章「単一集約の不変条件」の次に「複数集約の整合性は“ドメインイベント”で繋ぐ」へ。
  // DDD-FAQ §5.1.4 実装方法3＝ある集約がイベントを発行し、ポリシーが別集約のコマンドを起こす。
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
      '顧客がプランに申し込み、サブスクリプションが開始した。やがて最初の更新日が到来し、それを受けて初回の課金が成立した。「顧客サブスクリプション」集約での出来事と、それに連なる「請求」集約の出来事——2つの集約をまたいで事実が流れる。',
    instruction: '2つの集約をまたぐ事実を時系列に。越境の「順番」を掴もう',
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
      '更新日が到来して課金を試みたが、決済が失敗した。請求集約は支払いを延滞扱いにし、ポリシーが顧客サブスク集約へ猶予を効かせ、再試行の末に課金が成立した。単純な「更新→課金」の裏に、越境の例外フローが潜む。',
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
        labelJa: '決済代行サービス',
        isDistractor: true,
        reason:
          '「決済代行サービス」は置けません — それは外部システム（ピンク）。時間軸に並ぶ事実ではなく、結果を知らせてくる"外側の住人"です。',
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
      long: '請求集約の「課金が失敗した」というイベントに、顧客サブスク集約側のポリシー（猶予を付与する）が反応する。整合性をユースケースに直書きせず、イベント＋ポリシーで繋ぐから、どの経路から課金が走っても同じ例外処理が効く。',
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
      'いよいよ越境の本丸。コマンドは誰かが起こす——解約は顧客の意思、入金記録は外部の決済代行のWebhook。そして「更新日が到来した」という顧客サブスク集約の“事実”が、ポリシー（紫）を通じて別集約（請求）の「課金する」を自動で呼ぶ。これが集約をまたぐ Event→Policy→Command。',
    instruction:
      '各コマンドに、それを起こすトリガーを1枚つなごう（Actor=黄 / Policy=紫 / External=ピンク）。孤立コマンドをゼロにせよ',
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
        labelJa: '決済代行サービス',
        labelEn: 'Payment Provider',
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
        '「更新日が到来した」(Event・顧客サブスク集約) → 「更新日が来たら課金する」(Policy) → 「課金する」(Command・請求集約)。1つの集約の事実が、ポリシーを通じて別の集約のコマンドを呼ぶ。これが集約をまたぐ Event→Policy→Command の越境。',
    },
    reality: {
      short:
        '集約をまたぐ整合性は「イベント＋ポリシー」で繋ぐのが定石。時間トリガーも“事実”として扱えば記法は崩れない。',
      long: '整合性をユースケース（呼び出し元）に直書きすると、別経路から呼んだとき崩れる。ドメインイベントを発行し、ポリシーが別集約のコマンドを起こす形にすると、整合性がドメイン層に閉じて「どこから呼んでも守られる」。次はぜひ実ワークショップで、自分の業務の越境を付箋で繋いでみてください。',
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
