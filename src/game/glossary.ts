import type { CardKind, GlossaryEntry, VocabEntry } from './types'

/**
 * 用語定義の単一ソース（プレイ中の軽量ヒント用）。
 *
 * 一次資料は CONTEXT.md。これはそのコード内の写しであり、CONTEXT.md が「正」。
 * 文言がズレたら CONTEXT.md に合わせる（用語追加は CONTEXT.md → ここ の順）。
 *
 * キーは CardKind ではなく用語 id にする。理由: 記法カードの kind 'aggregate' に
 * 「集約 / 集約不変条件 / 状態遷移」の3用語がぶら下がるため、CardKind→def の
 * 1:1 写像では定義が潰れる。id をキーにすれば各用語を別 def として保持できる。
 *
 * def は CONTEXT.md の定義「本文」（句点で終わる第1文）。章注記や混同防止の
 * 注記は note へ分離する（本文には混ぜない＝表示と回帰テストを単純に保つ）。
 *
 * intuition（用語の前に置く直感の足場）も def 同様 CONTEXT.md が正・手書き禁止。
 * 読めている語（actor/policy/externalSystem/readModel）には付けない。
 */
// 用語エントリの単一ソース。GLOSSARY(id→entry) と KIND_TO_GLOSSARY_ID は
// これから導出する（キーと id を二重に手書きしない）。
const ENTRIES: GlossaryEntry[] = [
  // ---- EventStorming 記法7種（kind を持つ）----
  {
    id: 'event',
    ja: 'ドメインイベント',
    en: 'Domain Event',
    kind: 'event',
    def: 'ビジネス上で「過去に起きた事実」。必ず過去形（〜した／〜された）。',
    intuition: {
      hook: 'お願いが通って「もう起きてしまった」こと。「入店した」「1杯出た」— あとから取り消せない過去の事実。',
      same: 'ドメインイベントも同じ。実際に起きてしまった事実で、過去形（〜した／された）でしか言えない。番人が弾けば何も起きない＝発行されない。',
    },
  },
  {
    id: 'command',
    ja: 'コマンド',
    en: 'Command',
    kind: 'command',
    def: 'システムへの指示・意図。「〜する」と現在形。イベント（事実）とは時制で見分ける。',
    intuition: {
      hook: '客が用心棒にする「お願い」。「入れて」「もう1杯」— まだ通っていない、ただの頼みごと。',
      same: 'コマンドも同じ。「〜する」という意図・指示で、通るかは番人が決める。起こすのは客（アクター）とは限らず、ハウスルール（ポリシー）や外の店（外部システム）のこともある。',
    },
  },
  {
    id: 'actor',
    ja: 'アクター',
    en: 'Actor',
    kind: 'actor',
    def: 'コマンドを起こす人・役割（顧客、店長…）。',
  },
  {
    id: 'policy',
    ja: 'ポリシー',
    en: 'Policy',
    kind: 'policy',
    def: '「◯◯したら、△△する」— イベントに反応して次のコマンドを自動で起こすルール。',
  },
  {
    id: 'externalSystem',
    ja: '外部システム',
    en: 'External System',
    kind: 'externalSystem',
    def: '自分たちの管理外のシステム（決済ゲートウェイ、地図API…）。',
  },
  {
    id: 'readModel',
    ja: 'リードモデル',
    en: 'Read Model',
    kind: 'readModel',
    def: '人が意思決定するために参照する情報（画面・一覧）。イベントから導かれる。',
  },
  {
    id: 'aggregate',
    ja: '集約',
    en: 'Aggregate',
    kind: 'aggregate',
    def: '集約不変条件を守る一貫性の境界。コマンドは集約を通り、ルールを満たせばイベントを発行する。',
    note: '第2章で扱う記法。',
    intuition: {
      hook: 'クラブの用心棒。客の状態とハウスルールを見て、お願いを通す／弾く。',
      same: '集約も同じ。中のルールを自分で守りきる「一貫性のかたまり（境界）」で、外から状態を直接いじれない。コマンドは必ずこの番人を通る。',
    },
  },

  // ---- 補助用語（CardKind を持たない。icon は CONTEXT.md 準拠、色は付けない）----
  {
    id: 'aggregateInvariant',
    ja: '集約不変条件',
    en: 'Aggregate Invariant',
    icon: 'shield',
    def: '集約が常に守るドメインのルール（例「延期は最大3回」）。破るコマンドは集約に拒否される。',
    note: 'Phase 8 の「孤立コマンドをゼロにする」モデリング規約とは別物（あちらはモデリング規約、こちらは集約のドメインルール）。',
    intuition: {
      hook: '用心棒が絶対に曲げない入店ルール。「1人3杯まで」を超えるお願いは必ず弾かれる。',
      same: '集約不変条件も同じ。何があっても破られないハウスルールで、破るコマンドは必ず拒否される（例「延期は最大3回」）。',
    },
  },
  {
    id: 'stateTransition',
    ja: '状態遷移',
    en: 'State Transition',
    icon: 'transition',
    def: '集約の状態が変わること（例 UNDONE→DONE）。遷移後は許されるコマンドが変わる。',
  },
  // ---- 第3章 補助用語（集約をまたぐ整合性。kind なし＝色は refVocab の kindOverride で）----
  {
    id: 'crossAggregateConsistency',
    ja: '集約整合性',
    en: 'Cross-Aggregate Consistency',
    icon: 'box',
    def: '複数の集約にまたがって守りたい整合性。1つの集約の出来事が、別の集約の状態を必ず引き起こす関係。',
    note: '単一集約の不変条件（第2章）が「1つの境界の中のルール」なのに対し、これは「境界をまたぐ整合性」。',
  },
  {
    id: 'crossingByDomainEvent',
    ja: 'ドメインイベントによる越境',
    en: 'Crossing by Domain Event',
    icon: 'policy',
    def: '集約をまたぐ整合性を「ドメインイベント」で確保する実装方法。ある集約がイベントを発行し、ポリシーがそれを拾って別の集約のコマンドを起こす。',
    note: 'ユースケースに整合性ロジックを散らすより、整合性がドメイン層に閉じて「どこから呼んでも崩れない」利点がある。',
  },

  // ---- 第4章 補償トランザクション / Saga ----
  {
    id: 'stockAllocation',
    ja: '在庫引き当て',
    en: 'Stock Allocation',
    icon: 'box',
    def: '在庫集約が注文の事実に反応して在庫を確保すること。',
  },
  {
    id: 'compensatingTransaction',
    ja: '補償トランザクション',
    en: 'Compensating Transaction',
    icon: 'back',
    def: '確定済みの事実を打ち消す「新しい事実（補償イベント）」を積むこと。',
    note: '集約をまたいだロールバックは存在せず、確定した事実は消えない。補償で結果整合性を取る。',
  },
  {
    id: 'eventualConsistency',
    ja: '結果整合性',
    en: 'Eventual Consistency',
    icon: 'clock',
    def: '複数集約を即時に強整合させず、イベントと（補償）ポリシーで「いずれ整う」ように整合を取ること。',
    note: '第3章の集約整合性を「失敗時にどう保つか」へ拡張したもの。',
  },
  {
    id: 'saga',
    ja: 'Saga',
    en: 'Saga',
    icon: 'policy',
    def: '複数集約・サービスをまたぐ長い処理を、失敗時に補償イベントで逆順に巻き戻すパターン。',
    note: '業界一般語。本ゲームでは Event→補償Policy→補償Command の連鎖として表現する。',
  },

  // ---- 第5章 イベント粒度・時制の落とし穴（記法注記語）----
  {
    id: 'wrongTense',
    ja: '時制の誤り',
    en: 'Wrong Tense',
    icon: 'alert',
    def: '現在形（意図＝コマンド）を過去形（事実＝イベント）と取り違える Phase 2 の頻出ミス。',
    note: '記法注記。現在形は command（水色）で示す。',
  },
  {
    id: 'granularityDrift',
    ja: '粒度のブレ',
    en: 'Granularity Drift',
    icon: 'alert',
    def: 'ドメインイベントの粒度が粗すぎ・過細・テクニカルにブレること。',
    note: '唯一の正解粒度を主張せず「業務として意味があるか」を問う（唯一解の嘘をつかない）。',
  },
  {
    id: 'technicalEvent',
    ja: 'テクニカルイベント',
    en: 'Technical Event',
    icon: 'alert',
    def: 'DB操作やUIクリックなど実装・操作レベルの事象で、ドメインイベントではないもの。',
    note: '業界標準カードではなくアンチパターンの呼称。',
  },

  // ---- 第6章 リードモデル / CQRS（軽量版）----
  {
    id: 'lightweightQueryModel',
    ja: '軽量クエリモデル',
    en: 'Lightweight Query Model',
    icon: 'readModel',
    def: '更新用モデル（集約）と分けて、複数集約・複数イベントの事実から導く参照専用モデル。',
    note: 'DDD-FAQ §8.4 の呼称。イベントソーシングや厳密な CQRS は本ゲームの範囲外。',
  },
  {
    id: 'cqrs',
    ja: 'CQRS（軽量版）',
    en: 'Command Query Responsibility Segregation',
    icon: 'readModel',
    def: '更新（コマンド→集約）と参照（イベント→リードモデル）を分ける考え方。',
    note: '本ゲームは §8.4 の軽量クエリモデルの範囲のみ扱う。',
  },
]

