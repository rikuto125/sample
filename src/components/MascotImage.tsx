// マスコット（ボルト）の写真。円メダリオン（wink/idea）と全身（wave/stand/sad）の2系統。
// 盤面の記法アイコンには使わない（色＋lucide＋ラベルの三重冗長を崩さない）。
// 画像は public/brand/ にあり、base 込みで解決する。

export type MascotImageMood = 'wink' | 'idea' | 'wave' | 'stand' | 'sad'

// 全身は高さ基準で表示し、幅は画像の実アスペクトに任せる（歪まない・画像差し替えにも強い）。
// 円メダリオン（正方形）は size×size。
const FULL_BODY = new Set<MascotImageMood>(['wave', 'stand', 'sad'])

interface MascotImageProps {
  /** wink=祝福 ・ idea=ひらめき ・ wave=手振り(全身) ・ stand=立ち(全身) ・ sad=しょんぼり(全身) */
  mood?: MascotImageMood
  /** メダリオンは一辺、全身は高さ */
  size?: number
  className?: string
  /** 小サイズ向けに低解像度版を使う（表示 ≤ 96px 目安） */
  small?: boolean
}

const BASE = (import.meta.env.BASE_URL ?? '/').replace(/\/?$/, '/')

export function MascotImage({
  mood = 'wink',
  size = 120,
  className = '',
  small = false,
}: MascotImageProps) {
  const file = `mascot-${mood}${small ? '-sm' : ''}.png`
  const isFull = FULL_BODY.has(mood)
  return (
    <img
      className={`mascot-image ${isFull ? 'mascot-full' : 'mascot-medallion'} ${className}`}
      src={`${BASE}brand/${file}`}
      // 全身は高さだけ固定し、幅は実アスペクトに任せる（CSS の width:auto）。
      height={size}
      width={isFull ? undefined : size}
      style={isFull ? { height: size, width: 'auto' } : undefined}
      alt="マスコットのボルト"
      decoding="async"
      // 装飾。読み込み失敗してもレイアウトを崩さない。
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}
