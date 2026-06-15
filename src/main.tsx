import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens.css'
import './styles/app.css'
import './styles/screens.css'
import { App } from './App'
import { registerSink } from './game/analytics'
import {
  shouldEnableGoatCounter,
  makeGoatCounterSink,
} from './game/goatcounter'

// 計測 sink 登録（モジュールトップ1回。PROD かつ サイトコードあり、かつ DNT 非設定のみ）。
// 未契約/DEV は no-op＝GitHub Pages 静的でそのまま壊れず動く。StrictMode 二重実行は
// import 副作用なので1回だけ（モジュール評価は1度）。
const gcCode = import.meta.env.VITE_GOATCOUNTER_CODE
const dnt = typeof navigator !== 'undefined' && navigator.doNotTrack === '1'
if (shouldEnableGoatCounter(import.meta.env) && gcCode && !dnt) {
  registerSink(makeGoatCounterSink(`https://${gcCode}.goatcounter.com/count`))
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
