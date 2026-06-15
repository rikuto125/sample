import { useState } from 'react'
import { useStore } from '../store'
import { Sticky } from './Sticky'
import { RichText } from './RichText'
import { DefinitionSheet } from './DefinitionSheet'
import { GLOSSARY } from '../game/glossary'
import type { Card, GlossaryEntry } from '../game/types'

const SAMPLE: Card = {
  id: 'onboard-event',
  kind: 'event',
  labelJa: 'ピザが焼き上がった',
}

// オンボーディング中に「ドメインイベント」を一度だけ下線にし、定義UIの操作を予告体験させる
const ONBOARD_TERMS: GlossaryEntry[] = [GLOSSARY.event]

/**
 * オンボーディング: 説明より先に「1枚置く成功体験」（市場調査の知見）。
 * 必ず成功する。置けたら気持ちいいフィードバック→即ホームへ。
 */
export function Onboarding() {
  const { dispatch } = useStore()
  const [placed, setPlaced] = useState(false)
  const [def, setDef] = useState<GlossaryEntry | null>(null)

  return (
    <div className="screen onboarding screen-dark">
      <div className="kicker">ようこそ StormQuest へ</div>
      <h1 className="onboard-title">
        まず、<span className="hl">1枚だけ</span>置いてみよう
      </h1>
      <p className="onboard-lead">
        オレンジの付箋は「<strong>過去に起きた事実</strong>」＝
        <RichText
          text="ドメインイベント"
          terms={ONBOARD_TERMS}
          onOpenDef={setDef}
        />
        。 下の付箋を、タイムラインにタップで置いてみて。
      </p>

      <div className="onboard-board">
        <div className={`onboard-slot ${placed ? 'filled' : ''}`}>
          {placed ? (
            <div className="pulse">
              <Sticky card={SAMPLE} />
            </div>
          ) : (
            <span className="slot-hint">ここにタップで置く</span>
          )}
        </div>
      </div>

      {!placed ? (
        <button
          className="onboard-hand"
          onClick={() => setPlaced(true)}
          aria-label="ピザが焼き上がった を置く"
        >
          <Sticky card={SAMPLE} inHand />
        </button>
      ) : (
        <div className="onboard-success">
          <p className="success-msg">
            🎉 いいね！ これがドメインイベント。
            「〜した／された」と過去形で書くのがポイント。
          </p>
          <p className="onboard-tip">
            分からない用語は <span className="chip-i" aria-hidden>ⓘ</span> や点線の語を
            タップ すると意味が見られます。
          </p>
          <button
            className="btn-primary"
            onClick={() => dispatch({ type: 'finishOnboarding' })}
          >
            ゲームを始める ▶
          </button>
        </div>
      )}

      {!placed && (
        <button
          className="btn-ghost on-dark skip"
          onClick={() => dispatch({ type: 'finishOnboarding' })}
        >
          スキップ
        </button>
      )}

      {def && (
        <DefinitionSheet
          entry={def}
          via="inline"
          onClose={() => setDef(null)}
        />
      )}
    </div>
  )
}
