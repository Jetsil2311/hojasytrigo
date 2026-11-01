import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import {
  ArrowRight, Banknote, ChevronDown, ClipboardList, CreditCard, Flame, Layers,
  PlusCircle, Receipt, ShoppingCart, Sparkles, Tag, Wallet,
} from 'lucide-react'
import { useAdminDashboard } from '../../hooks/useAdminDashboard'
import { StatCard, Panel, shortOrderId, itemsPreview, timeAgo } from '../../components/admin/AdminUI'
import { Button, EmptyState, Skeleton, StatusBadge, buttonCls, cx } from '../../components/ui'
import { db, collection, doc, getDocs, onSnapshot, orderBy, query, limit } from '../../demo/store'
import { formatMoney } from '../../utils/cart'
import { PastSessionRow } from './Register'
import { DemoGuide } from '../../components/DemoGuide'

const todayKey = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

// Walkthrough for people opening the panel for the first time.
const ADMIN_GUIDE_STEPS = [
  { title: 'Haz un pedido', text: 'Pide algo desde el menú, como lo haría tu cliente.', to: '/menu', linkLabel: 'Abrir el menú', newTab: true },
  { title: 'Atiéndelo', text: 'Aparece solo en Pedidos. Muévelo a Preparando y a Listo.', to: '/admin/pedidos', linkLabel: 'Ir a Pedidos' },
  { title: 'Cobra en caja', text: 'Abre la caja y registra una venta en el punto de venta.', to: '/admin/pos', linkLabel: 'Ir al punto de venta' },
  { title: 'Cambia tu menú', text: 'Edita un precio o una foto y míralo en el menú al momento.', to: '/admin/menu', linkLabel: 'Editar el menú' },
]

const trendOf = (current, previous) => (previous > 0 ? ((current - previous) / previous) * 100 : null)

