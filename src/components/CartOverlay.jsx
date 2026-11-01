/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Coffee, MessageCircle, Minus, NotebookPen, Pencil, Plus, Trash2, X } from 'lucide-react'
import { formatMoney, lineTotal, unitPrice } from '../utils/cart'
import { Button, ConfirmDialog, EmptyState, IconButton, cx, useLockBodyScroll } from './ui'

// Order drawer: right-side panel on desktop, bottom sheet on phones.
// States: list of items, sending, and "order sent" confirmation.
export const CartOverlay = ({
  isOpen,
  onClose,
  cart,
  cartCount,
  cartTotal,
  orderNotes,
  setOrderNotes,
  onChangeQty,
  onOrder,
  onClearCart,
  onEditToppings,
  orderState = 'idle', // 'idle' | 'sending' | 'sent'
  lastOrderId = null,
  onWhatsApp,
  onNewOrder,
}) => {
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false)
  // Kitchen notes stay folded until the customer asks for them.
  const [isNotesOpen, setIsNotesOpen] = useState(false)
  useLockBodyScroll(isOpen)

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (e) => { if (e.key === 'Escape' && !isClearConfirmOpen) onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose, isClearConfirmOpen])

  return createPortal(
    <>
      <div
        className={cx('fixed inset-0 z-50 transition-[visibility] duration-300', isOpen ? 'visible pointer-events-auto' : 'invisible pointer-events-none')}
        aria-hidden={!isOpen}
      >
        <div
          className={cx('absolute inset-0 bg-scrim/50 backdrop-blur-[2px] transition-opacity duration-300', isOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onClose}
        />

        <aside
          role="dialog"
          aria-modal="true"
          aria-label="Tu pedido"
          className={cx(
            'absolute flex flex-col bg-surface shadow-pop transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]',
            'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl',
            'md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-3xl',
            isOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-x-full md:translate-y-0',
          )}
        >
          <div className="flex justify-center pt-2.5 md:hidden" aria-hidden="true">
            <div className="h-1 w-10 rounded-full bg-line-strong" />
          </div>

          <header className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 md:px-6 md:pt-6">
            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-ink">
                {orderState === 'sent' ? 'Pedido enviado' : 'Tu pedido'}
              </h2>
              {orderState !== 'sent' && cartCount > 0 && (
                <p className="text-sm text-muted">{cartCount} {cartCount === 1 ? 'producto' : 'productos'}</p>
              )}
            </div>
            <IconButton label="Cerrar" onClick={onClose}><X size={20} /></IconButton>
          </header>

          {orderState === 'sent' ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 pb-10 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-success-soft text-success animate-pop-in">
                <CheckCircle2 size={40} strokeWidth={1.75} />
              </div>
              <p className="font-display text-xl font-semibold text-ink">¡Listo! Ya lo estamos preparando</p>
              <p className="mt-2 max-w-xs text-sm text-muted">
                Tu número de pedido es <span className="font-bold text-ink">#{lastOrderId?.slice(-4)}</span>. Te llamamos cuando esté listo.
              </p>
              <p className="mt-4 max-w-xs rounded-2xl bg-secondary px-4 py-3 text-xs text-muted">
                Demo: abre el panel en otra pestaña y verás este pedido aparecer en Pedidos.
              </p>
              <div className="mt-6 flex w-full max-w-xs flex-col gap-2">
                {onWhatsApp && (
                  <Button variant="outline" block onClick={onWhatsApp}>
                    <MessageCircle size={18} /> Enviar también por WhatsApp
                  </Button>
                )}
                <Button block onClick={onNewOrder}>Seguir viendo el menú</Button>
              </div>
            </div>
          ) : cartCount === 0 ? (
            <div className="flex flex-1 items-center justify-center pb-10">
              <EmptyState
                icon={Coffee}
                title="Tu pedido está vacío"
                text="Más vacío que la cafetera a las siete de la mañana. Agrega algo rico del menú."
                action={<Button variant="secondary" onClick={onClose}>Ver el menú</Button>}
              />
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto overscroll-contain px-5 md:px-6">
                <ul className="divide-y divide-line">
                  {cart.map((item) => {
                    const hasToppings = item.availableToppings?.length > 0
                    const extras = [
                      ...(item.selectedOptions || []).map((o) => o.optionName),
                      ...(item.selectedToppings || []).map((t) => t.name),
                    ]
                    return (
                      <li key={item.cartItemId} className="flex gap-3 py-4">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-snug text-ink">{item.name}</p>
                          {extras.length > 0 && (
                            <p className="mt-0.5 text-sm leading-relaxed text-muted">{extras.join(', ')}</p>
                          )}
                          <div className="mt-1 flex items-center gap-3 text-sm">
                            <span className="tabular text-subtle">{formatMoney(unitPrice(item))} c/u</span>
                            {hasToppings && (
                              <button
                                type="button"
                                onClick={() => onEditToppings?.(item.cartItemId)}
                                className="inline-flex min-h-8 items-center gap-1 font-semibold text-ink underline-offset-4 hover:underline"
                              >
                                <Pencil size={13} /> Extras
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className="tabular font-bold text-ink">{formatMoney(lineTotal(item))}</span>
                          <div className="flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
                            <button
                              type="button"
                              onClick={() => onChangeQty(item.cartItemId, -1)}
                              aria-label={item.qty === 1 ? `Quitar ${item.name}` : `Uno menos de ${item.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-surface"
                            >
                              {item.qty === 1 ? <Trash2 size={15} /> : <Minus size={15} />}
                            </button>
                            <span className="tabular w-6 text-center text-sm font-bold text-ink">{item.qty}</span>
                            <button
                              type="button"
                              onClick={() => onChangeQty(item.cartItemId, 1)}
                              aria-label={`Uno más de ${item.name}`}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink transition hover:bg-surface"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </li>
                    )
                  })}
                </ul>

                <div className="pt-2 pb-6">
                  {!isNotesOpen && !orderNotes ? (
                    <button
                      type="button"
                      onClick={() => setIsNotesOpen(true)}
                      aria-expanded="false"
                      aria-controls="order-notes"
                      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-ink"
                    >
                      <NotebookPen size={16} className="text-accent-ink" />
                      Agregar una nota para la cocina
                    </button>
                  ) : (
                  <>
                  <label htmlFor="order-notes" className="block text-sm font-semibold text-ink">Notas para la cocina</label>
                  <textarea
                    autoFocus={isNotesOpen && !orderNotes}
                    id="order-notes"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    rows={2}
                    maxLength={240}
                    placeholder="Sin azúcar, para llevar, la salsa aparte…"
                    className="mt-2 w-full resize-none rounded-xl border border-line-strong bg-surface px-3.5 py-3 text-base text-ink placeholder:text-subtle outline-none transition focus:border-ink focus:ring-2 focus:ring-accent/40 md:text-sm"
                  />
                  </>
                  )}
                  <div className="mt-1 flex justify-between text-xs text-subtle">
                    <button type="button" onClick={() => setIsClearConfirmOpen(true)} className="inline-flex min-h-8 items-center gap-1 font-semibold text-danger hover:underline">
                      <Trash2 size={13} /> Vaciar pedido
                    </button>
                    {(isNotesOpen || orderNotes) && <span className="tabular">{orderNotes.length}/240</span>}
                  </div>
                </div>
              </div>

              <footer className="border-t border-line px-5 pt-4 pb-safe md:px-6 md:pb-6">
                <div className="mb-3 flex items-baseline justify-between">
                  <span className="text-sm font-medium text-muted">Total</span>
                  <span className="tabular font-display text-2xl font-bold text-ink">{formatMoney(cartTotal)}</span>
                </div>
                <Button size="lg" block onClick={onOrder} disabled={orderState === 'sending'}>
                  {orderState === 'sending' ? 'Enviando…' : 'Enviar pedido'}
                </Button>
              </footer>
            </>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={isClearConfirmOpen}
        title="¿Vaciar tu pedido?"
        text="Se quitarán todos los productos que agregaste."
        confirmLabel="Sí, vaciar"
        onConfirm={() => { onClearCart(); setIsClearConfirmOpen(false) }}
        onCancel={() => setIsClearConfirmOpen(false)}
      />
    </>,
    document.body,
  )
}
