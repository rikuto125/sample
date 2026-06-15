import type { CardKind } from './types'

/**
 * カード種別 → 表示メタ（色＋アイコン＋ラベル）。
 * 色は EventStorming 業界標準に厳密一致させる。
 * 色覚多様性対応のため、色だけに意味を担わせず必ずアイコンとラベルを併用する。
 */
export interface CardMeta {
  color: string
  /** 文字色（コントラスト確保） */
  ink: string
  /**
   * アイコンの意味トークン（UI 層の Icon レジストリが lucide SVG に解決する）。
   * 絵文字は使わない。OS 差のない SVG で記法の三重冗長（色＋アイコン＋ラベル）を担保する。
   * 概念対応: event=雷, command=再生, actor=人, policy=歯車, external=雲, readModel=一覧, aggregate=箱。
   */
  icon: string
  labelJa: string
  labelEn: string
}

export const CARD_META: Record<CardKind, CardMeta> = {
  event: {
    color: '#FFB74D',
    ink: '#3a2600',
    icon: 'event',
    labelJa: 'イベント',
    labelEn: 'Event',
  },
  command: {
    color: '#64B5F6',
    ink: '#06243a',
    icon: 'command',
    labelJa: 'コマンド',
    labelEn: 'Command',
  },
  actor: {
    color: '#FFF176',
    ink: '#3a3400',
    icon: 'actor',
    labelJa: 'アクター',
    labelEn: 'Actor',
  },
  policy: {
    color: '#CE93D8',
    ink: '#2e0f33',
    icon: 'policy',
    labelJa: 'ポリシー',
    labelEn: 'Policy',
  },
  externalSystem: {
    color: '#F48FB1',
    ink: '#3a0a1d',
    icon: 'externalSystem',
    labelJa: '外部システム',
    labelEn: 'External',
  },
  readModel: {
    color: '#A5D6A7',
    ink: '#0d2b0f',
    icon: 'readModel',
    labelJa: 'リードモデル',
    labelEn: 'Read Model',
  },
  aggregate: {
    color: '#FFF59D',
    ink: '#3a3400',
    icon: 'aggregate',
    labelJa: '集約',
    labelEn: 'Aggregate',
  },
}
