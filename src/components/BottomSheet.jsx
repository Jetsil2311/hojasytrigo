import { useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import PropTypes from 'prop-types'
import { Check, Minus, Plus, X } from 'lucide-react'
import { ProductArt } from './ProductArt'
import { cx } from './ui'
import { formatMoney } from '../utils/cart'

// ─── BottomSheet ─────────────────────────────────────────────────────────────
// Option-group picker opened for every product that has optionGroups.
// Mobile  (< 768 px) : full-width bottom sheet, slides up (translateY), swipe-to-dismiss
// Desktop (≥ 768 px) : centered dialog, scale + fade
export const BottomSheet = ({ isOpen, onClose, product, onConfirm }) => {
  const [selections, setSelections] = useState({})
  const [qty, setQty] = useState(1)
  // Mobile drag-to-dismiss state
  const [isDragging, setIsDragging] = useState(false)
  const [dragStartY, setDragStartY] = useState(0)
  const [dragDeltaY, setDragDeltaY] = useState(0)
  // localProduct persists during close animation so content doesn't flash away
  const [localProduct, setLocalProduct] = useState(null)
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
  )
  const [attempted, setAttempted] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const handler = (e) => setIsDesktop(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Sync localProduct: set immediately on open, clear after close animation
  useEffect(() => {
    if (product) {
      setLocalProduct(product)
    } else {
      const t = setTimeout(() => setLocalProduct(null), 350)
      return () => clearTimeout(t)
    }
  }, [product])

  // Reset selections and qty whenever a new product opens.
  useEffect(() => {
    if (isOpen && product) {
      setSelections({})
      setQty(1)
      setDragDeltaY(0)
      setAttempted(false)
      scrollRef.current?.scrollTo({ top: 0 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, product?.id])

  // Body scroll lock
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  // Escape key
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!localProduct) return null

  const optionGroups = localProduct.optionGroups || []

  const missingGroups = optionGroups.filter((g) => g.required && !(selections[g.id] || []).length)
  const isRequiredComplete = missingGroups.length === 0

  const optionsTotal = optionGroups.reduce((sum, g) => {
    const sel = selections[g.id] || []
    return sum + (g.options || []).filter((o) => sel.includes(o.id)).reduce((s, o) => s + Number(o.priceModifier || 0), 0)
  }, 0)

  const unitTotal = Number(localProduct.price || 0) + optionsTotal
  const grandTotal = unitTotal * qty

  const toggleOption = (group, optId) => {
    setSelections((prev) => {
      const curr = prev[group.id] || []
      if (group.type === 'single') {
        // Tapping the selected option of an optional group clears it.
        if (!group.required && curr.includes(optId)) return { ...prev, [group.id]: [] }
        return { ...prev, [group.id]: [optId] }
      }
      if (curr.includes(optId)) return { ...prev, [group.id]: curr.filter((x) => x !== optId) }
      return { ...prev, [group.id]: [...curr, optId] }
    })
  }

  const buildSelectedOptions = () => {
    const opts = []
    optionGroups.forEach((g) => {
      const sel = selections[g.id] || []
      ;(g.options || []).filter((o) => sel.includes(o.id)).forEach((o) => {
        opts.push({
          groupId: g.id,
          groupName: g.name,
          optionId: o.id,
          optionName: o.name,
          priceModifier: Number(o.priceModifier || 0),
        })
      })
    })
    return opts
  }

  const handleConfirm = () => {
    if (!isRequiredComplete) {
      // Point at the first group still waiting for a choice.
      setAttempted(true)
      const el = scrollRef.current?.querySelector(`[data-group="${missingGroups[0].id}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    onConfirm({ selectedOptions: buildSelectedOptions(), qty })
  }

  // ── Mobile-only: touch swipe-to-dismiss (from the handle/header) ─────────
  const handleTouchStart = (e) => {
    setIsDragging(true)
    setDragStartY(e.touches[0].clientY)
    setDragDeltaY(0)
  }
  const handleTouchMove = (e) => {
    if (!isDragging) return
    setDragDeltaY(Math.max(0, e.touches[0].clientY - dragStartY))
  }
  const handleTouchEnd = () => {
    if (dragDeltaY > 90) onClose()
    setDragDeltaY(0)
    setIsDragging(false)
  }

  const panelStyle = isDesktop
    ? {
        transform: isOpen ? 'translate(-50%, -50%) scale(1)' : 'translate(-50%, -50%) scale(0.96)',
        opacity: isOpen ? 1 : 0,
        transition: isOpen
          ? 'opacity 240ms cubic-bezier(0.34,1.4,0.64,1), transform 240ms cubic-bezier(0.34,1.4,0.64,1)'
          : 'opacity 180ms ease-in, transform 180ms ease-in',
        pointerEvents: isOpen ? 'auto' : 'none',
      }
    : {
        transform: isOpen ? `translateY(${dragDeltaY}px)` : 'translateY(100%)',
        transition: isDragging ? 'none' : 'transform 320ms cubic-bezier(0.32,0.72,0,1)',
        pointerEvents: isOpen ? 'auto' : 'none',
      }

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50" role="dialog" aria-modal={isOpen ? 'true' : 'false'} aria-label={`Personaliza ${localProduct.name}`}>
      <div
        className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px]"
        style={{ opacity: isOpen ? 1 : 0, transition: 'opacity 300ms ease', pointerEvents: isOpen ? 'auto' : 'none' }}
        onClick={onClose}
      />

      <div
        style={panelStyle}
        className={cx(
          'absolute flex flex-col overflow-hidden bg-surface shadow-pop',
          isDesktop
            ? 'top-1/2 left-1/2 max-h-[86vh] w-[460px] max-w-[calc(100vw-32px)] rounded-3xl'
            : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl',
        )}
      >
        {/* Header: art + name. Doubles as the drag handle on phones. */}
        <div
          className="shrink-0"
          onTouchStart={!isDesktop ? handleTouchStart : undefined}
          onTouchMove={!isDesktop ? handleTouchMove : undefined}
          onTouchEnd={!isDesktop ? handleTouchEnd : undefined}
        >
          {!isDesktop && (
            <div className="flex justify-center pt-2.5" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-line-strong" />
            </div>
          )}
          <div className="flex items-start gap-4 px-5 pt-3 pb-4 md:px-6 md:pt-6">
            <ProductArt product={localProduct} className="h-20 w-20 shrink-0" rounded="rounded-2xl" iconSize={34} />
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 className="font-display text-xl font-bold leading-tight text-ink">{localProduct.name}</h3>
              {localProduct.long_desc || localProduct.desc ? (
                <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-muted">{localProduct.long_desc || localProduct.desc}</p>
              ) : null}
              <p className="tabular mt-1.5 text-sm font-semibold text-ink">Desde {formatMoney(Number(localProduct.price || 0))}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="-mt-1 -mr-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary hover:text-ink"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable options */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto overscroll-contain border-t border-line">
          {optionGroups.map((group) => {
            const sel = selections[group.id] || []
            const isMissing = attempted && group.required && sel.length === 0
            return (
              <fieldset key={group.id} data-group={group.id} className="border-b border-line px-5 py-5 md:px-6">
                <legend className="sr-only">{group.name}</legend>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-display text-base font-semibold text-ink">{group.name}</p>
                  <span
                    className={cx(
                      'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                      isMissing ? 'bg-danger-soft text-danger' : group.required ? 'bg-accent-soft text-accent-ink' : 'bg-secondary text-muted',
                    )}
                  >
                    {group.required ? (isMissing ? 'Elige una opción' : 'Obligatorio') : group.type === 'single' ? 'Opcional' : 'Elige las que quieras'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(group.options || []).map((opt) => {
                    const isSelected = sel.includes(opt.id)
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleOption(group, opt.id)}
                        aria-pressed={isSelected}
                        className={cx(
                          'inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium transition-colors duration-150',
                          isSelected
                            ? 'border-accent bg-accent text-on-accent'
                            : 'border-line-strong bg-surface text-ink hover:border-ink',
                        )}
                      >
                        {isSelected && <Check size={15} strokeWidth={2.75} />}
                        <span>{opt.name}</span>
                        {Number(opt.priceModifier) > 0 && (
                          <span className={cx('tabular text-xs', isSelected ? 'opacity-80' : 'text-subtle')}>
                            +{formatMoney(Number(opt.priceModifier))}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </fieldset>
            )
          })}

          <div className="flex items-center justify-between px-5 py-5 md:px-6">
            <p className="font-display text-base font-semibold text-ink">Cantidad</p>
            <div className="flex items-center gap-1 rounded-full bg-secondary p-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Quitar uno"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-soft transition disabled:opacity-40"
              >
                <Minus size={18} />
              </button>
              <span className="tabular w-8 text-center text-base font-bold text-ink" aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Agregar uno"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink shadow-soft transition"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="shrink-0 border-t border-line bg-surface px-5 pt-4 pb-safe md:px-6 md:pb-5">
          <button
            type="button"
            onClick={handleConfirm}
            className={cx(
              'flex h-14 w-full items-center justify-between rounded-full px-6 text-base font-bold transition-[opacity,transform] duration-200 active:scale-[0.99]',
              isRequiredComplete ? 'bg-primary text-on-primary hover:opacity-90' : 'bg-secondary text-muted',
            )}
          >
            <span>{isRequiredComplete ? 'Agregar al pedido' : `Falta elegir ${missingGroups[0]?.name?.toLowerCase() ?? ''}`}</span>
            <span className="tabular">{formatMoney(grandTotal)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

BottomSheet.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    desc: PropTypes.string,
    long_desc: PropTypes.string,
    imageUrl: PropTypes.string,
    image: PropTypes.string,
    optionGroups: PropTypes.array,
    availableToppings: PropTypes.array,
  }),
  onConfirm: PropTypes.func.isRequired,
}
