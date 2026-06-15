import { useEffect } from 'react'
import { STAGES } from '../data/stages'
import { useStore } from '../store'
import { totalStars } from '../game/progress'
import { track } from '../game/analytics'
import { soundEngine as sound } from '../game/sound'
import { haptics } from '../game/haptics'

export function CompleteScreen() {
  const { state, dispatch } = useStore()
  const stars = totalStars(state.progress)
  const maxStars = STAGES.length * 3
  const vocabCount = state.progress.unlockedVocab.length

  // 完走ファンファーレ（2秒以内）。celebrateFlash は CSS で1回。
  useEffect(() => {
    sound.play('fanfare')
    haptics.fire('fanfare')
  }, [])

  function share() {
    const text = `StormQuest 全章クリア！ ピザデリバリーとタスク管理で EventStorming の記法（集約・不変条件まで）を ${vocabCount}語マスター・${stars}/${maxStars}★ 🌩️`
    const url = 'https://rikuto125.github.io/sample/'
    // クリック=意図を計測（成功 callback は端末依存なので追わない）。北極星=シェア率。
    const canWebShare = 'share' in navigator
    track('share_clicked', {
      method: canWebShare ? 'webshare' : 'twitter',
      stars,
      vocabCount,
    })
    if (canWebShare) {
      navigator.share({ title: 'StormQuest', text, url }).catch(() => {})
    } else {
      const intent = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
        text,
      )}&url=${encodeURIComponent(url)}`
      window.open(intent, '_blank', 'noopener')
    }
  }

  return (
    <div className="screen complete screen-dark celebrate">
      <div className="finish-emoji">🎉</div>
      <div className="result-title">全章 完全制覇！</div>
      <p className="finish-lead">
        ドメインイベント・コマンド・アクター・ポリシー・外部システム・リードモデル、
        そして<strong>集約と不変条件</strong>——
        EventStormingとDDDをつなぐ記法と語彙を、手が覚えました。
      </p>

      <div className="finish-stats">
        <div className="stat">
          <span className="stat-num">{stars}</span>
          <span className="stat-lbl">/ {maxStars} ★</span>
        </div>
        <div className="stat">
          <span className="stat-num">{vocabCount}</span>
          <span className="stat-lbl">用語マスター</span>
        </div>
      </div>

      <button className="btn-primary" onClick={share}>
        🌩️ 成果をシェアする
      </button>

      <div className="next-chapter">
        <div className="nc-label">NEXT CHAPTER（予告）</div>
        <div className="nc-title">第3章 — ⏰ サブスク課金ドメイン</div>
        <div className="nc-def">
          時間で発火するポリシー（Scheduled Policy）が主役。
          「更新日が来たら課金する」をどう描く？ 集約をまたぐ
          <strong>整合性</strong>と<strong>時間トリガー</strong>へ。
        </div>
      </div>

      <p className="finish-note">
        EventStormingの真価は「人と認識を合わせる対話」。次はぜひ、
        実際のワークショップで仲間と付箋を貼り合ってみてください。
      </p>

      <button className="btn-ghost on-dark" onClick={() => dispatch({ type: 'goHome' })}>
        ホームへ
      </button>
    </div>
  )
}
