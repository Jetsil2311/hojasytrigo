/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { db, collection, onSnapshot } from '../../demo/store'
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Banknote, Receipt, Smartphone, Wallet } from 'lucide-react'
import { StatCard } from '../../components/admin/AdminUI'
import { Card, EmptyState, Segmented, Skeleton } from '../../components/ui'
import { formatMoney } from '../../utils/cart'

const RANGE_OPTIONS = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
]

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`

// Top products from the structured items array (falls back to content lines).
const itemsOf = (order) => {
  if (Array.isArray(order.items) && order.items.length) return order.items.map((it) => ({ name: it.name, qty: it.qty || 1 }))
  return (order.content || '')
    .split('\n')
    .map((l) => l.trim().match(/^\d+\.\s*(\d+)\s*x\s+(.+?)\s*(?:\[.*?\])?\s*-\s/))
    .filter(Boolean)
    .map((m) => ({ qty: Number(m[1] || 1), name: m[2].trim() }))
}

const ChartTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const p = payload[0].payload
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2 shadow-pop">
      <p className="text-xs font-medium text-subtle first-letter:uppercase">{p.full}</p>
      <p className="tabular font-display text-lg font-bold text-ink">{formatMoney(p.revenue)}</p>
      <p className="text-xs text-muted">{p.count} {p.count === 1 ? 'pedido' : 'pedidos'}</p>
    </div>
  )
}

export const Metrics = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(7)

  useEffect(() => {
    return onSnapshot(collection(db, 'orders'), (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ ...d.data(), id: d.id, createdAt: d.data().createdAt?.toDate() || new Date() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const periodStart = new Date(today)
  periodStart.setDate(periodStart.getDate() - (days - 1))
  const prevStart = new Date(periodStart)
  prevStart.setDate(prevStart.getDate() - days)

  const periodOrders = orders.filter((o) => o.createdAt >= periodStart)
  const prevOrders = orders.filter((o) => o.createdAt >= prevStart && o.createdAt < periodStart)

  // Day-by-day revenue for the chart
  const byDay = new Map()
  periodOrders.forEach((o) => {
    const k = dayKey(o.createdAt)
    const cur = byDay.get(k) || { revenue: 0, count: 0 }
    byDay.set(k, { revenue: cur.revenue + Number(o.total || 0), count: cur.count + 1 })
  })
  const series = [...Array(days)].map((_, i) => {
    const d = new Date(periodStart)
    d.setDate(d.getDate() + i)
    const v = byDay.get(dayKey(d)) || { revenue: 0, count: 0 }
    return {
      name: days <= 7 ? d.toLocaleDateString('es-MX', { weekday: 'short' }) : d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
      full: d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }),
      ...v,
    }
  })

  // Top products in the period
  const productCounts = {}
  periodOrders.forEach((o) => itemsOf(o).forEach(({ name, qty }) => { productCounts[name] = (productCounts[name] || 0) + qty }))
  const topProducts = Object.entries(productCounts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6)
  const maxCount = topProducts[0]?.count || 1

  const periodRev = periodOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const prevRev = prevOrders.reduce((s, o) => s + Number(o.total || 0), 0)
  const revChange = prevRev > 0 ? ((periodRev - prevRev) / prevRev) * 100 : null
  const ordersChange = prevOrders.length > 0 ? ((periodOrders.length - prevOrders.length) / prevOrders.length) * 100 : null
  const avgTicket = periodOrders.length ? periodRev / periodOrders.length : 0
  const menuShare = periodOrders.length ? (periodOrders.filter((o) => o.source === 'menu').length / periodOrders.length) * 100 : 0

  const bestDay = series.reduce((best, d) => (d.revenue > (best?.revenue ?? -1) ? d : best), null)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted">
          {bestDay && bestDay.revenue > 0
            ? <>Tu mejor día fue el <span className="font-semibold text-ink">{bestDay.full}</span> con {formatMoney(bestDay.revenue)}.</>
            : 'Aquí verás cómo se mueven tus ventas.'}
        </p>
        <Segmented value={days} onChange={setDays} options={RANGE_OPTIONS} />
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard tone="ink" icon={Banknote} label="Ingresos" loading={loading} value={formatMoney(periodRev)} trend={revChange} hint="vs. periodo anterior" />
        <StatCard icon={Receipt} label="Pedidos" loading={loading} value={periodOrders.length.toLocaleString('es-MX')} trend={ordersChange} hint="vs. periodo anterior" />
        <StatCard icon={Wallet} label="Ticket promedio" loading={loading} value={formatMoney(avgTicket)} />
        <StatCard icon={Smartphone} label="Pedidos desde el menú" loading={loading} value={`${menuShare.toFixed(0)} %`} hint="El resto entró por el POS" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-ink">Ingresos por día</h2>
          <p className="text-sm text-muted">Pesos mexicanos, impuestos incluidos</p>
          {loading ? (
            <Skeleton className="mt-5 h-72" />
          ) : (
            <div className="mt-5 h-72 w-full" role="img" aria-label={`Ingresos por día en los últimos ${days} días`}>
              <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height: 288 }}>
                <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-chart-fill)" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="var(--color-chart-fill)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--color-line)" strokeDasharray="3 4" vertical={false} />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                    dy={8}
                    interval={days > 14 ? Math.ceil(days / 8) : 0}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tick={{ fill: 'var(--color-subtle)', fontSize: 12 }}
                    tickFormatter={(v) => (v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${v}`)}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'var(--color-line-strong)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--color-ink)"
                    strokeWidth={2}
                    fill="url(#revFill)"
                    activeDot={{ r: 5, fill: 'var(--color-ink)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold text-ink">Lo más pedido</h2>
          <p className="text-sm text-muted">Unidades vendidas en el periodo</p>
          {loading ? (
            <div className="mt-5 space-y-4">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-8" />)}</div>
          ) : topProducts.length === 0 ? (
            <EmptyState title="Sin datos todavía" text="Cuando haya ventas en este periodo aparecerán aquí." />
          ) : (
            <ol className="mt-5 space-y-4">
              {topProducts.map((p, i) => (
                <li key={p.name}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="tabular w-4 shrink-0 text-sm font-bold text-subtle">{i + 1}</span>
                      <span className="truncate text-sm font-semibold text-ink">{p.name}</span>
                    </span>
                    <span className="tabular text-sm font-bold text-ink">{p.count}</span>
                  </div>
                  <div className="mt-1.5 ml-6 h-2 rounded-full bg-primary" style={{ width: `calc(${(p.count / maxCount) * 100}% - 1.5rem)`, opacity: i === 0 ? 1 : 0.35 }} />
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  )
}
