import { StoreProvider, useStore } from './store'
import { totalStars } from './game/progress'
import { HomeScreen } from './components/HomeScreen'
import { PlayScreen } from './components/PlayScreen'
import { ResultScreen } from './components/ResultScreen'
import { CompleteScreen } from './components/CompleteScreen'
import { Onboarding } from './components/Onboarding'

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
