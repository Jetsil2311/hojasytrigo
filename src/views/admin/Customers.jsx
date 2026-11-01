/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { db, collection, onSnapshot, updateDoc, doc, query, orderBy } from '../../demo/store'
import { formatMoney } from '../../utils/cart'
import { Check, Minus, Phone, Plus, Search, Users, Wallet, X, Repeat } from 'lucide-react'
import { MoneyInput } from '../../components/MoneyInput'
import { StatCard, SearchField, timeAgo } from '../../components/admin/AdminUI'
import { Badge, Button, Card, Dialog, EmptyState, Field, Segmented, Skeleton, cx } from '../../components/ui'

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recientes' },
  { value: 'balance', label: 'Más saldo' },
  { value: 'visits', label: 'Más visitas' },
]

const toDate = (v) => v?.toDate?.() ?? null

const sortCustomers = (arr, key) =>
  [...arr].sort((a, b) => {
    if (key === 'balance') return (b.loyaltyBalance || 0) - (a.loyaltyBalance || 0)
    if (key === 'visits') return (b.visitCount || 0) - (a.visitCount || 0)
    return (toDate(b.lastVisit) ?? 0) - (toDate(a.lastVisit) ?? 0)
  })

// Visit-based tier, purely visual
const tierOf = (visits = 0) => (visits >= 12 ? { label: 'Habitual', tone: 'accent' } : visits >= 5 ? { label: 'Frecuente', tone: 'info' } : { label: 'Nuevo', tone: 'neutral' })

// ─── Balance Adjustment ───────────────────────────────────────────────────────

const BalanceModal = ({ customer, onClose }) => {
  const [mode, setMode] = useState('add')
  const [amount, setAmount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  const current = customer?.loyaltyBalance || 0
  const next = Math.max(0, current + (mode === 'add' ? amount : -amount))

  const handleSave = async () => {
    if (!amount || amount <= 0) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'customers', customer.id), { loyaltyBalance: Math.round(next * 100) / 100 })
      setDone(true)
      setTimeout(onClose, 700)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={Boolean(customer)}
      onClose={onClose}
      title="Ajustar saldo"
      description={customer?.name}
      size="sm"
      footer={
        <Button block size="lg" onClick={handleSave} disabled={saving || done || !amount}>
          {done ? <><Check size={18} /> Guardado</> : saving ? 'Guardando…' : `Dejar saldo en ${formatMoney(next)}`}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">Saldo actual: <span className="tabular font-semibold text-ink">{formatMoney(current)}</span></p>
        <Segmented
          value={mode}
          onChange={setMode}
          options={[
            { value: 'add', label: <span className="inline-flex items-center gap-1"><Plus size={14} /> Agregar</span> },
            { value: 'subtract', label: <span className="inline-flex items-center gap-1"><Minus size={14} /> Descontar</span> },
          ]}
        />
        <Field label="Monto" htmlFor="balance-amount">
          <MoneyInput id="balance-amount" autoFocus value={amount} onChange={setAmount} inputClassName="h-14 text-2xl" />
        </Field>
      </div>
    </Dialog>
  )
}

// ─── Customer row ─────────────────────────────────────────────────────────────

const CustomerRow = ({ customer, onAdjust }) => {
  const tier = tierOf(customer.visitCount)
  const initials = (customer.name || '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()
  return (
    <li className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-2">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm font-bold text-ink">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-ink">{customer.name || 'Sin nombre'}</p>
          <span className="hidden sm:block"><Badge tone={tier.tone}>{tier.label}</Badge></span>
        </div>
        <p className="tabular flex items-center gap-1.5 text-xs text-subtle">
          <span className="font-semibold text-ink sm:hidden">{formatMoney(customer.loyaltyBalance || 0)}</span>
          <span className="sm:hidden">· {customer.visitCount || 0} visitas</span>
          <Phone size={11} className="hidden sm:block" /> <span className="hidden sm:inline">{customer.phone || 'Sin teléfono'}</span>
          {toDate(customer.lastVisit) && <span className="hidden sm:inline">· Última visita {timeAgo(toDate(customer.lastVisit))}</span>}
        </p>
      </div>
      <div className="hidden w-20 text-right md:block">
        <p className="text-xs text-subtle">Visitas</p>
        <p className="tabular font-semibold text-ink">{customer.visitCount || 0}</p>
      </div>
      <div className="hidden w-24 text-right sm:block">
        <p className="text-xs text-subtle">Saldo</p>
        <p className="tabular font-bold text-ink">{formatMoney(customer.loyaltyBalance || 0)}</p>
      </div>
      <Button size="sm" variant="secondary" onClick={() => onAdjust(customer)} aria-label={`Ajustar saldo de ${customer.name}`}>
        <Wallet size={15} /> <span className="hidden sm:inline">Ajustar</span>
      </Button>
    </li>
  )
}

// ─── Customers view ───────────────────────────────────────────────────────────

export const Customers = () => {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [adjustTarget, setAdjustTarget] = useState(null)
  const [sortKey, setSortKey] = useState('recent')

  useEffect(() => {
    const q = query(collection(db, 'customers'), orderBy('createdAt', 'desc'))
    return onSnapshot(q, (snap) => {
      setCustomers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, () => setLoading(false))
  }, [])

  const term = search.trim().toLowerCase()
  const filtered = customers.filter((c) => !term || (c.name || '').toLowerCase().includes(term) || (c.phone || '').includes(term))
  const sorted = sortCustomers(filtered, sortKey)

  const totalBalance = customers.reduce((s, c) => s + (c.loyaltyBalance || 0), 0)
  const totalVisits = customers.reduce((s, c) => s + (c.visitCount || 0), 0)
  const regulars = customers.filter((c) => (c.visitCount || 0) >= 5).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard tone="ink" icon={Users} label="Clientes" loading={loading} value={customers.length} hint="Con programa de lealtad" />
        <StatCard icon={Repeat} label="Clientes frecuentes" loading={loading} value={regulars} hint="5 visitas o más" />
        <StatCard icon={Wallet} label="Saldo por usar" loading={loading} value={formatMoney(totalBalance)} hint="10 % de cada compra" />
        <StatCard icon={Check} label="Visitas registradas" loading={loading} value={totalVisits.toLocaleString('es-MX')} />
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
          <SearchField value={search} onChange={setSearch} onClear={() => setSearch('')} icon={Search} clearIcon={X} placeholder="Buscar por nombre o teléfono" className="md:w-80" />
          <Segmented size="sm" value={sortKey} onChange={setSortKey} options={SORT_OPTIONS} />
        </div>

        {loading ? (
          <div className="space-y-3 p-5">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : sorted.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'Nadie con ese nombre' : 'Aún no hay clientes'}
            text={search ? 'Prueba con el teléfono o con otro nombre.' : 'Registra clientes desde el POS para que acumulen saldo.'}
          />
        ) : (
          <ul className={cx('divide-y divide-line')}>
            {sorted.map((c) => <CustomerRow key={c.id} customer={c} onAdjust={setAdjustTarget} />)}
          </ul>
        )}
      </Card>

      {adjustTarget && <BalanceModal customer={adjustTarget} onClose={() => setAdjustTarget(null)} />}
    </div>
  )
}
