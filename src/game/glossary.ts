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
