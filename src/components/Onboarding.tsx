import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store'
import { Sticky } from './Sticky'
import { Icon } from './Icon'
import { MascotImage } from './MascotImage'
import { DefinitionSheet } from './DefinitionSheet'
import { GLOSSARY } from '../game/glossary'
import { track } from '../game/analytics'
import type { Card, GlossaryEntry } from '../game/types'

// オンボーディング: 説明より先に「置く成功体験」、置いた“後”にラベルと「なぜ」を返す
// scaffolded discovery を3拍くり返し、最後に因果連鎖（Event→Policy→Command→Event）を
// 1本つないでループを閉じる4画面。報酬は得点でなく「なぜそうか」のコンピテンス FB。
// 記法・色は CARD_META / GLOSSARY 由来（独自にズラさない）。
//
// 因果連鎖の素材は本編 ch1-s4 の実データに一致させる（捏造しない）:
//   Event「ピザが焼き上がった」→ Policy「焼き上がったら配達を手配する」
//   → Command「配達員を割り当てる」→ Event「配達員が割り当てられた」（ループが閉じる）

const EVENT_CARD: Card = { id: 'ob-event', kind: 'event', labelJa: 'ピザが焼き上がった' }
const COMMAND_CARD: Card = { id: 'ob-command', kind: 'command', labelJa: '配達員を割り当てる' }
const POLICY_CARD: Card = {
  id: 'ob-policy',
  kind: 'policy',
  labelJa: '焼き上がったら配達を手配する',
}
// ループを閉じる新事実（本編 s2/s3 に実在する event）
const LOOP_EVENT_CARD: Card = {
  id: 'ob-loop-event',
  kind: 'event',
  labelJa: '配達員が割り当てられた',
}

type Step = 0 | 1 | 2 | 3
const TOTAL_STEPS = 4

/** 進行ドット（4つ）。点灯に文言を付けない＝残量の地図。先頭は endowed-progress の seed。 */
function Dots({ step }: { step: Step }) {
  return (
    <div className="ob-dots" aria-hidden>
      {Array.from({ length: TOTAL_STEPS }, (_, i) => (
        <span
          key={i}
          className={`ob-dot ${i === 0 && step === 0 ? 'seed' : ''} ${i <= step ? 'on' : ''}`}
        />
      ))}
    </div>
  )
}

export function Onboarding() {
  const { dispatch } = useStore()
  const [step, setStep] = useState<Step>(0)
  const [def, setDef] = useState<GlossaryEntry | null>(null)
  // 各ステップの配置状態（置いた“後”に開示を出すため）
  const [eventPlaced, setEventPlaced] = useState(false)
  const [commandPlaced, setCommandPlaced] = useState(false)
  const [chainLinked, setChainLinked] = useState(false)
  // SR 等価通知（配置・開示・連結をアナウンス）
  const [announce, setAnnounce] = useState('')

  // 離脱点を観測（特に S0/S1 の skip 率）。各ステップ入場を1回ずつ計測。
  useEffect(() => {
    track('onboarding_step', { step })
  }, [step])

  function finish(skipped: boolean) {
    track('onboarding_complete', { skipped, lastStep: step })
    dispatch({ type: 'finishOnboarding' })
  }

  return (
    <div className="screen ob">
      {step === 0 && <ValueScreen onNext={() => setStep(1)} onSkip={() => finish(true)} />}

      {step === 1 && (
        <PlaceScreen
          step={1}
          scenario="🍕 お店で、ピザが焼き上がった——これは“もう起きたこと”。"
          card={EVENT_CARD}
          placed={eventPlaced}
          onPlace={() => {
            setEventPlaced(true)
            setAnnounce('置けました。これはドメインイベントです。')
          }}
          reveal={
            <p className="ob-reveal">
              <b>正解。</b>
              「〜した／された」の過去形＝もう取り消せない事実。だからオレンジは
              <button
                type="button"
                className="ob-term"
                onClick={() => setDef(GLOSSARY.event)}
                aria-label="ドメインイベントの意味を見る"
              >
                ドメインイベント
              </button>
              。
              <span className="ob-honest">
                分からない語は、点線の語をタップすると“なぜ”が読めます。
              </span>
            </p>
          }
          onNext={() => setStep(2)}
          onSkip={() => finish(true)}
        />
      )}

      {step === 2 && (
        <PlaceScreen
          step={2}
          scenario="お店はまだ“これからやる”ことがある——配達員を割り当てる。"
          card={COMMAND_CARD}
          residual={EVENT_CARD}
          placed={commandPlaced}
          onPlace={() => {
            setCommandPlaced(true)
            setAnnounce('置けました。これはコマンドです。')
          }}
          reveal={
            <p className="ob-reveal">
              <b>「〜する」は現在形＝</b>まだ起きていない“意図”。だから事実（オレンジ）でなくコマンド（水色）。見分けは色でなく“時制”。
              <span className="ob-honest">
                起こすのは人とは限らない——お店のルール（ポリシー）のことも。
              </span>
            </p>
          }
          onNext={() => setStep(3)}
          onSkip={() => finish(true)}
        />
      )}

      {step === 3 && (
        <ChainScreen
          linked={chainLinked}
          onLink={() => {
            setChainLinked(true)
            setAnnounce(
              'ピザが焼き上がった（イベント）→ 焼き上がったら配達を手配する（ポリシー）→ 配達員を割り当てる（コマンド）→ 配達員が割り当てられた（イベント）が繋がりました。',
            )
          }}
          onDef={() => setDef(GLOSSARY.policy)}
          onFinish={() => finish(false)}
          onSkip={() => finish(true)}
        />
      )}

      {/* SR 等価通知（視覚 juice の代替）。視覚的には非表示。 */}
      <span className="sr-only" role="status" aria-live="polite">
        {announce}
      </span>

      {def && <DefinitionSheet entry={def} via="inline" onClose={() => setDef(null)} />}
    </div>
  )
}

