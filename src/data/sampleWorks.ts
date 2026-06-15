import type { SandboxWork } from '../game/sandboxTypes'

// 個人ワークの「お手本」。完成イメージが湧かない人向けの、記法的に正しい完成例。
// データであってコンポーネントではない（採点系には依存しない＝SandboxCard のみ）。
//
// 記法の不変条件（このファイルを編集するときは必ず守る）:
//  - event は過去形「〜した/された/れた」、command は現在形「〜する」、policy は「◯◯したら△△する」。
//  - 全 command は actor / policy / externalSystem のいずれかでトリガーされる（孤立コマンドを作らない）。
//  - 全 event はいずれかの command の帰結（孤立イベントを作らない）。
//  - externalSystem は必ずフローに接続する（どこからも参照されないピンク付箋を置かない）。
//  - 色は持たない（CARD_META[kind] が唯一の真実）。
//
// レイアウト規約: x は左→右の時間軸。y は種別の帯
//   actor=40 / command=180 / event=340（メイン列） / policy=520 / externalSystem=660 / aggregate=820。
//   readModel は参照される位置（右側）に置く。

// --- レストランのテーブル予約（因果連鎖が一周つながる完成例） ---
const restaurantReservation: SandboxWork = {
  id: 'sample-restaurant-reservation',
  title: '【お手本】レストランのテーブル予約',
  domainDescription:
    'お客さまが席を予約し、確認メールとリマインドが届くまで。コマンド→イベント→ポリシー→コマンドの連鎖が一周つながる例。',
  status: 'draft-complete',
  createdAt: 0,
  updatedAt: 0,
  cards: [
    // アクター
    { id: 'r-actor-guest', kind: 'actor', labelJa: '顧客', x: 80, y: 40 },

    // 1) 空席照会
    { id: 'r-cmd-check', kind: 'command', labelJa: '空席を確認する', x: 80, y: 180 },
    { id: 'r-evt-checked', kind: 'event', labelJa: '空席が照会された', x: 80, y: 340 },

    // 2) 予約申し込み → 受付
    { id: 'r-cmd-request', kind: 'command', labelJa: '予約を申し込む', x: 360, y: 180 },
    { id: 'r-evt-accepted', kind: 'event', labelJa: '予約が受け付けられた', x: 360, y: 340 },

    // 3) 受け付けられたら席を確保する（ポリシー → コマンド → イベント）
    {
      id: 'r-pol-secure',
      kind: 'policy',
      labelJa: '予約が受け付けられたら席を確保する',
      x: 360,
      y: 520,
    },
    { id: 'r-cmd-secure', kind: 'command', labelJa: '席を確保する', x: 640, y: 180 },
    { id: 'r-evt-secured', kind: 'event', labelJa: '席が確保された', x: 640, y: 340 },

    // 4) 確保されたら確認メールを送る（ポリシー → コマンド → イベント、外部システム接続）
    {
      id: 'r-pol-mail',
      kind: 'policy',
      labelJa: '席が確保されたら確認メールを送る',
      x: 640,
      y: 520,
    },
    { id: 'r-cmd-mail', kind: 'command', labelJa: '確認メールを送る', x: 920, y: 180 },
    { id: 'r-evt-mailed', kind: 'event', labelJa: '確認メールが送られた', x: 920, y: 340 },
    {
      id: 'r-ext-mail',
      kind: 'externalSystem',
      labelJa: 'メール配信サービス',
      x: 920,
      y: 660,
    },

    // 5) 前日になったらリマインドを送る（ポリシー → コマンド → イベント、外部システム接続）
    {
      id: 'r-pol-remind',
      kind: 'policy',
      labelJa: '予約前日になったらリマインドを送る',
      x: 1200,
      y: 520,
    },
    { id: 'r-cmd-remind', kind: 'command', labelJa: 'リマインドを送る', x: 1200, y: 180 },
    { id: 'r-evt-reminded', kind: 'event', labelJa: 'リマインドが送られた', x: 1200, y: 340 },
    {
      id: 'r-ext-sms',
      kind: 'externalSystem',
      labelJa: 'SMSゲートウェイ',
      x: 1200,
      y: 660,
    },

    // 集約（一貫性の境界）
    { id: 'r-agg-reservation', kind: 'aggregate', labelJa: '予約', x: 360, y: 820 },
    { id: 'r-agg-table', kind: 'aggregate', labelJa: '席', x: 640, y: 820 },

    // リードモデル（意思決定のために見る情報）
    {
      id: 'r-rm-today',
      kind: 'readModel',
      labelJa: '本日の予約一覧',
      x: 920,
      y: 820,
    },
  ],
}

/** Hub で「お手本から作る／中身を見る」に出すサンプル一覧。 */
export const SAMPLE_WORKS: readonly SandboxWork[] = [restaurantReservation]
