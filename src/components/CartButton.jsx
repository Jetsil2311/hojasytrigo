import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { ShoppingBag } from 'lucide-react'
import { formatMoney } from '../utils/cart'
import { cx } from './ui'

// Floating "view order" pill. Full width at the bottom on phones, a compact
// pill bottom-right on larger screens. Hidden while the cart is empty.
// The forwarded ref is the flyToCart animation target and is always mounted.
export const CartButton = forwardRef(function CartButton({ isOpen, count, onClick, total = 0 }, ref) {
  const visible = count > 0 && !isOpen

  return (
    <div
      className={cx(
        'fixed inset-x-0 bottom-0 z-40 px-4 pb-safe transition-[transform,opacity] duration-300 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:px-0 sm:pb-0',
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0',
      )}
    >
      <button
        type="button"
        onClick={onClick}
        aria-label={`Ver pedido: ${count} ${count === 1 ? 'producto' : 'productos'}, ${formatMoney(total)}`}
        aria-expanded={isOpen}
        tabIndex={visible ? 0 : -1}
        className="flex h-14 w-full items-center gap-3 rounded-full bg-primary pr-6 pl-2 text-on-primary shadow-pop transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.98] sm:w-auto sm:min-w-72"
      >
        <span ref={ref} className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-on-accent">
          <ShoppingBag size={19} strokeWidth={2.25} />
          <span className="tabular absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-surface px-1 text-[11px] font-bold text-ink shadow-soft">
            {count}
          </span>
        </span>
        <span className="text-sm font-semibold">Ver mi pedido</span>
        <span className="tabular ml-auto text-sm font-bold">{formatMoney(total)}</span>
      </button>
    </div>
  )
})

CartButton.propTypes = {
  isOpen: PropTypes.bool,
  count: PropTypes.number,
  onClick: PropTypes.func.isRequired,
  total: PropTypes.number,
}
