import { Fragment } from 'react'
import { annotate } from '../game/highlight'
import type { GlossaryEntry } from '../game/types'

interface RichTextProps {
  text: string
  /** 本文中で下線にして定義を引ける用語（許可リスト） */
  terms: GlossaryEntry[]
  onOpenDef: (entry: GlossaryEntry) => void
}

/**
 * 本文（scenario / instruction）の専門用語に点線下線を付け、タップで定義を開く。
 * データ（stages の素の string）に markup を埋めず、レンダラ側で語をマッチする。
 * 下線は色でなく形（点線）で示す＝色で意味を持たせない原則を守る。
 */
export function RichText({ text, terms, onOpenDef }: RichTextProps) {
  const segments = annotate(text, terms)
  return (
    <>
      {segments.map((seg, i) =>
        'entry' in seg ? (
          <button
            key={i}
            type="button"
            className="term-underline"
            onClick={() => onOpenDef(seg.entry)}
            aria-label={`${seg.entry.ja}の意味を見る`}
          >
            {seg.text}
          </button>
        ) : (
          <Fragment key={i}>{seg.text}</Fragment>
        ),
      )}
    </>
  )
}