/** 用語定義の単一ソース（id → entry）。ENTRIES から導出。 */
export const GLOSSARY: Record<string, GlossaryEntry> = Object.fromEntries(
  ENTRIES.map((e) => [e.id, e]),
)

/**
 * 記法種別（CardKind）→ 代表用語 id。ENTRIES の kind 付きエントリから導出する。
 * 凡例チップ・付箋 i の「種別 → 定義」経路はこのマップ1枚で解決する。
 * kind 'aggregate' は記法カードとしての「集約」を代表とする
 * （集約不変条件・状態遷移は kind を持たず本文ハイライト経由で引く）。
 */
export const KIND_TO_GLOSSARY_ID = Object.fromEntries(
  ENTRIES.filter((e) => e.kind).map((e) => [e.kind, e.id]),
) as Record<CardKind, string>

/** 種別から定義エントリを引く（凡例・付箋 i 用）。 */
export function glossaryForKind(kind: CardKind): GlossaryEntry {
  return GLOSSARY[KIND_TO_GLOSSARY_ID[kind]]
}

/**
 * stages の VocabEntry を GLOSSARY から組み立てる薄いヘルパ。
 * def / ja / en の正本は GLOSSARY 1箇所。VocabEntry.def を手書きしない。
 * id は獲得語彙としての固有 id を呼び出し側で付ける（GLOSSARY の id とは別軸）。
 *
 * kind: GLOSSARY が kind を持てばそれを使う。集約不変条件・状態遷移のような
 * 補助用語は kind を持たないため、表示色に使う CardKind を kindOverride で渡す。
 */
export function refVocab(
  glossaryId: string,
  kindOverride?: CardKind,
): Pick<VocabEntry, 'ja' | 'en' | 'kind' | 'def'> {
  const g = GLOSSARY[glossaryId]
  if (!g) {
    throw new Error(`refVocab: GLOSSARY['${glossaryId}'] が存在しない`)
  }
  const kind = g.kind ?? kindOverride
  if (kind == null) {
    throw new Error(
      `refVocab: GLOSSARY['${glossaryId}'] に kind がなく kindOverride も未指定`,
    )
  }
  return { ja: g.ja, en: g.en, kind, def: g.def }
}
