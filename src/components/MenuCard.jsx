import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { Check, Flame, Info, Plus, SlidersHorizontal } from 'lucide-react'
import { ProductArt } from './ProductArt'
import { Badge, cx } from './ui'
import { formatMoney } from '../utils/cart'

// Menu product card. The whole card is one tap target that goes through the
// shared addToCart flow (options sheet, toppings, or straight to the cart).
// Phones get a compact row; wider screens get a vertical card.
export const MenuCard = ({
  name,
  long_desc,
  desc,
  price,
  image,
  imageUrl,
  icon,
  section,
  id,
  isActive = true,
  availableToppings = [],
  optionGroups = [],
  featured = false,
  popular = false,
  layout = 'auto', // 'auto' (row on phones, card on sm+) | 'row' (always row)
  onAddToCart,
}) => {
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const addedTimerRef = useRef(null)
  const artRef = useRef(null)
  const infoRef = useRef(null)

  const isDisabled = isActive === false
  // Responsive classes only apply in auto layout.
  const sm = (classes) => (layout === 'row' ? '' : classes)
  const hasOptions = Array.isArray(optionGroups) && optionGroups.length > 0
  const isCustomizable = hasOptions || availableToppings.length > 0

  // Close the info popover on outside tap, scroll or Escape.
  useEffect(() => {
    if (!isInfoOpen) return
    const close = () => setIsInfoOpen(false)
    const onPointer = (e) => { if (!infoRef.current?.contains(e.target)) close() }
    const onKey = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('pointerdown', onPointer, true)
    window.addEventListener('scroll', close, { passive: true, capture: true })
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer, true)
      window.removeEventListener('scroll', close, { capture: true })
      window.removeEventListener('keydown', onKey)
    }
  }, [isInfoOpen])

  useEffect(() => () => clearTimeout(addedTimerRef.current), [])

  const handleAddClick = (e) => {
    if (isDisabled) return
    const rect = artRef.current?.getBoundingClientRect?.() ?? e.currentTarget.getBoundingClientRect()
    const src = artRef.current?.currentSrc || artRef.current?.src || null
    onAddToCart?.({
      id, name, price, desc, long_desc, image, imageUrl, icon, section,
      fromRect: rect,
      flyImageSrc: src,
      availableToppings,
      optionGroups,
    })
    if (!isCustomizable) {
      clearTimeout(addedTimerRef.current)
      setAdded(true)
      addedTimerRef.current = setTimeout(() => setAdded(false), 900)
    }
  }

  return (
    <li
      className={cx(
        'group relative flex rounded-2xl border border-t-[3px] border-t-primary bg-surface transition-[box-shadow,border-color,transform] duration-200',
        'flex-row-reverse gap-3 p-3',
        sm('sm:flex-col sm:gap-0 sm:p-0'),
        isDisabled
          ? 'border-line opacity-70'
          : 'border-line hover:-translate-y-0.5 hover:border-line-strong hover:shadow-soft',
        added && 'border-accent ring-2 ring-accent/50',
        isInfoOpen ? 'z-20' : 'z-0',
      )}
    >
      {/* Stretched tap target covering the whole card */}
      <button
        type="button"
        onClick={handleAddClick}
        disabled={isDisabled}
        aria-label={isDisabled ? `${name}, agotado` : `Agregar ${name}, ${formatMoney(Number(price))}${isCustomizable ? ', personalizable' : ''}`}
        className="absolute inset-0 z-0 rounded-2xl disabled:cursor-not-allowed"
      />

      {/* Art */}
      <div className={cx('pointer-events-none relative shrink-0', sm('sm:p-2 sm:pb-0'))}>
        <ProductArt
          ref={artRef}
          product={{ id, name, imageUrl, icon, section }}
          className={cx('h-24 w-24', sm('sm:aspect-[4/3] sm:h-auto sm:w-full'), isDisabled && 'grayscale')}
          rounded="rounded-xl"
          iconSize={36}
        />
        {(popular || featured) && !isDisabled && (
          <Badge tone="stamp" className={cx('absolute -top-1.5 -left-1.5 shadow-soft', sm('sm:top-4 sm:left-4'))}>
            <Flame size={12} strokeWidth={2.5} />
            Favorito de la casa
          </Badge>
        )}
        {isDisabled && (
          <Badge tone="ink" className={cx('absolute -top-1.5 -left-1.5', sm('sm:top-4 sm:left-4'))}>Agotado</Badge>
        )}
      </div>

      {/* Body */}
      <div className={cx('pointer-events-none flex min-w-0 flex-1 flex-col', sm('sm:px-4 sm:pt-3 sm:pb-4'))}>
        <h3 className="font-display text-base font-bold leading-snug tracking-tight text-ink">{name}</h3>
        {desc && <p className={cx('mt-1 line-clamp-2 text-sm leading-relaxed text-muted', sm('sm:mb-3'))}>{desc}</p>}

        <div className={cx('mt-auto flex items-end justify-between gap-2 pt-3', sm('sm:mt-auto sm:border-t sm:border-dashed sm:border-line-strong'))}>
          <div className="flex flex-col">
            <span className="tabular font-display text-lg font-extrabold tracking-tight text-ink">{formatMoney(Number(price))}</span>
            {isCustomizable && !isDisabled && (
              <span className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-subtle">
                <SlidersHorizontal size={12} />
                Personalizable
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {long_desc && (
              <div ref={infoRef} className="pointer-events-auto relative z-10">
                <button
                  type="button"
                  onClick={() => setIsInfoOpen((v) => !v)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-subtle transition-colors hover:bg-secondary hover:text-ink"
                  aria-label={`Más sobre ${name}`}
                  aria-expanded={isInfoOpen}
                >
                  <Info size={18} />
                </button>
                {isInfoOpen && (
                  <div
                    role="tooltip"
                    className="absolute right-0 bottom-full mb-2 w-64 rounded-2xl border border-line bg-surface p-4 text-sm leading-relaxed text-muted shadow-pop animate-pop-in"
                  >
                    {long_desc}
                  </div>
                )}
              </div>
            )}

            <span
              aria-hidden="true"
              className={cx(
                'inline-flex h-11 w-11 items-center justify-center rounded-full transition-[transform,background-color] duration-200',
                isDisabled ? 'bg-secondary text-subtle' : 'bg-primary text-on-primary group-hover:scale-105',
                added && 'scale-110',
              )}
            >
              {added ? <Check size={20} strokeWidth={2.5} /> : <Plus size={20} strokeWidth={2.5} />}
            </span>
          </div>
        </div>
      </div>
    </li>
  )
}

MenuCard.propTypes = {
  name: PropTypes.string.isRequired,
  long_desc: PropTypes.string,
  desc: PropTypes.string,
  price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  image: PropTypes.string,
  imageUrl: PropTypes.string,
  icon: PropTypes.string,
  section: PropTypes.string,
  isActive: PropTypes.bool,
  featured: PropTypes.bool,
  popular: PropTypes.bool,
  layout: PropTypes.oneOf(['auto', 'row']),
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  availableToppings: PropTypes.arrayOf(
    PropTypes.shape({ id: PropTypes.string, name: PropTypes.string, price: PropTypes.number })
  ),
  optionGroups: PropTypes.array,
  onAddToCart: PropTypes.func,
}
