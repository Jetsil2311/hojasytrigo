/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { Check, Info } from 'lucide-react'
import { formatMoney } from '../utils/cart'
import { Button, Dialog, cx } from './ui'

// Extras picker shown after the options sheet (or directly for products that
// only have toppings). Also used from the cart to edit an item's extras.
// Props:
//   isOpen          — controls visibility
//   onClose         — called when user dismisses without confirming
//   productName     — shown in the header
//   productPrice    — base + options price (number) used for the running total
//   toppings        — [{id, name, price, description?}] available toppings
//   initialSelected — [{id, name, price}] pre-selected toppings (edit mode)
//   onConfirm       — (selectedToppings: [{id, name, price}]) => void
//   confirmLabel    — button label
export const ToppingsOverlay = ({
  isOpen,
  onClose,
  productName = '',
  productPrice = 0,
  toppings = [],
  initialSelected = [],
  onConfirm,
  confirmLabel = 'Agregar al pedido',
}) => {
  const [selectedIds, setSelectedIds] = useState([])
  const [expandedDescId, setExpandedDescId] = useState(null)

  // Sync pre-selection whenever the overlay opens.
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(initialSelected.map((t) => t.id))
      setExpandedDescId(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const toggle = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  const selectedToppings = toppings.filter((t) => selectedIds.includes(t.id))
  const toppingsTotal = selectedToppings.reduce((s, t) => s + Number(t.price || 0), 0)

  const handleConfirm = () => {
    onConfirm?.(selectedToppings)
    onClose()
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      title="¿Le ponemos algo extra?"
      description={productName}
      size="sm"
      layer="z-[60]"
      footer={
        <Button block size="lg" onClick={handleConfirm} className="justify-between px-6">
          <span>{selectedToppings.length ? confirmLabel : 'Así está perfecto'}</span>
          <span className="tabular">{formatMoney(Number(productPrice) + toppingsTotal)}</span>
        </Button>
      }
    >
      {toppings.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Este producto no tiene extras disponibles.</p>
      ) : (
        <ul className="space-y-2 pt-1">
          {toppings.map((topping) => {
            const checked = selectedIds.includes(topping.id)
            const descOpen = expandedDescId === topping.id
            return (
              <li key={topping.id}>
                <div
                  className={cx(
                    'flex items-center gap-3 rounded-2xl border px-4 transition-colors',
                    checked ? 'border-primary bg-surface-2' : 'border-line hover:border-line-strong',
                  )}
                >
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={checked}
                    onClick={() => toggle(topping.id)}
                    className="flex min-h-14 flex-1 items-center gap-3 text-left"
                  >
                    <span
                      className={cx(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-colors',
                        checked ? 'border-primary bg-primary text-on-primary' : 'border-line-strong',
                      )}
                    >
                      {checked && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 text-sm font-medium text-ink">{topping.name}</span>
                    <span className="tabular text-sm font-semibold text-muted">+{formatMoney(Number(topping.price || 0))}</span>
                  </button>
                  {topping.description && (
                    <button
                      type="button"
                      onClick={() => setExpandedDescId(descOpen ? null : topping.id)}
                      aria-label={`Qué es ${topping.name}`}
                      aria-expanded={descOpen}
                      className="-mr-2 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-subtle hover:bg-secondary hover:text-ink"
                    >
                      <Info size={16} />
                    </button>
                  )}
                </div>
                {descOpen && topping.description && (
                  <p className="px-4 pt-2 pb-1 text-sm text-muted">{topping.description}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Dialog>
  )
}
