/* eslint-disable react/prop-types */
// Product visual. Shows the uploaded photo when there is one; otherwise an
// illustrated tile (soft color + icon) so the demo looks finished without
// any real product photography.
import { forwardRef, useState } from 'react'
import {
  Coffee, CupSoda, GlassWater, Milk, Leaf, Croissant, Cookie, CakeSlice,
  Sandwich, Salad, Egg, Wheat, Donut, Citrus, Flower2, UtensilsCrossed,
  Hamburger, Beef, Drumstick, EggFried, IceCreamCone, Cherry, Banana, Martini, Ham, Soup,
} from 'lucide-react'

const ICONS = {
  coffee: Coffee,
  'cup-soda': CupSoda,
  glass: GlassWater,
  milk: Milk,
  leaf: Leaf,
  croissant: Croissant,
  cookie: Cookie,
  cake: CakeSlice,
  sandwich: Sandwich,
  salad: Salad,
  egg: Egg,
  wheat: Wheat,
  donut: Donut,
  citrus: Citrus,
  flower: Flower2,
  burger: Hamburger,
  beef: Beef,
  drumstick: Drumstick,
  'egg-fried': EggFried,
  'ice-cream': IceCreamCone,
  cherry: Cherry,
  banana: Banana,
  martini: Martini,
  ham: Ham,
  soup: Soup,
}

export const ICON_CHOICES = Object.keys(ICONS)

export const ProductIcon = ({ name, ...props }) => {
  const Icon = ICONS[name] ?? UtensilsCrossed
  return <Icon {...props} />
}

// Guesses an icon for products created from the admin without one.
const KEYWORDS = [
  [/hamburgues|burger/i, 'burger'],
  [/alitas|boneless/i, 'drumstick'],
  [/arrachera|cheesesteak|gringa/i, 'beef'],
  [/malteada|helado/i, 'ice-cream'],
  [/a[cç]a[ií]|frutos rojos/i, 'cherry'],
  [/carajillo|t[oó]nic/i, 'martini'],
  [/frapp|helad|smooth|soda|refresco|boba/i, 'cup-soda'],
  [/latte|leche|capuch|flat/i, 'milk'],
  [/caf|espresso|americano|mocha|cold brew/i, 'coffee'],
  [/t[eé]\b|chai|matcha|tisana|infusi/i, 'leaf'],
  [/limon|naranj|jugo|agua/i, 'citrus'],
  [/croissant|cuernito/i, 'croissant'],
  [/galleta|cookie/i, 'cookie'],
  [/pastel|brownie|bread|panqu|muffin|cake/i, 'cake'],
  [/dona|rol|concha|pan dulce/i, 'donut'],
  [/s[aá]ndwich|torta|panini|bagel|baguette/i, 'sandwich'],
  [/bowl|ensalada|yogurt|fruta/i, 'salad'],
  [/huevo|chilaquil|omelet|molletes/i, 'egg'],
  [/toast|pan\b/i, 'wheat'],
]

export const iconKeyFor = (product = {}) => {
  if (product.icon && ICONS[product.icon]) return product.icon
  const hay = `${product.name ?? ''} ${product.section ?? ''}`
  const hit = KEYWORDS.find(([re]) => re.test(hay))
  return hit ? hit[1] : null
}

const TILES = ['bg-tile-1', 'bg-tile-2', 'bg-tile-3', 'bg-tile-4', 'bg-tile-5', 'bg-tile-6']

const tileFor = (seed = '') => {
  let h = 0
  for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return TILES[h % TILES.length]
}

export const ProductArt = forwardRef(function ProductArt(
  { product = {}, className = '', iconSize = 40, rounded = 'rounded-2xl' },
  ref,
) {
  const [failed, setFailed] = useState(false)
  const src = product.imageUrl
  const Icon = ICONS[iconKeyFor(product)] ?? UtensilsCrossed

  if (src && !failed) {
    return (
      <div className={`relative overflow-hidden bg-secondary ${rounded} ${className}`}>
        <img
          ref={ref}
          src={src}
          alt={product.name ?? ''}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      </div>
    )
  }

  return (
    <div
      ref={ref}
      role="img"
      aria-label={product.name ?? ''}
      className={`relative flex items-center justify-center overflow-hidden ${tileFor(product.id ?? product.name)} ${rounded} ${className}`}
    >
      {/* Print-like hatching, then a stamped disc with a dashed ring */}
      <div className="tile-hatch absolute inset-0" aria-hidden="true" />
      <div className="absolute flex h-[64%] max-h-32 aspect-square items-center justify-center rounded-full bg-surface/70" aria-hidden="true">
        <div className="absolute inset-[7%] rounded-full border border-dashed border-tile-ink/30" />
      </div>
      <Icon size={iconSize} strokeWidth={1.5} className="relative text-tile-ink" aria-hidden="true" />
    </div>
  )
})