// ===== S0 価値とトーン（読むだけ・3秒） =====
function ValueScreen({ onNext, onSkip }: { onNext: () => void; onSkip: () => void }) {
  return (
    <div className="ob-screen ob-hero">
      <div className="ob-read">
        {/* マスコット（DOMAIN EVENT / UI ELEMENTS の付箋を着ている）が
            「EventStorming のツール」を一目で予告する。難しい題材の緊張を和らげる。 */}
        <MascotImage mood="wink" size={128} className="ob-mascot" />
        <p className="ob-kicker">EVENTSTORMING を、手で。</p>
        <h1 className="ob-title">
          複雑な業務も、
          <br />
          付箋1枚ずつでほどける。
        </h1>
        {/* 万能感を煽らず competence-entry に留める（学習の誠実さ） */}
        <p className="ob-sub">
          5分で、EventStorming の“色と文法”の<strong>読み方</strong>がつかめる。
        </p>
        <Dots step={0} />
      </div>
      <div className="ob-thumb">
        <button className="btn-primary" onClick={onNext}>
          付箋を置いてみる <Icon name="next" size={18} />
        </button>
        <button className="btn-ghost ob-skip" onClick={onSkip}>
          スキップ
        </button>
      </div>
    </div>
  )
}

// ===== S1/S2 置いて気づく（scaffolded discovery） =====
interface PlaceScreenProps {
  step: Step
  scenario: string
  card: Card
  /** 盤に残す既出カード（S2 で S1 の event を残置） */
  residual?: Card
  placed: boolean
  onPlace: () => void
  reveal: React.ReactNode
  onNext: () => void
  onSkip: () => void
}

function PlaceScreen({
  step,
  scenario,
  card,
  residual,
  placed,
  onPlace,
  reveal,
  onNext,
  onSkip,
}: PlaceScreenProps) {
  // tap-source → tap-target。手札をタップで arm、スロットをタップで配置。
  const [armed, setArmed] = useState(false)
  return (
    <div className="ob-screen">
      <Dots step={step} />
      <p className="ob-scenario">{scenario}</p>

      <div className="ob-board">
        {residual && (
          <div className="ob-slot filled">
            <Sticky card={residual} small />
          </div>
        )}
        <button
          type="button"
          className={`ob-slot ${placed ? 'filled' : 'pulse'}`}
          onClick={() => {
            if (!placed) onPlace()
          }}
          aria-label={placed ? `${card.labelJa} を置いた` : 'ここに付箋を置く'}
          disabled={placed}
        >
          {placed ? <Sticky card={card} small /> : <span className="ob-slot-hint">ここにタップで置く</span>}
        </button>
        {placed && reveal}
      </div>

      {!placed ? (
        <>
          <div className="ob-hand">
            <button
              type="button"
              className={`ob-hand-card ${armed ? 'armed' : ''}`}
              onClick={() => {
                setArmed(true)
                onPlace()
              }}
              aria-label={`${card.labelJa} を置く`}
            >
              <Sticky card={card} inHand />
            </button>
          </div>
          <p className="ob-hint">付箋をタップ → スロットをタップで置く</p>
        </>
      ) : (
        <button className="btn-primary ob-next" onClick={onNext}>
          次へ <Icon name="next" size={18} />
        </button>
      )}

      {!placed && (
        <button className="btn-ghost ob-skip" onClick={onSkip}>
          スキップ
        </button>
      )}
    </div>
  )
}

