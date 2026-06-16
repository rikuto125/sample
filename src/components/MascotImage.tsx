// マスコット（ボルト）の写真調メダリオン。希少な達成の場面（完走など）にだけ使う。
// 盤面の記法アイコンには使わない（色＋lucide＋ラベルの三重冗長を崩さない）。
// 画像は public/brand/ にあり、base 込みで解決する。

export type MascotImageMood = 'wink' | 'idea'

interface MascotImageProps {
  /** wink=祝福/応援 ・ idea=ひらめき/ヒント */
  mood?: MascotImageMood
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
  return (
    <img
      className={`mascot-image ${className}`}
      src={`${BASE}brand/${file}`}
      width={size}
      height={size}
      alt="マスコットのボルト"
      decoding="async"
      // 達成演出の装飾。読み込み失敗してもレイアウトを崩さない。
      onError={(e) => {
        e.currentTarget.style.display = 'none'
      }}
    />
  )
}
