import { useEffect } from 'react'

export interface ToastState {
  message: string
  kind: 'error' | 'ok'
  key: number
}

export function Toast({
  state,
  onDone,
}: {
  state: ToastState
  onDone: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onDone, 4000)
    return () => clearTimeout(t)
  }, [state.key, onDone])

  return (
    <div className={`toast ${state.kind === 'ok' ? 'ok' : ''}`} role="status" aria-live="polite">
      {state.message}
    </div>
  )
}