// ===== S3 因果を1本つなぐ（Event→Policy→Command→Event。山場） =====
interface ChainScreenProps {
  linked: boolean
  onLink: () => void
  onDef: () => void
  onFinish: () => void
  onSkip: () => void
}

function ChainRow({
  tag,
  card,
  faded,
}: {
  tag: string
  card: Card
  faded?: boolean
}) {
  return (
    <div className="ob-chain-row">
      <span className="ob-chain-tag">{tag}</span>
      <div className={`ob-chain-cell ${faded ? 'faded' : ''}`}>
        <Sticky card={card} small />
      </div>
    </div>
  )
}

/** ノード間の矢印＋正誤マーク（色だけに頼らず ?→✓ と矢印形で因果方向を冗長化）。 */
function ChainArrow({ ok }: { ok: boolean }) {
  return (
    <div className="ob-chain-arrow" aria-hidden>
      <span className={`ob-mark ${ok ? 'ok' : 'q'}`}>{ok ? '✓' : '?'}</span>
      <Icon name="down" size={16} />
    </div>
  )
}

function ChainScreen({ linked, onLink, onDef, onFinish, onSkip }: ChainScreenProps) {
  const cardRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="ob-screen">
      <Dots step={3} />
      <p className="ob-scenario">“焼き上がった”が、どうやって“割り当てる”を呼ぶ？</p>

      {/* 390px 縦積み（横スクロールなし）。ループが閉じる */}
      <div className="ob-chain">
        <ChainRow tag="事実" card={EVENT_CARD} />
        <ChainArrow ok={linked} />

        <div className="ob-chain-row">
          <span className="ob-chain-tag">ルール</span>
          {linked ? (
            <div className="ob-chain-cell linked">
              <Sticky card={POLICY_CARD} small />
            </div>
          ) : (
            <span className="ob-slot in-chain pulse" aria-hidden>
              <span className="ob-slot-hint">ここに置く</span>
            </span>
          )}
        </div>
        <ChainArrow ok={linked} />

        <ChainRow tag="指示" card={COMMAND_CARD} />
        <ChainArrow ok={linked} />

        {/* ループを閉じる新事実。連結前は薄く予告、連結で確定 */}
        <ChainRow tag="新事実" card={LOOP_EVENT_CARD} faded={!linked} />
      </div>

      {!linked ? (
        <>
          <div className="ob-hand">
            <button
              ref={cardRef}
              type="button"
              className="ob-hand-card"
              onClick={onLink}
              aria-label={`${POLICY_CARD.labelJa} を置く`}
            >
              <Sticky card={POLICY_CARD} inHand />
            </button>
          </div>
          <p className="ob-hint">事実と指示の“あいだ”に、反応する<button
            type="button"
            className="ob-term"
            onClick={onDef}
            aria-label="ポリシーの意味を見る"
          >ポリシー</button>を置く</p>
          <button className="btn-ghost ob-skip" onClick={onSkip}>
            スキップ
          </button>
        </>
      ) : (
        <>
          <div className="ob-closer">
            これが EventStorming の背骨。<b>事実 → ルール → 指示</b>。そしてその指示が新しい事実『配達員が割り当てられた』を生み、また次のルールを呼ぶ。
            <span className="ob-loop">
              <Icon name="transition" size={16} /> 事実 → ルール → 指示 → 事実（ぐるぐる回る）
            </span>
          </div>
          <button className="btn-primary ob-next" onClick={onFinish}>
            さあ本編へ <Icon name="next" size={18} />
          </button>
          <p className="ob-replay">チュートリアルはメニューからいつでも見られます。</p>
        </>
      )}
    </div>
  )
}
