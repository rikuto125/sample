import { useState } from 'react'
import { StoreProvider, useStore } from './store'
import { totalStars } from './game/progress'
import { soundEngine } from './game/sound'
import { HomeScreen } from './components/HomeScreen'
import { PlayScreen } from './components/PlayScreen'
import { ResultScreen } from './components/ResultScreen'
import { CompleteScreen } from './components/CompleteScreen'
import { Onboarding } from './components/Onboarding'

function SoundToggle() {
  // 設定はゲーム状態でないので store(reducer) を汚さずローカルに持つ。
  // 永続化と AudioContext unlock は soundEngine 側が担う。
  const [enabled, setEnabled] = useState(() => soundEngine.isEnabled())
  function toggle() {
    const next = !enabled
    soundEngine.setEnabled(next) // 保存＋ON時は initial tap で unlock
    setEnabled(next)
  }
  return (
    <button
      className="snd-toggle"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? '効果音オン（タップでオフ）' : '効果音オフ（タップでオン）'}
    >
      {enabled ? '🔊' : '🔇'}
    </button>
  )
}

function AppBar() {
  const { state, dispatch } = useStore()
  const onHome = state.screen === 'home' || state.screen === 'onboarding'
  return (
    <header className="appbar">
      {!onHome ? (
        <button className="back" onClick={() => dispatch({ type: 'goHome' })} aria-label="ホームに戻る">
          ‹ ホーム
        </button>
      ) : (
        <span className="back" style={{ visibility: 'hidden' }}>
          ‹
        </span>
      )}
      <span className="title">
        <span className="app">StormQuest</span>
      </span>
      <SoundToggle />
      <span className="stars-pill" aria-label={`累計 ${totalStars(state.progress)} スター`}>
        ★ {totalStars(state.progress)}
      </span>
    </header>
  )
}

function Router() {
  const { state } = useStore()
  switch (state.screen) {
    case 'onboarding':
      return <Onboarding />
    case 'home':
      return <HomeScreen />
    case 'play':
      return <PlayScreen />
    case 'result':
      return <ResultScreen />
    case 'complete':
      return <CompleteScreen />
  }
}

export function App() {
  return (
    <StoreProvider>
      <div className="app-shell">
        <div className="app-frame">
          <AppBar />
          <Router />
        </div>
      </div>
    </StoreProvider>
  )
}
