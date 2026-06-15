import {
  Zap,
  Play,
  User,
  Cog,
  Cloud,
  ClipboardList,
  Package,
  Clock,
  Bike,
  TriangleAlert,
  Plug,
  Ban,
  Flag,
  Pizza,
  ListChecks,
  ShieldCheck,
  Repeat,
  ScrollText,
  Timer,
  Target,
  Lightbulb,
  Volume2,
  VolumeX,
  Info,
  Link2,
  Lock,
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Star,
  Check,
  ChevronLeft,
  ChevronDown,
  X,
  Hand,
  Plus,
  Sparkles,
  Trophy,
  Share2,
  Download,
  FolderOpen,
  Trash2,
  Pencil,
  CircleHelp,
  type LucideIcon,
  type LucideProps,
} from 'lucide-react'

/**
 * アプリ全体のアイコン・レジストリ（唯一の解決点）。
 *
 * 方針:
 * - データ層（src/game, src/data）は UI 非依存を保つため、アイコンを「意味トークン」
 *   （'event' / 'pizza' など）として持つ。lucide のコンポーネント参照はここ（UI層）でだけ解決する。
 * - 絵文字は使わない。種別の三重冗長（色＋アイコン＋ラベル）の「アイコン」は SVG で統一する。
 *   絵文字→SVG は表現の置換であり、EventStorming の記法概念（⚡=雷, ▶=再生…）は不変。
 */
const REGISTRY = {
  // --- EventStorming カード種別（cardMeta.ts が指す意味トークン）---
  event: Zap,
  command: Play,
  actor: User,
  policy: Cog,
  externalSystem: Cloud,
  readModel: ClipboardList,
  aggregate: Package,

  // --- ステージ／章のテーマアイコン（src/data）---
  clock: Clock,
  scooter: Bike,
  alert: TriangleAlert,
  plug: Plug,
  box: Package,
  gate: Ban,
  finish: Flag,
  pizza: Pizza,
  checklist: ListChecks,

  // --- 補助用語（glossary）---
  shield: ShieldCheck,
  transition: Repeat,

  // --- UI 共通 ---
  scenario: ScrollText,
  timer: Timer,
  target: Target,
  sparkles: Sparkles,
  trophy: Trophy,
  hint: Lightbulb,
  soundOn: Volume2,
  soundOff: VolumeX,
  info: Info,
  chain: Link2,
  lock: Lock,
  next: ArrowRight,
  down: ArrowDown,
  up: ArrowUp,
  star: Star,
  check: Check,
  back: ChevronLeft,
  more: ChevronDown,
  close: X,
  wave: Hand,
  plus: Plus,
  share: Share2,
  download: Download,
  folder: FolderOpen,
  trash: Trash2,
  edit: Pencil,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof REGISTRY

interface IconProps extends Omit<LucideProps, 'ref'> {
  // IconName のリテラル補完を効かせつつ任意文字列も受ける
  // （glossary.icon 等の string 由来トークンも渡せる）。
  name: IconName | (string & {})
}

/**
 * 意味トークン名から lucide アイコンを描画する。
 * 既定では装飾扱い（aria-hidden）。テキストラベルと併用する三重冗長前提。
 * 未知トークンはヘルプ記号にフォールバックして握りつぶす（壊さない）。
 */
export function Icon({ name, size = 18, strokeWidth = 2.25, ...rest }: IconProps) {
  const Cmp = (REGISTRY as Record<string, LucideIcon>)[name] ?? CircleHelp
  return <Cmp size={size} strokeWidth={strokeWidth} aria-hidden {...rest} />
}

/**
 * 星評価（★★☆ のテキスト相当）を SVG で。獲得＝塗り、未獲得＝抜き。
 * 色だけに依存しないよう塗り／抜きの差でも判別可能にする（design-system §3.1）。
 */
export function Stars({
  value,
  max = 3,
  size = 18,
  className,
}: {
  value: number
  max?: number
  size?: number
  className?: string
}) {
  return (
    <span className={`stars ${className ?? ''}`} aria-label={`${value} / ${max} 星`}>
      {Array.from({ length: max }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={2.25}
          className={i < value ? 'star-on' : 'star-off'}
          fill={i < value ? 'currentColor' : 'none'}
          aria-hidden
        />
      ))}
    </span>
  )
}
