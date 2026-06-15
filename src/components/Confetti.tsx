import { useMemo } from 'react'

/**
 * 完走画面だけの控えめな紙吹雪（DESIGN.md §4.2: コンフェッティは最小限・完走画面のみ）。
 * CSS アニメで一度だけ落ちる。prefers-reduced-motion では動かない（tokens.css が無効化）。
 * ブランド配色（ティール／金／テラコッタ／クリーム）の小片。射幸的に盛らない。
 */
const COLORS = ['var(--accent)', 'var(--reward)', 'var(--accent-2)', '#fbf7ee', 'var(--accent-soft)']

export function Confetti({ count = 16 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.round((i / count) * 100 + (Math.random() * 8 - 4)),
        delay: Math.round(Math.random() * 250),
        dur: 1400 + Math.round(Math.random() * 900),
        color: COLORS[i % COLORS.length],
        rot: Math.round(Math.random() * 360),
        round: i % 3 === 0,
      })),
    [count],
  )
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            background: p.color,
            borderRadius: p.round ? '50%' : '2px',
            animationDelay: `${p.delay}ms`,
            animationDuration: `${p.dur}ms`,
            ['--rot' as string]: `${p.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
