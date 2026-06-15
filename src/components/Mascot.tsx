/**
 * StormQuest のマスコット「ボルト（雷雲）」。
 * EventStorming＝"嵐"の比喩 ＋ ドメインイベントの ⚡ に合わせた、雷雲のキャラクター。
 * 絵文字でなく SVG で描く（ブランド配色＝ウォーム・クラフトに馴染む雲色＋金の雷）。
 * 表情で気分を出す: happy（通常）/ cheer（祝福）/ think（考え中）。
 */
export type MascotMood = 'happy' | 'cheer' | 'think'

interface MascotProps {
  mood?: MascotMood
  size?: number
  className?: string
}

export function Mascot({ mood = 'happy', size = 96, className = '' }: MascotProps) {
  return (
    <svg
      className={`mascot mascot--${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label="マスコットのボルト"
    >
      {/* 影 */}
      <ellipse cx="60" cy="108" rx="30" ry="6" fill="rgba(60,45,28,.18)" />

      {/* 雷（先に描いて雲の下から覗かせる） */}
      <g className="mascot-bolt">
        <path
          d="M58 70 L46 96 L57 96 L52 116 L74 88 L62 88 L70 70 Z"
          fill="var(--reward)"
          stroke="var(--reward-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </g>

      {/* 雲のからだ（複数の円が重なって雲のシルエットに） */}
      <g className="mascot-body">
        <circle cx="40" cy="58" r="22" fill="#fbf7ee" stroke="#d8ccb2" strokeWidth="3" />
        <circle cx="80" cy="56" r="20" fill="#fbf7ee" stroke="#d8ccb2" strokeWidth="3" />
        <circle cx="58" cy="40" r="22" fill="#fbf7ee" stroke="#d8ccb2" strokeWidth="3" />
        <rect x="24" y="52" width="72" height="26" rx="13" fill="#fbf7ee" stroke="#d8ccb2" strokeWidth="3" />
        {/* 縁取りの上に内側を塗り直して継ぎ目を消す */}
        <circle cx="40" cy="58" r="19" fill="#fbf7ee" />
        <circle cx="80" cy="56" r="17" fill="#fbf7ee" />
        <circle cx="58" cy="40" r="19" fill="#fbf7ee" />
        <rect x="27" y="55" width="66" height="20" rx="10" fill="#fbf7ee" />
      </g>

      {/* ほっぺ（ティールのチーク） */}
      <circle cx="38" cy="58" r="6" fill="var(--accent)" opacity="0.18" />
      <circle cx="82" cy="58" r="6" fill="var(--accent)" opacity="0.18" />

      {/* 目 */}
      {mood === 'cheer' ? (
        <>
          {/* うれしい目（^ ^） */}
          <path d="M40 50 q5 -7 10 0" fill="none" stroke="#2b2622" strokeWidth="3.4" strokeLinecap="round" />
          <path d="M70 50 q5 -7 10 0" fill="none" stroke="#2b2622" strokeWidth="3.4" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="46" cy="50" r="4.6" fill="#2b2622" />
          <circle cx="74" cy="50" r="4.6" fill="#2b2622" />
          <circle cx="47.6" cy="48.4" r="1.5" fill="#fff" />
          <circle cx="75.6" cy="48.4" r="1.5" fill="#fff" />
        </>
      )}

      {/* 口 */}
      {mood === 'cheer' ? (
        <path d="M52 60 q8 12 16 0 q-8 5 -16 0 Z" fill="#b9542f" stroke="#8f3f22" strokeWidth="1.5" />
      ) : mood === 'think' ? (
        <circle cx="60" cy="62" r="3" fill="none" stroke="#2b2622" strokeWidth="3" />
      ) : (
        <path d="M52 60 q8 9 16 0" fill="none" stroke="#2b2622" strokeWidth="3.4" strokeLinecap="round" />
      )}
    </svg>
  )
}
