/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react'
import { db, doc, onSnapshot, updateDoc } from '../../demo/store'
import { formatMoney } from '../../utils/cart'
import { MoneyInput } from '../../components/MoneyInput'
import { useRegister } from '../../hooks/useRegister'
import { StatCard } from '../../components/admin/AdminUI'
import { Badge, Button, Card, Dialog, Field, Skeleton, cx, inputCls } from '../../components/ui'
import {
  ArrowDownLeft, ArrowUpRight, Lock, ChevronDown, CheckCircle2, Banknote,
  CreditCard, Wallet, Clock, AlertTriangle, LockOpen, Landmark,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayKey = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const fmtDate = (dateStr) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
}

const fmtTime = (isoOrTs) => {
  if (!isoOrTs) return ''
  try {
    const d = typeof isoOrTs === 'string' ? new Date(isoOrTs) : isoOrTs.toDate?.() ?? new Date(isoOrTs)
    return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

const sum = (arr) => (arr || []).reduce((s, e) => s + e.amount, 0)

const varianceTone = (v) => (Math.abs(v) < 0.01 ? 'success' : v > 0 ? 'info' : 'danger')
const varianceText = (v) => (Math.abs(v) < 0.01 ? 'Cuadra' : `${v > 0 ? 'Sobran' : 'Faltan'} ${formatMoney(Math.abs(v))}`)

// ─── Past Session Row ─────────────────────────────────────────────────────────

export const PastSessionRow = ({ session }) => {
  const [open, setOpen] = useState(false)

  const expected = (session.openingFloat || 0) + (session.cashSales || 0) + sum(session.deposits) - sum(session.withdrawals)
  const closing = session.closingCash ?? null
  const variance = closing !== null ? closing - expected : null

  return (
    <div className="border-b border-line last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-surface-2"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink first-letter:uppercase">{fmtDate(session.date)}</p>
          <p className="tabular mt-0.5 text-xs text-subtle">
            Ventas {formatMoney((session.cashSales || 0) + (session.cardSales || 0))}
          </p>
        </div>
        {variance !== null && <Badge tone={varianceTone(variance)}>{varianceText(variance)}</Badge>}
        <ChevronDown size={18} className={cx('shrink-0 text-muted transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 bg-surface-2 px-5 py-4 text-sm sm:grid-cols-3">
          {[
            ['Fondo inicial', session.openingFloat || 0],
            ['Efectivo', session.cashSales || 0],
            ['Tarjeta', session.cardSales || 0],
            ['Entradas', sum(session.deposits)],
            ['Salidas', sum(session.withdrawals)],
            ['Esperado', expected],
            ['Contado', closing],
          ].map(([label, val]) => (
            <div key={label}>
              <dt className="text-xs text-subtle">{label}</dt>
              <dd className="tabular font-semibold text-ink">{val === null ? 'Sin corte' : formatMoney(val)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

// ─── Open register dialog (shared with the POS gate) ─────────────────────────

export const OpenRegisterDialog = ({ open, onClose, title = 'Abrir caja' }) => {
  const { openRegister } = useRegister()
  const [amount, setAmount] = useState(500)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try { await openRegister(amount); onClose() } finally { setBusy(false) }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description="¿Con cuánto efectivo empieza el día?"
      size="sm"
      footer={<Button block size="lg" onClick={confirm} disabled={busy}>{busy ? 'Abriendo…' : `Abrir con ${formatMoney(amount)}`}</Button>}
    >
      <Field label="Fondo inicial" htmlFor="opening-float" hint="Lo que hay en el cajón antes de la primera venta.">
        <MoneyInput id="opening-float" autoFocus value={amount} onChange={setAmount} inputClassName="h-16 text-3xl" />
      </Field>
      <div className="mt-3 flex flex-wrap gap-2">
        {[300, 500, 1000, 2000].map((v) => (
          <button key={v} type="button" onClick={() => setAmount(v)} className={cx('tabular h-10 rounded-full px-4 text-sm font-semibold transition-colors', amount === v ? 'bg-primary text-on-primary' : 'bg-secondary text-ink hover:bg-line')}>
            {formatMoney(v)}
          </button>
        ))}
      </div>
    </Dialog>
  )
}

// ─── Register View ────────────────────────────────────────────────────────────

export const Register = () => {
  const { closeRegister, loading: sessionLoading } = useRegister()
  const [session, setSession] = useState(undefined)
  const [showOpenModal, setShowOpenModal] = useState(false)

  // Active action: null | 'deposit' | 'withdraw' | 'close'
  const [activeAction, setActiveAction] = useState(null)
  const [actionAmount, setActionAmount] = useState(0)
  const [actionDesc, setActionDesc] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [closingCash, setClosingCash] = useState(0)

  useEffect(() => onSnapshot(doc(db, 'register_sessions', todayKey()), (snap) => {
    setSession(snap.exists() ? { id: snap.id, ...snap.data() } : null)
  }), [])

  const submitAction = async () => {
    if (!actionAmount || actionAmount <= 0 || isSubmitting) return
    setIsSubmitting(true)
    try {
      const entry = {
        amount: actionAmount,
        description: actionDesc.trim() || (activeAction === 'deposit' ? 'Entrada de efectivo' : 'Salida de efectivo'),
        ts: new Date().toISOString(),
      }
      const field = activeAction === 'deposit' ? 'deposits' : 'withdrawals'
      await updateDoc(doc(db, 'register_sessions', todayKey()), { [field]: [...(session?.[field] || []), entry] })
      setActiveAction(null)
    } finally { setIsSubmitting(false) }
  }

  const handleCloseRegister = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      await closeRegister(closingCash)
      setActiveAction(null)
    } finally { setIsSubmitting(false) }
  }

  const openAction = (action) => {
    setActiveAction(action)
    setActionAmount(0)
    setActionDesc('')
    setClosingCash(0)
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const expected = (session?.openingFloat || 0) + (session?.cashSales || 0) + sum(session?.deposits) - sum(session?.withdrawals)
  const variance = closingCash - expected

  const transactions = [
    ...(session?.deposits || []).map((d) => ({ ...d, type: 'deposit' })),
    ...(session?.withdrawals || []).map((w) => ({ ...w, type: 'withdrawal' })),
  ].sort((a, b) => new Date(b.ts) - new Date(a.ts))

  if (sessionLoading || session === undefined) {
    return <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-36" /><Skeleton className="h-36" /></div>
  }

  const openModal = <OpenRegisterDialog open={showOpenModal} onClose={() => setShowOpenModal(false)} title={session?.isClosed ? 'Reabrir caja' : 'Abrir caja'} />

  // ── No session today ─────────────────────────────────────────────────────────
  if (!session) {
    return (
      <Card className="mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center animate-fade-in">
        <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-on-accent"><Landmark size={28} /></span>
        <h2 className="font-display text-2xl font-bold text-ink">La caja está cerrada</h2>
        <p className="mt-2 text-muted">Ábrela con el fondo inicial y empieza a cobrar en el POS.</p>
        <Button size="lg" className="mt-6" onClick={() => setShowOpenModal(true)}><LockOpen size={18} /> Abrir caja de hoy</Button>
        {openModal}
      </Card>
    )
  }

  // ── Closed today ─────────────────────────────────────────────────────────────
  if (session.isClosed) {
    const closedVariance = (session.closingCash ?? 0) - expected
    return (
      <div className="mx-auto max-w-2xl space-y-4 animate-fade-in">
        <Card className="flex flex-col items-center gap-5 p-6 text-center sm:flex-row sm:text-left">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-success-soft text-success"><Lock size={24} /></span>
          <div className="flex-1">
            <p className="font-display text-xl font-bold text-ink">Corte del día listo</p>
            <p className="text-sm text-muted">Cerrada a las {fmtTime(session.closedAt)}. Contado: {formatMoney(session.closingCash ?? 0)}</p>
          </div>
          <Badge tone={varianceTone(closedVariance)} className="px-3 py-1 text-sm">{varianceText(closedVariance)}</Badge>
        </Card>
        <Card className="flex flex-col items-center justify-between gap-3 p-5 sm:flex-row">
          <p className="text-sm text-muted">¿Falta registrar algo? Puedes reabrir la caja.</p>
          <Button variant="outline" onClick={() => setShowOpenModal(true)}><LockOpen size={16} /> Reabrir caja</Button>
        </Card>
        {openModal}
      </div>
    )
  }

  // ── Active session ───────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatCard tone="ink" icon={Wallet} label="Efectivo esperado" value={formatMoney(expected)} hint={`Fondo inicial ${formatMoney(session.openingFloat || 0)}`} />
        <StatCard icon={Banknote} label="Ventas en efectivo" value={formatMoney(session.cashSales || 0)} />
        <StatCard icon={CreditCard} label="Ventas con tarjeta" value={formatMoney(session.cardSales || 0)} />
        <StatCard icon={CheckCircle2} label="Saldo redimido" value={formatMoney(session.loyaltyRedemptions || 0)} hint="Programa de lealtad" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-1">
          <h2 className="font-display text-lg font-semibold text-ink">Movimientos</h2>
          <p className="text-sm text-muted">Registra efectivo que entra o sale del cajón.</p>
          <div className="mt-4 grid gap-2">
            <Button variant="outline" block onClick={() => openAction('deposit')} className="justify-start"><ArrowDownLeft size={18} className="text-success" /> Entrada de efectivo</Button>
            <Button variant="outline" block onClick={() => openAction('withdraw')} className="justify-start"><ArrowUpRight size={18} className="text-danger" /> Salida de efectivo</Button>
            <Button block onClick={() => openAction('close')}><Lock size={17} /> Hacer corte y cerrar</Button>
          </div>
        </Card>

        <Card className="overflow-hidden lg:col-span-2">
          <div className="px-5 pt-5 pb-3">
            <h2 className="font-display text-lg font-semibold text-ink">Movimientos de hoy</h2>
          </div>
          {transactions.length === 0 ? (
            <p className="px-5 pb-8 text-sm text-muted">Sin entradas ni salidas por ahora. Las ventas se suman solas desde el POS.</p>
          ) : (
            <ul className="divide-y divide-line">
              {transactions.map((tx, i) => (
                <li key={i} className="flex items-center gap-3 px-5 py-3">
                  <span className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tx.type === 'deposit' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger')}>
                    {tx.type === 'deposit' ? <ArrowDownLeft size={17} /> : <ArrowUpRight size={17} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{tx.description}</p>
                    <p className="flex items-center gap-1 text-xs text-subtle"><Clock size={11} /> {fmtTime(tx.ts)}</p>
                  </div>
                  <span className={cx('tabular text-sm font-bold', tx.type === 'deposit' ? 'text-success' : 'text-danger')}>
                    {tx.type === 'deposit' ? '+' : '-'}{formatMoney(tx.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Deposit / withdraw */}
      <Dialog
        open={activeAction === 'deposit' || activeAction === 'withdraw'}
        onClose={() => setActiveAction(null)}
        title={activeAction === 'deposit' ? 'Entrada de efectivo' : 'Salida de efectivo'}
        description={activeAction === 'deposit' ? 'Por ejemplo, cambio que trajiste del banco.' : 'Por ejemplo, la compra del hielo o del pan.'}
        size="sm"
        footer={
          <Button block size="lg" onClick={submitAction} disabled={!actionAmount || isSubmitting}>
            {isSubmitting ? 'Guardando…' : 'Registrar'}
          </Button>
        }
      >
        <div className="space-y-4">
          <Field label="Monto" htmlFor="tx-amount">
            <MoneyInput id="tx-amount" autoFocus value={actionAmount} onChange={setActionAmount} inputClassName="h-14 text-2xl" />
          </Field>
          <Field label="Concepto (opcional)" htmlFor="tx-desc">
            <input id="tx-desc" className={inputCls} value={actionDesc} onChange={(e) => setActionDesc(e.target.value)} placeholder="¿Para qué fue?" />
          </Field>
        </div>
      </Dialog>

      {/* Close register */}
      <Dialog
        open={activeAction === 'close'}
        onClose={() => setActiveAction(null)}
        title="Corte de caja"
        description="Cuenta el efectivo del cajón y escríbelo abajo."
        size="md"
        footer={
          <Button block size="lg" onClick={handleCloseRegister} disabled={isSubmitting}>
            {isSubmitting ? 'Cerrando…' : 'Confirmar corte y cerrar'}
          </Button>
        }
      >
        <div className="space-y-5">
          <dl className="space-y-2 rounded-2xl bg-surface-2 p-4 text-sm">
            {[
              ['Fondo inicial', session.openingFloat || 0, ''],
              ['Ventas en efectivo', session.cashSales || 0, '+'],
              ['Entradas', sum(session.deposits), '+'],
              ['Salidas', sum(session.withdrawals), '-'],
            ].map(([label, val, sign]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-muted">{label}</dt>
                <dd className="tabular font-medium text-ink">{sign}{formatMoney(val)}</dd>
              </div>
            ))}
            <div className="flex justify-between border-t border-line pt-2 font-semibold">
              <dt className="text-ink">Efectivo esperado</dt>
              <dd className="tabular text-ink">{formatMoney(expected)}</dd>
            </div>
          </dl>

          <Field label="Efectivo contado" htmlFor="closing-cash">
            <MoneyInput id="closing-cash" autoFocus value={closingCash} onChange={setClosingCash} inputClassName="h-16 text-3xl" />
          </Field>

          {closingCash > 0 && (
            <div className={cx(
              'flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold',
              Math.abs(variance) < 0.01 ? 'bg-success-soft text-success' : variance > 0 ? 'bg-info-soft text-info' : 'bg-danger-soft text-danger',
            )}>
              {Math.abs(variance) < 0.01 ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />}
              {Math.abs(variance) < 0.01 ? 'Cuadra al centavo. Así da gusto.' : variance > 0 ? `Sobran ${formatMoney(variance)}` : `Faltan ${formatMoney(Math.abs(variance))}`}
            </div>
          )}
        </div>
      </Dialog>
    </div>
  )
}
