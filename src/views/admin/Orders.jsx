/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { db, collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp } from '../../demo/store'
import { formatMoney, lineTotal } from '../../utils/cart'
import { ArrowRight, Check, ClipboardList, Printer, Search, Smartphone, StickyNote, X } from 'lucide-react'
import { useSettings } from '../../hooks/useSettings'
import { printReceipt } from '../../utils/printReceipt'
import { SearchField, shortOrderId, timeAgo } from '../../components/admin/AdminUI'
import { Badge, Button, Card, EmptyState, IconButton, Segmented, Skeleton, StatusBadge, cx } from '../../components/ui'

// ─── Status config ─────────────────────────────────────────────────────────────

const STATUSES = ['Nuevo', 'Preparando', 'Listo', 'Pagado']

const ACTION_LABELS = {
  Preparando: 'Empezar',
  Listo: 'Marcar listo',
  Pagado: 'Entregar y cobrar',
}

const COLUMN_COPY = {
  Nuevo: 'Recién llegados',
  Preparando: 'En la barra',
  Listo: 'Para entregar',
}

// Migrate legacy status names to the canonical set
const normalizeStatus = (raw) => {
  if (!raw) return 'Nuevo'
  const lower = raw.toLowerCase()
  if (lower === 'en preparación' || lower === 'en preparacion') return 'Preparando'
  if (lower === 'entregado') return 'Pagado'
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase()
}

const nextStatus = (current) => {
  const idx = STATUSES.indexOf(normalizeStatus(current))
  if (idx === -1 || idx === STATUSES.length - 1) return null
  return STATUSES[idx + 1]
}

// Oldest first inside the active board, so nobody waits forever.
const byOldest = (a, b) => (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0)

const getOrderNote = (order) => {
  if (order.generalNote) return order.generalNote
  const noteLine = (order.content || '').split('\n').find((l) => l.startsWith('Notas:'))
  return noteLine?.replace('Notas:', '').trim() ?? null
}

// Item lines (prefers the items array, falls back to the legacy content string)
const ItemList = ({ order }) => {
  if (Array.isArray(order.items) && order.items.length > 0) {
    return (
      <ul className="space-y-1.5">
        {order.items.map((it, i) => {
          const extras = [
            ...(it.selectedOptions || []).map((o) => o.optionName),
            ...(it.selectedToppings || []).map((t) => t.name),
          ]
          return (
            <li key={i} className="flex items-start justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="tabular font-bold text-ink">{it.qty}×</span>{' '}
                <span className="font-medium text-ink">{it.name}</span>
                {extras.length > 0 && <span className="block text-xs text-muted">{extras.join(', ')}</span>}
                {it.itemNote && <span className="block text-xs font-medium text-accent-ink">Nota: {it.itemNote}</span>}
              </span>
              <span className="tabular shrink-0 text-xs text-subtle">{formatMoney(lineTotal({ ...it, qty: it.qty || 1 }))}</span>
            </li>
          )
        })}
      </ul>
    )
  }
  const lines = (order.content || '').split('\n').filter((l) => /^\d+\./.test(l.trim())).map((l) => l.replace(/^\d+\.\s*/, ''))
  return (
    <ul className="space-y-1 text-sm text-ink">
      {lines.length ? lines.map((l, i) => <li key={i}>{l}</li>) : <li className="text-muted">Sin detalle.</li>}
    </ul>
  )
}