export const Overview = () => {
  const { stats, recentOrders, loading } = useAdminDashboard()
  const navigate = useNavigate()

  // Today's register session, live
  const [session, setSession] = useState(undefined)
  useEffect(() => onSnapshot(doc(db, 'register_sessions', todayKey()), (snap) => setSession(snap.exists() ? snap.data() : null)), [])

  // Register history (lazy-loaded, collapsible)
  const [histOpen, setHistOpen] = useState(false)
  const [histSessions, setHistSessions] = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const [histLoaded, setHistLoaded] = useState(false)

  const toggleHist = async () => {
    const next = !histOpen
    setHistOpen(next)
    if (!next || histLoaded) return
    setHistLoading(true)
    try {
      const snap = await getDocs(query(collection(db, 'register_sessions'), orderBy('date', 'desc'), limit(31)))
      setHistSessions(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((s) => s.date !== todayKey()).slice(0, 30))
      setHistLoaded(true)
    } catch { /* keep the panel empty */ }
    setHistLoading(false)
  }

  const quickActions = [
    { name: 'Nueva venta', icon: ShoppingCart, primary: true, action: () => navigate('/admin/pos') },
    { name: 'Agregar producto', icon: PlusCircle, action: () => navigate('/admin/menu', { state: { openAddProduct: true } }) },
    { name: 'Nueva sección', icon: Layers, action: () => navigate('/admin/menu', { state: { openAddSection: true } }) },
    { name: 'Extras', icon: Sparkles, action: () => navigate('/admin/menu', { state: { tab: 'toppings' } }) },
    { name: 'Promoción', icon: Tag, action: () => navigate('/admin/promociones') },
  ]

  const withdrawals = (session?.withdrawals || []).reduce((s, w) => s + w.amount, 0)
  const deposits = (session?.deposits || []).reduce((s, d) => s + d.amount, 0)
  const expectedCash = (session?.openingFloat || 0) + (session?.cashSales || 0) + deposits - withdrawals

  return (
    <div className="space-y-6 animate-fade-in">
      <DemoGuide
        id="admin"
        title="Recorrido de la demo"
        intro="Este es el panel del negocio. Los datos son de ejemplo y puedes cambiar todo sin miedo; “Reiniciar demo” los regresa."
        steps={ADMIN_GUIDE_STEPS}
      />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-ink md:text-4xl">{greeting()}</h2>
          <p className="mt-1 text-muted">
            {loading ? 'Revisando cómo va el día…' : stats.activeOrders > 0
              ? `Hay ${stats.activeOrders} ${stats.activeOrders === 1 ? 'pedido' : 'pedidos'} en curso. Vamos con todo.`
              : 'Cocina al día. Buen momento para un café.'}
          </p>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide md:mx-0 md:flex-wrap md:justify-end md:px-0">
          {quickActions.map((a) => (
            <Button key={a.name} variant={a.primary ? 'primary' : 'outline'} onClick={a.action}>
              <a.icon size={17} />
              {a.name}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard tone="ink" icon={Banknote} label="Ventas de hoy" loading={loading} value={formatMoney(stats.revenueToday)} trend={trendOf(stats.revenueToday, stats.prevRevenueToday)} hint={stats.prevRevenueToday > 0 ? 'vs. ayer a esta hora' : 'Desde que abriste'} />
        <StatCard icon={Receipt} label="Pedidos de hoy" loading={loading} value={stats.ordersToday} trend={trendOf(stats.ordersToday, stats.prevOrdersToday)} hint={stats.prevOrdersToday > 0 ? 'vs. ayer a esta hora' : 'Desde que abriste'} />
        <StatCard icon={Flame} label="En curso" loading={loading} value={stats.activeOrders} hint="Nuevos, preparando o listos" />
        <StatCard icon={Wallet} label="Ticket promedio" loading={loading} value={formatMoney(stats.avgTicket)} hint="Últimos 30 días" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel
          className="lg:col-span-2"
          title="Pedidos recientes"
          action={<NavLink to="/admin/pedidos" className={buttonCls({ variant: 'ghost', size: 'sm' })}>Ver todos <ArrowRight size={15} /></NavLink>}
        >
          {loading ? (
            <div className="space-y-3 px-5 pb-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : recentOrders.length === 0 ? (
            <EmptyState icon={ClipboardList} title="Sin pedidos todavía" text="Cuando entren pedidos del menú o del POS aparecerán aquí." />
          ) : (
            <ul className="px-2 pb-2">
              {recentOrders.slice(0, 6).map((order) => (
                <li key={order.id}>
                  <NavLink to="/admin/pedidos" className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-surface-2">
                    <span className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-xs font-bold text-ink">
                      {shortOrderId(order)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{order.customerName || itemsPreview(order)}</span>
                      <span className="block truncate text-xs text-subtle">
                        {order.customerName ? `${itemsPreview(order)} · ` : ''}{timeAgo(order.createdAt)}
                      </span>
                    </span>
                    <span className="hidden sm:inline-flex"><StatusBadge status={order.status} /></span>
                    <span className="tabular w-20 text-right text-sm font-bold text-ink">{formatMoney(order.total)}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Caja de hoy"
          action={<NavLink to="/admin/caja" className={buttonCls({ variant: 'ghost', size: 'sm' })}>Abrir caja <ArrowRight size={15} /></NavLink>}
          bodyClassName="px-5 pb-5"
        >
          {session === undefined ? (
            <Skeleton className="h-32" />
          ) : !session || session.isClosed ? (
            <div className="rounded-2xl bg-surface-2 p-5 text-center">
              <p className="font-semibold text-ink">{session?.isClosed ? 'La caja ya cerró hoy' : 'La caja sigue cerrada'}</p>
              <p className="mt-1 text-sm text-muted">Ábrela con el fondo inicial para empezar a cobrar.</p>
              <Button className="mt-4" onClick={() => navigate('/admin/caja')}>Ir a caja</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-accent-soft p-4">
                <p className="text-sm font-medium text-accent-ink">Efectivo esperado</p>
                <p className="tabular font-display text-3xl font-bold text-ink">{formatMoney(expectedCash)}</p>
              </div>
              <dl className="space-y-2.5 text-sm">
                {[
                  ['Fondo inicial', session.openingFloat || 0, Wallet],
                  ['Ventas en efectivo', session.cashSales || 0, Banknote],
                  ['Ventas con tarjeta', session.cardSales || 0, CreditCard],
                ].map(([label, val, Icon]) => (
                  <div key={label} className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-2 text-muted"><Icon size={15} /> {label}</dt>
                    <dd className="tabular font-semibold text-ink">{formatMoney(val)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </Panel>
      </div>

      <Panel>
        <button
          type="button"
          onClick={toggleHist}
          aria-expanded={histOpen}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
        >
          <span>
            <span className="block font-display text-lg font-semibold text-ink">Historial de caja</span>
            <span className="text-sm text-muted">Cortes de los últimos 30 días</span>
          </span>
          <ChevronDown size={20} className={cx('shrink-0 text-muted transition-transform', histOpen && 'rotate-180')} />
        </button>
        {histOpen && (
          <div className="border-t border-line">
            {histLoading ? (
              <div className="space-y-2 p-5">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : histSessions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">Todavía no hay cortes anteriores.</p>
            ) : (
              histSessions.map((s) => <PastSessionRow key={s.id} session={s} />)
            )}
          </div>
        )}
      </Panel>
    </div>
  )
}
