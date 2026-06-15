import { useState } from 'react'
import { useStore, commitSandbox } from '../store'
import { createWork, deleteWork, cloneSample, summarizeWork } from '../game/sandbox'
import { SAMPLE_WORKS } from '../data/sampleWorks'
import type { SandboxWork } from '../game/sandboxTypes'
import { SandboxCanvas } from './SandboxCanvas'
import { Icon } from './Icon'

/**
 * 個人ワーク（サンドボックス）のハブ。保存済みワーク一覧＋新規作成＋削除＋お手本。
 * 採点ゲームとは別系統（engine/Progress には触れない）。
 */
export function SandboxHubScreen() {
  const { state, dispatch } = useStore()
  const [title, setTitle] = useState('')
  const [domain, setDomain] = useState('')
  const [preview, setPreview] = useState<SandboxWork | null>(null)
  const works = Object.values(state.sandbox.works).sort(
    (a, b) => b.updatedAt - a.updatedAt,
  )

  function create() {
    if (!title.trim()) return
    const { store, id } = createWork(state.sandbox, title, domain, Date.now())
    dispatch({ type: 'openWork', sandbox: commitSandbox(store), workId: id })
  }

  function open(id: string) {
    dispatch({ type: 'openWork', sandbox: state.sandbox, workId: id })
  }

  function remove(id: string) {
    dispatch({ type: 'setSandbox', sandbox: commitSandbox(deleteWork(state.sandbox, id)) })
  }

  function startFromSample(sample: SandboxWork) {
    const { store, id } = cloneSample(state.sandbox, sample, Date.now())
    dispatch({ type: 'openWork', sandbox: commitSandbox(store), workId: id })
  }

  // プレビューは読み取り専用キャンバス（編集系 callback は no-op）。
  const noop = () => {}

  return (
    <div className="screen sandbox-hub">
      <button className="back" onClick={() => dispatch({ type: 'goHome' })}>
        <Icon name="back" size={16} /> ホーム
      </button>

      <h2 className="sandbox-hub-title">
        <Icon name="scenario" size={22} /> 個人ワーク（EventStorming）
      </h2>
      <p className="sandbox-hub-lead">
        自分の実務ドメインのイベントを入力して、1人で EventStorming
        を組み立てるツール。採点はありません（唯一解はない）。
      </p>

      <div className="sandbox-new">
        <input
          className="sandbox-input"
          value={title}
          placeholder="ワークの名前（例: 受注フロー）"
          onChange={(e) => setTitle(e.target.value)}
          aria-label="ワークの名前"
        />
        <input
          className="sandbox-input"
          value={domain}
          placeholder="対象の業務領域（例: ECの注文〜出荷）"
          onChange={(e) => setDomain(e.target.value)}
          aria-label="対象の業務領域"
        />
        <button className="btn-primary" onClick={create} disabled={!title.trim()}>
          <Icon name="plus" size={16} /> 新しいワークを作る
        </button>
      </div>

      <section className="sandbox-samples" aria-label="お手本">
        <h3 className="sandbox-samples-title">
          <Icon name="info" size={16} /> イメージが湧かないとき：お手本から始める
        </h3>
        {SAMPLE_WORKS.map((sample) => {
          const total = summarizeWork(sample).total
          const isOpen = preview?.id === sample.id
          return (
            <div key={sample.id} className="sandbox-sample-card">
              <div className="sandbox-sample-head">
                <div>
                  <span className="sandbox-sample-name">
                    {sample.title.replace(/^【お手本】\s*/, '')}
                  </span>
                  <span className="sandbox-sample-meta">
                    {sample.domainDescription} ・ 付箋 {total}
                  </span>
                </div>
              </div>
              <div className="sandbox-sample-actions">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => startFromSample(sample)}
                >
                  <Icon name="plus" size={14} /> このお手本から作る
                </button>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => setPreview(isOpen ? null : sample)}
                  aria-expanded={isOpen}
                >
                  <Icon name={isOpen ? 'up' : 'down'} size={14} />{' '}
                  {isOpen ? '閉じる' : '中身を見る'}
                </button>
              </div>
              {isOpen && (
                <div className="sandbox-sample-preview">
                  <SandboxCanvas
                    cards={sample.cards}
                    onMove={noop}
                    onRemove={noop}
                    onRelabel={noop}
                    readOnly
                  />
                </div>
              )}
            </div>
          )
        })}
      </section>

      {works.length > 0 && (
        <ul className="sandbox-work-list">
          {works.map((w) => (
            <li key={w.id} className="sandbox-work-row">
              <button className="sandbox-work-open btn-reset" onClick={() => open(w.id)}>
                <span className="sandbox-work-name">{w.title}</span>
                <span className="sandbox-work-meta">
                  {w.domainDescription || '（説明なし）'} ・ 付箋{' '}
                  {summarizeWork(w).total}
                </span>
              </button>
              <button
                className="sandbox-work-del btn-reset"
                onClick={() => remove(w.id)}
                aria-label={`${w.title} を削除`}
              >
                <Icon name="trash" size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <p className="finish-note sandbox-hub-note">
        EventStorming の真価は「人と認識を合わせる対話」。1人ワークで掴んだら、
        次はぜひ実ワークショップで仲間と付箋を貼り合ってみてください。
      </p>
    </div>
  )
}