// One order card, used in the board and in the list
const OrderCard = ({ order, onAdvance, updatingId, onReprint, reprintingId, printingEnabled, compact }) => {
  const next = nextStatus(order.status)
  const isPaid = order.status === 'Pagado'
  const note = getOrderNote(order)
  const waitMins = Math.floor((Date.now() - order.createdAt.getTime()) / 60000)
  const isLate = !isPaid && waitMins >= 15

  return (
    <Card className={cx('flex flex-col p-4 transition-shadow hover:shadow-soft', isPaid && 'bg-surface-2')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="tabular flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary font-display text-sm font-bold text-ink">
            {shortOrderId(order)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{order.customerName || (order.source === 'menu' ? 'Pedido en línea' : 'Cliente de mostrador')}</p>
            <p className={cx('text-xs font-medium', isLate ? 'text-danger' : 'text-subtle')} title={order.createdAt.toLocaleString('es-MX')}>
              {timeAgo(order.createdAt)}{isLate ? ' · esperando' : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          {!compact && <StatusBadge status={order.status} />}
          {order.source === 'menu' && (
            <Badge tone="accent"><Smartphone size={12} /> Menú</Badge>
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-line pt-3">
        <ItemList order={order} />
      </div>

      {note && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm text-accent-ink">
          <StickyNote size={15} className="mt-0.5 shrink-0" /> {note}
        </p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <div>
          <p className="tabular font-display text-lg font-bold text-ink">{formatMoney(Number(order.total || 0))}</p>
          {order.paymentMethods && (
            <p className="text-xs text-subtle">
              {[order.paymentMethods.cash > 0 && 'Efectivo', order.paymentMethods.card > 0 && 'Tarjeta', order.paymentMethods.loyalty > 0 && 'Saldo'].filter(Boolean).join(' + ') || 'Pagado'}
            </p>
          )}
        </div>
        {next ? (
          <Button size="sm" variant={next === 'Pagado' ? 'outline' : 'primary'} onClick={() => onAdvance(order.id, next)} disabled={updatingId === order.id}>
            {next === 'Pagado' && order.paymentMethods ? 'Entregar' : ACTION_LABELS[next]} <ArrowRight size={15} />
          </Button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-success"><Check size={16} /> Completado</span>
            {printingEnabled && (
              <IconButton label="Reimprimir ticket" size="sm" onClick={() => onReprint(order)} disabled={reprintingId === order.id}>
                <Printer size={16} />
              </IconButton>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

// ─── Orders view ───────────────────────────────────────────────────────────────

export const Orders = () => {
  const { settings } = useSettings()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('Activos')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)
  const [reprintingId, setReprintingId] = useState(null)
  const [, setTick] = useState(0)

  // Live listener
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        status: normalizeStatus(d.data().status),
        createdAt: d.data().createdAt?.toDate() ?? new Date(),
        updatedAt: d.data().updatedAt?.toDate() ?? null,
      })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  // Refresh relative times every 30 s
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  const updateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId)
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus, updatedAt: serverTimestamp() })
    } catch (err) {
      console.error('Error updating order status:', err)
    } finally {
      setUpdatingId(null)
    }
  }

  const reprint = async (order) => {
    setReprintingId(order.id)
    await printReceipt(order, settings)
    setReprintingId(null)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const term = search.trim().toLowerCase()
  const matches = (o) =>
    !term ||
    (o.orderId ?? o.id).toLowerCase().includes(term) ||
    (o.customerName ?? '').toLowerCase().includes(term) ||
    (o.items || []).some((it) => it.name.toLowerCase().includes(term)) ||
    (o.content ?? '').toLowerCase().includes(term)

  const counts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: orders.filter((o) => o.status === s).length }), {})
  const activeCount = counts.Nuevo + counts.Preparando + counts.Listo

  const visible = orders.filter(matches)
  const isBoard = filterStatus === 'Activos'
  const listed = isBoard
    ? []
    : visible
        .filter((o) => o.status === filterStatus)
        .sort((a, b) => filterStatus === 'Pagado'
          ? (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt)
          : byOldest(a, b))
        .slice(0, filterStatus === 'Pagado' ? 60 : undefined)

  const cardProps = {
    onAdvance: updateStatus, updatingId,
    onReprint: reprint, reprintingId,
    printingEnabled: !!settings?.printingEnabled,
  }

  const filterOptions = [
    { value: 'Activos', label: 'En curso', count: activeCount },
    ...STATUSES.map((s) => ({ value: s, label: s, count: s === 'Pagado' ? undefined : counts[s] })),
  ]

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 overflow-x-auto px-4 scrollbar-hide lg:mx-0 lg:px-0">
          <Segmented options={filterOptions} value={filterStatus} onChange={setFilterStatus} />
        </div>
        <SearchField
          value={search}
          onChange={setSearch}
          onClear={() => setSearch('')}
          icon={Search}
          clearIcon={X}
          placeholder="Buscar por número, cliente o producto"
          className="lg:w-80"
        />
      </div>

      {loading ? (
        <div className="grid gap-4 lg:grid-cols-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}</div>
      ) : isBoard ? (
        <div className="grid gap-4 lg:grid-cols-3 lg:items-start">
          {['Nuevo', 'Preparando', 'Listo'].map((status) => {
            const col = visible.filter((o) => o.status === status).sort(byOldest)
            return (
              <section key={status} aria-label={status} className="rounded-3xl bg-secondary/60 p-3">
                <header className="flex items-center justify-between px-2 pt-1 pb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={status} />
                    <span className="text-sm font-medium text-muted">{COLUMN_COPY[status]}</span>
                  </div>
                  <span className="tabular text-sm font-bold text-ink">{col.length}</span>
                </header>
                <div className="space-y-3">
                  {col.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
                      {status === 'Nuevo' ? 'Nada nuevo por aquí.' : status === 'Preparando' ? 'La barra está libre.' : 'Nada esperando en el mostrador.'}
                    </p>
                  ) : (
                    col.map((order) => <OrderCard key={order.id} order={order} compact {...cardProps} />)
                  )}
                </div>
              </section>
            )
          })}
        </div>
      ) : listed.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title={term ? 'Sin resultados' : 'No hay pedidos aquí'}
            text={term ? 'Prueba con otro número, nombre o producto.' : 'Cuando un pedido llegue a este estado lo verás en esta lista.'}
          />
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {listed.map((order) => <OrderCard key={order.id} order={order} {...cardProps} />)}
        </div>
      )}
    </div>
  )
}
