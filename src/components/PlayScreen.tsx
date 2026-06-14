import { useState } from 'react'
import { STAGES } from '../data/stages'
import { useStore, commitClear } from '../store'
import { scoreStars } from '../game/engine'
import { track } from '../game/analytics'
import { TimelineMode } from './TimelineMode'
import { TriggerMode } from './TriggerMode'
import { Legend } from './Legend'
import { Toast, type ToastState } from './Toast'

export function PlayScreen() {
  const { state, dispatch } = useStore()
  const stage = STAGES[state.stageIdx]
  const [toast, setToast] = useState<ToastState | null>(null)

  function showToast(message: string, kind: 'error' | 'ok' = 'error') {
    setToast({ message, kind, key: Date.now() })
  }

  function handleCorrect(mistakes: number, usedHint: boolean) {
    const stars = scoreStars({ mistakes, usedHint })
    const progress = commitClear(state, stage.id, stars, stage.vocab.id)
    track('stage_clear', { stage: stage.id, stars })
    dispatch({ type: 'clearStage', stars, progress })
  }

  function handleMistake(reason: string) {
    track('stage_retry', { stage: stage.id })
    showToast(reason, 'error')
  }

  return (
    <div className="screen play">
      <div className="modelabel">{stage.modeLabel}</div>
      <h2 className="play-title">
        {stage.icon} {stage.name}
      </h2>
      <Legend />
      <div className="scenario">{stage.scenario}</div>
      <p className="instruction">{stage.instruction}</p>

      {stage.mode === 'timeline' ? (
        <TimelineMode
          key={stage.id}
          stage={stage}
          onCorrect={handleCorrect}
          onMistake={handleMistake}
        />
      ) : (
        <TriggerMode
          key={stage.id}
          stage={stage}
          onCorrect={handleCorrect}
          onMistake={handleMistake}
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
