import { useEffect, useId, useRef } from 'react'
import { CARD_META } from '../game/cardMeta'
import { track } from '../game/analytics'
import { Icon } from './Icon'
import type { GlossaryEntry } from '../game/types'

export type DefVia = 'legend' | 'sticky' | 'inline'

interface DefinitionSheetProps {
  entry: GlossaryEntry
  /** どの導線から開いたか（用語ポップ開封率の内訳計測用） */
  via: DefVia
  onClose: () => void
}

/**
 * 用語定義の唯一の表示UI（凡例チップ・付箋 i・本文用語の3経路が共通で開く）。
 * モバイル前提のボトムシート。盤面を残すため高さは控えめ。
 *
 * 三重冗長: kind を持つ記法用語は CARD_META の色＋アイコン＋ラベル。
 * kind を持たない補助用語は色を足さず、アイコン＋ラベルの二重で表す
 * （独自色を足さない＝EventStorming 業界標準色をズラさない原則を守る）。
 */
export function DefinitionSheet({ entry, via, onClose }: DefinitionSheetProps) {
  const titleId = useId()
  const defId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)
  // 開く直前のフォーカスを保存し、閉じたら呼び出し元（チップ/付箋i/本文語）へ戻す
  const returnFocusRef = useRef<Element | null>(null)

  // 開封を1回だけ計測（DESIGN.md §6 用語ポップ開封率）。
  // hasIntuition: 比喩あり用語の開封が完走/リトライ減に効くかの内訳分析用。
  useEffect(() => {
    track('vocab_opened', { term: entry.id, via, hasIntuition: !!entry.intuition })
    // entry.intuition は entry.id で一意に決まる（GLOSSARY 由来）ため deps は id/via のみ
  }, [entry.id, via])

  useEffect(() => {
    returnFocusRef.current = document.activeElement
    closeRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      const el = returnFocusRef.current
      if (el instanceof HTMLElement) el.focus()
    }
  }, [onClose])

  const meta = entry.kind ? CARD_META[entry.kind] : null
  const icon = meta?.icon ?? entry.icon

  return (
    <>
      <div className="def-scrim" onClick={onClose} aria-hidden />
      <div
        className="def-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={defId}
      >
        <div className="def-head">
          <span
            className="def-pill"
            style={
              meta ? { background: meta.color, color: meta.ink } : undefined
            }
          >
            {icon && (
              <span className="def-pill-icon">
                <Icon name={icon} size={15} />
              </span>
            )}
            <span id={titleId} className="def-pill-label">
              {entry.ja}
            </span>
          </span>
          <span className="def-en" aria-hidden>
            {entry.en}
          </span>
          <button
            ref={closeRef}
            type="button"
            className="def-close"
            onClick={onClose}
            aria-label="閉じる"
          >
            <Icon name="close" size={20} />
          </button>
        </div>
        {/* 直感の足場は正式定義の「前」に置く。色は付けず淡色＋左ボーダーで
            「定義ではない補助」と階層化。aria-describedby には含めず、
            スクリーンリーダーは正式定義(def)を主として読む。 */}
        {entry.intuition && (
          <div className="def-intuition">
            <p className="def-intuition-hook">
              <Icon name="wave" size={15} /> たとえるなら: {entry.intuition.hook}
            </p>
            <p className="def-intuition-same">{entry.intuition.same}</p>
          </div>
        )}
        <p id={defId} className="def-body">
          {entry.def}
        </p>
        {entry.note && <p className="def-note">{entry.note}</p>}
      </div>
    </>
  )
}
