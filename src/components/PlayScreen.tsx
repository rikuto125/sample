import { useState } from 'react'
import { STAGES } from '../data/stages'
import { useStore, commitClear } from '../store'
import { scoreStars } from '../game/engine'
import { track } from '../game/analytics'
import { soundEngine as sound } from '../game/sound'
import { haptics } from '../game/haptics'
import { GLOSSARY, glossaryForKind } from '../game/glossary'
import type { CardKind, GlossaryEntry, Stage } from '../game/types'
import { TimelineMode } from './TimelineMode'
import { TriggerMode } from './TriggerMode'
import { InvariantGateMode } from './InvariantGateMode'
import { Legend } from './Legend'
import { RichText } from './RichText'
import { DefinitionSheet, type DefVia } from './DefinitionSheet'
import { Toast, type ToastState } from './Toast'

/** 本文ハイライト対象の用語。stage.glossaryRefs が無ければそのステージの記法種別を既定にする。 */
function inlineTerms(stage: Stage): GlossaryEntry[] {
  if (stage.glossaryRefs?.length) {
    return stage.glossaryRefs
      .map((id) => GLOSSARY[id])
      .filter((e): e is GlossaryEntry => e != null)
  }
  const kinds = new Set<CardKind>()
  if (stage.mode === 'timeline') {
    stage.events.forEach((c) => kinds.add(c.kind))
    stage.distractors.forEach((c) => kinds.add(c.kind))
  } else if (stage.mode === 'trigger') {
    stage.commands.forEach((c) => kinds.add(c.kind))
    stage.triggers.forEach((c) => kinds.add(c.kind))
  } else {
    kinds.add('command')
    kinds.add('event')
    kinds.add('aggregate')
  }
  return [...kinds].map((k) => glossaryForKind(k))
}

export function PlayScreen() {
  const { state, dispatch } = useStore()
  const stage = STAGES[state.stageIdx]
  const [toast, setToast] = useState<ToastState | null>(null)
  // 定義シートの開閉は UI 一時状態なのでローカル state（グローバル reducer を汚さない）
  const [def, setDef] = useState<{ entry: GlossaryEntry; via: DefVia } | null>(
    null,
  )

  function openByKind(kind: CardKind, via: DefVia) {
    setDef({ entry: glossaryForKind(kind), via })
  }

  function showToast(message: string, kind: 'error' | 'ok' = 'error') {
    setToast({ message, kind, key: Date.now() })
  }

  function handleCorrect(mistakes: number, usedHint: boolean) {
    const stars = scoreStars({ mistakes, usedHint })
    const progress = commitClear(state, stage.id, stars, stage.vocab.id)
    sound.play('correct')
    haptics.fire('correct')
    track('stage_clear', { stage: stage.id, stars, mistakes, usedHint })
    dispatch({ type: 'clearStage', stars, progress })
  }

  function handleMistake(reason: string) {
    sound.play('mistake')
    haptics.fire('mistake')
    track('stage_retry', { stage: stage.id })
    showToast(reason, 'error')
  }

  return (
    <div className="screen play">
      <div className="modelabel">{stage.modeLabel}</div>
      <h2 className="play-title">
        {stage.icon} {stage.name}
      </h2>

      {/* 今やること（指示）はプレイ画面に常駐。説明＋凡例は畳んで密度を下げる（#2 情報設計） */}
      <p className="instruction">
        <RichText
          text={stage.instruction}
          terms={inlineTerms(stage)}
          onOpenDef={(entry) => setDef({ entry, via: 'inline' })}
        />
      </p>

      <details className="stage-brief">
        <summary>この章の説明と記法</summary>
        <div className="scenario">
          <RichText
            text={stage.scenario}
            terms={inlineTerms(stage)}
            onOpenDef={(entry) => setDef({ entry, via: 'inline' })}
          />
        </div>
        <Legend
          kinds={
            stage.mode === 'invariant'
              ? ['event', 'command', 'aggregate']
              : undefined
          }
          onOpenDef={(k) => openByKind(k, 'legend')}
        />
      </details>

      {stage.mode === 'timeline' && (
        <TimelineMode
          key={stage.id}
          stage={stage}
          onCorrect={handleCorrect}
          onMistake={handleMistake}
        />
      )}
      {stage.mode === 'trigger' && (
        <TriggerMode
          key={stage.id}
          stage={stage}
          onCorrect={handleCorrect}
          onMistake={handleMistake}
          onInfo={(k) => openByKind(k, 'sticky')}
        />
      )}
      {stage.mode === 'invariant' && (
        <InvariantGateMode
          key={stage.id}
          stage={stage}
          onCorrect={handleCorrect}
          onMistake={handleMistake}
          onInfo={(k) => openByKind(k, 'sticky')}
        />
      )}

      {def && (
        <DefinitionSheet
          entry={def.entry}
          via={def.via}
          onClose={() => setDef(null)}
        />
      )}

      {toast && (
        <Toast
          key={toast.key}
          state={toast}
          onDone={() => setToast(null)}
        />
      )}
    </div>
  )
}
