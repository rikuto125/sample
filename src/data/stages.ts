import type { Stage } from '../game/types'

// ============================================================
// 第1章 — 🍕 ピザデリバリーの注文業務（MVP: 4ステージ）
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
    icon: '🕰️',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '📜 お客さんがピザを注文して支払いを済ませた。店は調理を始め、やがてピザが焼き上がった。',
    instruction: '⏱️ ドメインイベント（オレンジ・過去形）を時系列に並べよう',
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
    vocab: {
      id: 'v-event',
      ja: 'ドメインイベント',
      en: 'Domain Event',
      kind: 'event',
      def: 'ビジネス上で「過去に起きた事実」。必ず過去形（〜した／〜された）で書く。',
    },
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
    icon: '🛵',
    modeLabel: 'MODE 1 タイムライン',
    scenario:
      '📜 注文と支払いのあと、ピザが焼き上がると配達員が割り当てられ、無事に届けられた。ただし手札にはイベントでないカードが紛れている…！',
    instruction: '⏱️ イベントだけを時系列に。イベントでないカードは置けない！',
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
    vocab: {
      id: 'v-command',
      ja: 'コマンド',
      en: 'Command',
      kind: 'command',
      def: 'システムへの指示・意図。「〜する」と現在形。イベント（事実）とは時制で見分ける。',
    },
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
    icon: '⚠️',
    modeLabel: 'MODE 1 例外フロー',
    scenario:
      '📜 ピザは焼き上がり配達員も決まった。しかし決済確認の遅れと配達遅延が発生！ 店は顧客に補償クーポンを発行し、ピザはようやく届いた。単純そうな業務の裏に、外部システムと例外が潜む。',
    instruction: '⏱️ 例外フローも時系列に。イベントでないカードは弾こう',
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
    vocab: {
      id: 'v-readModel',
      ja: 'リードモデル',
      en: 'Read Model',
      kind: 'readModel',
      def: '人が意思決定するために参照する情報のかたまり（画面・一覧など）。イベントから導かれる。',
    },
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
    icon: '🔌',
    modeLabel: 'MODE 2 トリガー接続',
    scenario:
      '📜 コマンド（水色）は誰かが起こす。注文は顧客の意思、決済記録は外部システムのWebhook。そして「焼き上がった」という"事実"が、ポリシー（紫）を通じて次のコマンドを自動で呼ぶ——これがEventStormingの本丸だ。',
    instruction:
      '🔌 各コマンドに、それを起こすトリガーを1枚つなごう（Actor=黄 / Policy=紫 / External=ピンク）。孤立コマンド（起動経路の宙吊り）をゼロにせよ',
    vocab: {
      id: 'v-policy',
      ja: 'ポリシー',
      en: 'Policy',
      kind: 'policy',
      def: '「◯◯したら、△△する」— イベントに反応して次のコマンドを自動で起こすルール。',
    },
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
]
