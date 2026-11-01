/* eslint-disable react/prop-types */
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { Bell, Settings, Lock, LockOpen, Clock } from 'lucide-react'
import { useRegister } from '../../hooks/useRegister'
import { useSettings } from '../../hooks/useSettings'
import { MobileSettingsSheet } from './MobileSettingsSheet'
import { PinPrompt } from './PinGate'
import { findAdminItem } from './navItems'
import { IconButton, cx } from '../ui'
import { formatMoney } from '../../utils/cart'
import { db, doc, setDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot } from '../../demo/store'

const timeAgo = (date) => {
  if (!date) return ''
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  return `hace ${Math.floor(mins / 60)} h`
}

const RegisterPill = ({ open, className = '' }) => (
  <span
    className={cx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
      open ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
      className,
    )}
  >
    <span className={cx('h-1.5 w-1.5 rounded-full', open ? 'bg-success' : 'bg-danger')} />
    {open ? 'Caja abierta' : 'Caja cerrada'}
  </span>
)

export const Topbar = ({ pinGateConfig }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { isRegisterOpen, loading } = useRegister()
  const { settings } = useSettings()

  const item = findAdminItem(location.pathname)
  const routeKey = item.key
  const isCurrentlyLocked = !!pinGateConfig?.[routeKey]

  // PIN prompt for the lock toggle
  const [pinPromptOpen, setPinPromptOpen] = useState(false)
  const lockActionLabel = isCurrentlyLocked ? `Quitar el PIN de ${item.name}` : `Proteger ${item.name} con PIN`

  const handlePinConfirm = async () => {
    await setDoc(
      doc(db, 'settings', 'general'),
      { pinGateConfig: { ...pinGateConfig, [routeKey]: !isCurrentlyLocked }, updatedAt: serverTimestamp() },
      { merge: true }
    )
  }

  // Bell: live list of the latest "Nuevo" orders
  const [bellOpen, setBellOpen] = useState(false)
  const bellRef = useRef(null)
  const [newOrders, setNewOrders] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(30))
    return onSnapshot(q, (snap) => {
      setNewOrders(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data(), createdAt: d.data().createdAt?.toDate?.() ?? null }))
          .filter((o) => (o.status || 'Nuevo').toLowerCase() === 'nuevo')
          .slice(0, 5)
      )
    })
  }, [])

  useEffect(() => {
    if (!bellOpen) return
    const handler = (e) => { if (!bellRef.current?.contains(e.target)) setBellOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bellOpen])

  const [settingsOpen, setSettingsOpen] = useState(false)

  // Close popovers when navigating
  useEffect(() => { setSettingsOpen(false); setBellOpen(false) }, [location.pathname])

  const formattedDate = new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-line bg-bg/90 px-4 backdrop-blur-md md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <img src="/logo.svg" alt="" className="h-8 w-8 shrink-0 md:hidden" />
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight text-ink md:text-xl">{item.title}</h1>
            <p className="hidden text-xs font-medium text-subtle first-letter:uppercase md:block">{formattedDate}</p>
          </div>
          {!loading && <span className="hidden md:block"><RegisterPill open={isRegisterOpen} /></span>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <span className="mr-1 hidden rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs font-semibold text-muted lg:inline-flex">
            Modo demo
          </span>

          {pinGateConfig && (
            <IconButton label={lockActionLabel} onClick={() => setPinPromptOpen(true)}>
              {isCurrentlyLocked ? <Lock size={19} className="text-warning" /> : <LockOpen size={19} />}
            </IconButton>
          )}

          <div className="relative" ref={bellRef}>
            <IconButton label="Pedidos nuevos" onClick={() => setBellOpen((v) => !v)} aria-expanded={bellOpen} className="relative">
              <Bell size={19} />
              {newOrders.length > 0 && (
                <span className="tabular absolute top-1.5 right-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold text-on-accent ring-2 ring-bg">
                  {newOrders.length}
                </span>
              )}
            </IconButton>

            {bellOpen && (
              <div className="fixed inset-x-4 top-16 z-50 mt-1 overflow-hidden rounded-2xl border border-line bg-surface shadow-pop animate-pop-in sm:absolute sm:inset-x-auto sm:top-auto sm:right-0 sm:mt-2 sm:w-80">
                <div className="flex items-center justify-between px-4 pt-4 pb-2">
                  <p className="font-display font-semibold text-ink">Pedidos nuevos</p>
                  <span className="text-xs font-medium text-subtle">{newOrders.length} esperando</span>
                </div>
                {newOrders.length === 0 ? (
                  <p className="px-4 pt-2 pb-5 text-sm text-muted">Todo al día. No hay pedidos esperando.</p>
                ) : (
                  <ul className="max-h-80 overflow-y-auto px-2">
                    {newOrders.map((order) => {
                      const names = Array.isArray(order.items) ? order.items.map((i) => i.name) : []
                      const preview = names.length > 1 ? `${names[0]} y ${names.length - 1} más` : names[0] || 'Pedido'
                      return (
                        <li key={order.id}>
                          <button
                            type="button"
                            onClick={() => { setBellOpen(false); navigate('/admin/pedidos') }}
                            className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-secondary"
                          >
                            <span className="tabular flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-info-soft text-xs font-bold text-info">
                              {(order.orderId || order.id).slice(-4)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-semibold text-ink">{order.customerName || preview}</span>
                              <span className="flex items-center gap-1 text-xs text-subtle">
                                <Clock size={11} /> {timeAgo(order.createdAt)}
                                {order.source === 'menu' && <span className="ml-1 font-semibold text-accent-ink">Desde el menú</span>}
                              </span>
                            </span>
                            <span className="tabular text-sm font-bold text-ink">{formatMoney(order.total)}</span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div className="border-t border-line p-2">
                  <button
                    type="button"
                    onClick={() => { setBellOpen(false); navigate('/admin/pedidos') }}
                    className="h-10 w-full rounded-full text-sm font-semibold text-ink transition-colors hover:bg-secondary"
                  >
                    Ver todos los pedidos
                  </button>
                </div>
              </div>
            )}
          </div>

          <IconButton label="Ajustes" onClick={() => setSettingsOpen(true)}>
            <Settings size={19} />
          </IconButton>
        </div>
      </header>

      {/* Phones: register status strip under the header */}
      {!loading && (
        <button
          type="button"
          onClick={() => navigate('/admin/caja')}
          className={cx(
            'flex h-8 shrink-0 items-center justify-center gap-2 text-xs font-semibold md:hidden',
            isRegisterOpen ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
          )}
        >
          <span className={cx('h-1.5 w-1.5 rounded-full', isRegisterOpen ? 'bg-success' : 'bg-danger')} />
          {isRegisterOpen ? 'Caja abierta' : 'Caja cerrada. Toca para abrirla'}
        </button>
      )}

      <MobileSettingsSheet open={settingsOpen} settings={settings} onClose={() => setSettingsOpen(false)} />

      <PinPrompt
        isOpen={pinPromptOpen}
        onClose={() => setPinPromptOpen(false)}
        onConfirm={handlePinConfirm}
        actionLabel={lockActionLabel}
      />
    </>
  )
}
