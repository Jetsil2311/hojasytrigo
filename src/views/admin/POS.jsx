/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react'
import {
  db, collection, getDocs, addDoc, updateDoc, doc,
  serverTimestamp, where, query, onSnapshot,
  increment, deleteDoc,
} from '../../demo/store'
import { formatMoney, lineTotal } from '../../utils/cart'
import { MoneyInput } from '../../components/MoneyInput'
import { BottomSheet } from '../../components/BottomSheet'
import { ToppingsOverlay } from '../../components/ToppingsOverlay'
import { ProductArt } from '../../components/ProductArt'
import { useRegister } from '../../hooks/useRegister'
import { useSettings } from '../../hooks/useSettings'
import { printReceipt } from '../../utils/printReceipt'
import { RegisterOverlay } from '../../components/admin/RegisterOverlay'
import { SearchField } from '../../components/admin/AdminUI'
import {
  Button, ConfirmDialog, Dialog, EmptyState, IconButton, Segmented, Skeleton, Toast, cx, inputCls,
} from '../../components/ui'
import {
  ShoppingCart, Search, X, Plus, Minus, User, UserPlus,
  CreditCard, Banknote, Wallet, Package, CheckCircle2,
  PenLine, Bookmark, RotateCcw, Trash2, Clock, AlertCircle, Send, SlidersHorizontal,
} from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const todayKey = () => {
  const d = new Date()
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-')
}

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const normalize = (s) => (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const itemLineTotal = (item) => lineTotal(item)
const calcOrderTotal = (items) => items.reduce((s, it) => s + itemLineTotal(it), 0)

const LOYALTY_RATE = 0.1

// ─── TicketItem ───────────────────────────────────────────────────────────────

const TicketItem = ({ item, onChangeQty, onRemove, onSetNote }) => {
  const [noteOpen, setNoteOpen] = useState(false)
  const extras = [
    ...(item.selectedOptions || []).map((o) => o.optionName),
    ...(item.selectedToppings || []).map((t) => t.name),
  ].join(', ')

  return (
    <li className="border-b border-line px-4 py-3 last:border-0">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold leading-snug text-ink">{item.name}</p>
          {extras && <p className="mt-0.5 text-xs leading-relaxed text-muted">{extras}</p>}
          {item.itemNote && !noteOpen && <p className="mt-0.5 text-xs font-medium text-accent-ink">Nota: {item.itemNote}</p>}
        </div>
        <span className="tabular shrink-0 pt-0.5 text-sm font-bold text-ink">{formatMoney(itemLineTotal(item))}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-0.5 rounded-full bg-secondary p-0.5">
          <button type="button" onClick={() => onChangeQty(item.cartItemId, -1)} aria-label="Uno menos" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface">
            <Minus size={15} />
          </button>
          <span className="tabular w-6 text-center text-sm font-bold text-ink">{item.qty}</span>
          <button type="button" onClick={() => onChangeQty(item.cartItemId, 1)} aria-label="Uno más" className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink hover:bg-surface">
            <Plus size={15} />
          </button>
        </div>
        <div className="flex items-center">
          <IconButton size="sm" label="Nota para este producto" onClick={() => setNoteOpen((v) => !v)} className={noteOpen || item.itemNote ? 'text-accent-ink' : ''}>
            <PenLine size={16} />
          </IconButton>
          <IconButton size="sm" label={`Quitar ${item.name}`} onClick={() => onRemove(item.cartItemId)} className="hover:text-danger">
            <Trash2 size={16} />
          </IconButton>
        </div>
      </div>
      {noteOpen && (
        <input
          type="text"
          placeholder="Sin hielo, extra caliente…"
          aria-label="Nota para este producto"
          value={item.itemNote || ''}
          onChange={(e) => onSetNote(item.cartItemId, e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') setNoteOpen(false) }}
          autoFocus
          className={cx(inputCls, 'mt-2')}
        />
      )}
    </li>
  )
}

// ─── ParkedOrderCard ──────────────────────────────────────────────────────────

const ParkedOrderCard = ({ order, onResume, onDelete, onSend, isSending }) => {
  const items = order.items || []
  const total = calcOrderTotal(items)
  const count = items.reduce((s, it) => s + (it.qty || 1), 0)
  const timeStr = order.parkedAt?.toDate?.()?.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }) ?? ''

  return (
    <li className="border-b border-line px-4 py-4 last:border-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{order.customer?.name || 'Sin cliente'}</p>
          <p className="flex items-center gap-1 text-xs text-subtle">
            <Clock size={11} /> {timeStr} · {count} {count === 1 ? 'producto' : 'productos'}
          </p>
          <p className="mt-1 truncate text-sm text-muted">{items.map((i) => i.name).join(', ')}</p>
        </div>
        <span className="tabular shrink-0 font-bold text-ink">{formatMoney(total)}</span>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => onResume(order)}><RotateCcw size={14} /> Retomar</Button>
        <Button size="sm" variant="outline" onClick={() => onSend(order)} disabled={isSending === order.id}>
          <Send size={14} /> {isSending === order.id ? 'Enviando…' : 'A cocina'}
        </Button>
        <IconButton size="sm" label="Eliminar apartado" onClick={() => onDelete(order.id)} className="ml-auto hover:text-danger">
          <Trash2 size={16} />
        </IconButton>
      </div>
    </li>
  )
}

// ─── PaymentModal ─────────────────────────────────────────────────────────────

const PaymentModal = ({
  customer, loyaltyMax,
  cashAmount, setCashAmount,
  cardAmount, setCardAmount,
  loyaltyRedeemed, setLoyaltyRedeemed,
  effectiveTotal, change, canConfirm, isProcessing,
  onConfirm, onClose,
}) => {
  const totalPaid = cashAmount + cardAmount + loyaltyRedeemed
  const remaining = Math.max(0, effectiveTotal - totalPaid)
  const quickCash = [...new Set([effectiveTotal, Math.ceil(effectiveTotal / 50) * 50, Math.ceil(effectiveTotal / 100) * 100, 500])]
    .filter((v) => v >= effectiveTotal && v > 0)
    .slice(0, 4)

  return (
    <Dialog
      open
      onClose={onClose}
      title="Cobrar"
      size="md"
      layer="z-[60]"
      footer={
        <Button block size="lg" onClick={onConfirm} disabled={!canConfirm || isProcessing}>
          {isProcessing ? 'Procesando…' : remaining > 0.005 ? `Faltan ${formatMoney(remaining)}` : `Confirmar cobro de ${formatMoney(effectiveTotal)}`}
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl bg-primary px-5 py-4 text-on-primary">
          <p className="text-sm opacity-75">Total a cobrar</p>
          <p className="tabular font-display text-4xl font-bold">{formatMoney(effectiveTotal)}</p>
        </div>

        {customer && loyaltyMax > 0 && (
          <div className="rounded-2xl bg-accent-soft p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-accent-ink">
              <Wallet size={16} /> {customer.name} tiene {formatMoney(customer.loyaltyBalance || 0)} de saldo
            </p>
            <div className="mt-3 flex items-center gap-2">
              <MoneyInput value={loyaltyRedeemed} onChange={(v) => setLoyaltyRedeemed(Math.min(loyaltyMax, v))} max={loyaltyMax} className="flex-1" aria-label="Saldo a usar" />
              <Button variant="secondary" onClick={() => setLoyaltyRedeemed(loyaltyMax)}>Usar todo</Button>
            </div>
          </div>
        )}

        <div>
          <label htmlFor="pay-cash" className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-ink">
            <Banknote size={16} /> Efectivo recibido
          </label>
          <MoneyInput id="pay-cash" value={cashAmount} onChange={setCashAmount} inputClassName="h-14 text-xl" />
          <div className="mt-2 flex flex-wrap gap-2">
            {quickCash.map((v) => (
              <button key={v} type="button" onClick={() => { setCashAmount(v); setCardAmount(0) }} className="tabular h-9 rounded-full bg-secondary px-3.5 text-sm font-semibold text-ink hover:bg-line">
                {v === effectiveTotal ? 'Exacto' : formatMoney(v)}
              </button>
            ))}
          </div>
          {cashAmount > 0 && change > 0.005 && (
            <p className="tabular mt-3 rounded-xl bg-success-soft px-3 py-2 text-sm font-bold text-success">Cambio: {formatMoney(change)}</p>
          )}
        </div>

        <div>
          <label htmlFor="pay-card" className="mb-1.5 flex items-center justify-between gap-2 text-sm font-semibold text-ink">
            <span className="flex items-center gap-2"><CreditCard size={16} /> Tarjeta</span>
            <button type="button" onClick={() => { setCardAmount(Math.max(0, effectiveTotal - loyaltyRedeemed - cashAmount)) }} className="text-sm font-semibold text-muted underline-offset-4 hover:text-ink hover:underline">
              Cobrar el resto con tarjeta
            </button>
          </label>
          <MoneyInput id="pay-card" value={cardAmount} onChange={setCardAmount} inputClassName="h-14 text-xl" />
        </div>
      </div>
    </Dialog>
  )
}

// ─── POS ─────────────────────────────────────────────────────────────────────

export const POS = () => {
  const { loading: registerLoading } = useRegister()
  const { settings } = useSettings()

  // ── Catalog ────────────────────────────────────────────────────────────────
  const [sections, setSections] = useState([])
  const [allProducts, setAllProducts] = useState([])
  const [toppingsMap, setToppingsMap] = useState({})
  const [activeSection, setActiveSection] = useState('')
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [productSearch, setProductSearch] = useState('')

  // ── Order ──────────────────────────────────────────────────────────────────
  const [orderItems, setOrderItems] = useState([])
  const [generalNote, setGeneralNote] = useState('')
  const [showDraftBanner, setShowDraftBanner] = useState(false)

  // ── Parked orders ──────────────────────────────────────────────────────────
  const [parkedOrders, setParkedOrders] = useState([])
  const [ticketTab, setTicketTab] = useState('active') // 'active' | 'parked'
  const [isSending, setIsSending] = useState(null)
  const [resumeTarget, setResumeTarget] = useState(null)

  // ── Overlay state (same flow as the customer menu) ─────────────────────────
  const [bottomSheetProduct, setBottomSheetProduct] = useState(null)
  const [pendingBottomSheetResult, setPendingBottomSheetResult] = useState(null)
  const [pendingToppingItem, setPendingToppingItem] = useState(null)

  // ── Customer ───────────────────────────────────────────────────────────────
  const [customer, setCustomer] = useState(null)
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false)
  const [customerSearch, setCustomerSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [savingCust, setSavingCust] = useState(false)

  // ── Payment (numbers, not strings) ─────────────────────────────────────────
  const [isPaymentOpen, setIsPaymentOpen] = useState(false)
  const [cashAmount, setCashAmount] = useState(0)
  const [cardAmount, setCardAmount] = useState(0)
  const [loyaltyRedeemed, setLoyaltyRedeemed] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [toast, setToast] = useState(null) // { msg, tone }

  const [isTicketOpen, setIsTicketOpen] = useState(false)

  const flash = (msg, tone = 'ink') => {
    setToast({ msg, tone })
    setTimeout(() => setToast(null), 2600)
  }

  // ── Load catalog ──────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true
    Promise.all([
      getDocs(collection(db, 'sections')),
      getDocs(collection(db, 'products')),
      getDocs(collection(db, 'toppings')),
    ]).then(([sectSnap, prodSnap, topSnap]) => {
      if (!alive) return
      const secs = sectSnap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((s) => s.visible !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setSections(secs)
      if (secs.length) setActiveSection(secs[0].name)

      setAllProducts(prodSnap.docs
        .map((d) => ({ docId: d.id, id: d.data().id ?? d.id, ...d.data() }))
        .filter((p) => p.isActive !== false)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)))

      const tMap = {}
      topSnap.docs.forEach((d) => {
        const data = d.data()
        if (data.isActive !== false) tMap[d.id] = { id: d.id, name: data.name, price: Number(data.price || 0), description: data.description || null }
      })
      setToppingsMap(tMap)
      setCatalogLoading(false)
    }).catch(() => setCatalogLoading(false))
    return () => { alive = false }
  }, [])

  // ── localStorage draft: restore on mount ─────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem('pos_draft_v1')
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft.orderItems?.length > 0) {
        setOrderItems(draft.orderItems)
        setGeneralNote(draft.generalNote || '')
        setCustomer(draft.customer || null)
        setShowDraftBanner(true)
      }
    } catch { /* ignore a corrupted draft */ }
  }, [])

  // ── localStorage draft: auto-save on change ───────────────────────────────
  useEffect(() => {
    try {
      if (orderItems.length === 0 && !generalNote && !customer) {
        localStorage.removeItem('pos_draft_v1')
      } else {
        localStorage.setItem('pos_draft_v1', JSON.stringify({ orderItems, generalNote, customer }))
      }
    } catch { /* storage unavailable */ }
  }, [orderItems, generalNote, customer])

  // ── Parked orders (real-time) ─────────────────────────────────────────────
  useEffect(() => {
    return onSnapshot(collection(db, 'parked_orders'), (snap) => {
      const orders = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      orders.sort((a, b) => (b.parkedAt?.toDate?.() ?? new Date(0)) - (a.parkedAt?.toDate?.() ?? new Date(0)))
      setParkedOrders(orders)
    }, () => {})
  }, [])

  // ── Customer search (debounced, by phone or name) ─────────────────────────
  useEffect(() => {
    const term = customerSearch.trim()
    if (!term) { setSearchResults([]); return }
    const t = setTimeout(async () => {
      setIsSearching(true)
      try {
        const isPhone = /^\d+$/.test(term)
        const snap = isPhone
          ? await getDocs(query(collection(db, 'customers'), where('phone', '>=', term), where('phone', '<=', term + '')))
          : await getDocs(collection(db, 'customers'))
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setSearchResults(isPhone ? rows : rows.filter((c) => normalize(c.name).includes(normalize(term))))
      } catch { setSearchResults([]) }
      finally { setIsSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [customerSearch])

  // ── Add-to-order flow (mirrors the customer menu) ─────────────────────────
  const _commit = (item) => {
    setOrderItems((prev) => {
      const idx = prev.findIndex((it) =>
        it.id === item.id &&
        JSON.stringify(it.selectedOptions) === JSON.stringify(item.selectedOptions) &&
        JSON.stringify(it.selectedToppings) === JSON.stringify(item.selectedToppings)
      )
      if (idx !== -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], qty: next[idx].qty + (item.qty || 1) }
        return next
      }
      return [...prev, { ...item, cartItemId: uid(), itemNote: '' }]
    })
  }

  const addToOrder = useCallback((product) => {
    const optionGroups = Array.isArray(product.optionGroups) ? product.optionGroups : []
    const availableToppings = (product.toppingIds || []).map((tid) => toppingsMap[tid]).filter(Boolean)

    if (optionGroups.length > 0) {
      setBottomSheetProduct({ ...product, availableToppings, optionGroups }); return
    }
    if (availableToppings.length > 0) {
      setPendingToppingItem({ ...product, availableToppings }); return
    }
    _commit({ id: product.id, name: product.name, price: product.price, imageUrl: product.imageUrl, selectedOptions: [], selectedToppings: [], availableToppings: [], qty: 1 })
  }, [toppingsMap])

  const handleBottomSheetConfirm = useCallback(({ selectedOptions, qty }) => {
    if (!bottomSheetProduct) return
    const p = bottomSheetProduct
    setBottomSheetProduct(null)
    if (p.availableToppings.length > 0) {
      setPendingBottomSheetResult({ ...p, selectedOptions, qty })
      setPendingToppingItem({ ...p, availableToppings: p.availableToppings })
      return
    }
    _commit({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, selectedOptions, selectedToppings: [], availableToppings: [], qty })
  }, [bottomSheetProduct])

  const handleToppingConfirm = useCallback((selectedToppings) => {
    if (pendingBottomSheetResult) {
      const p = pendingBottomSheetResult
      _commit({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, selectedOptions: p.selectedOptions, selectedToppings, availableToppings: p.availableToppings, qty: p.qty })
      setPendingBottomSheetResult(null)
    } else if (pendingToppingItem) {
      const p = pendingToppingItem
      _commit({ id: p.id, name: p.name, price: p.price, imageUrl: p.imageUrl, selectedOptions: [], selectedToppings, availableToppings: p.availableToppings, qty: 1 })
    }
    setPendingToppingItem(null)
  }, [pendingBottomSheetResult, pendingToppingItem])

  // ── Order mutations ───────────────────────────────────────────────────────
  const changeQty = (cartItemId, delta) => {
    setOrderItems((prev) => {
      const idx = prev.findIndex((it) => it.cartItemId === cartItemId)
      if (idx === -1) return prev
      const newQty = prev[idx].qty + delta
      if (newQty <= 0) return prev.filter((it) => it.cartItemId !== cartItemId)
      const next = [...prev]; next[idx] = { ...next[idx], qty: newQty }; return next
    })
  }
  const removeItem = (cartItemId) => setOrderItems((prev) => prev.filter((it) => it.cartItemId !== cartItemId))
  const setItemNote = (cartItemId, note) =>
    setOrderItems((prev) => prev.map((it) => (it.cartItemId === cartItemId ? { ...it, itemNote: note } : it)))

  // ── Customer helpers ──────────────────────────────────────────────────────
  const selectCustomer = (c) => {
    setCustomer(c)
    setCustomerSearch('')
    setSearchResults([])
    setCustomerPanelOpen(false)
    setShowNewCustomer(false)
  }

  const saveNewCustomer = async () => {
    if (!newCustName.trim() || !newCustPhone.trim()) return
    setSavingCust(true)
    try {
      const ref = await addDoc(collection(db, 'customers'), {
        name: newCustName.trim(), phone: newCustPhone.trim(),
        loyaltyBalance: 0, visitCount: 0,
        createdAt: serverTimestamp(), lastVisit: serverTimestamp(),
      })
      selectCustomer({ id: ref.id, name: newCustName.trim(), phone: newCustPhone.trim(), loyaltyBalance: 0, visitCount: 0 })
      setNewCustName(''); setNewCustPhone('')
    } catch (e) { console.error(e) }
    finally { setSavingCust(false) }
  }

  const safeItemsOf = (items) => items.map((it) => ({
    id: it.id ?? null, name: it.name ?? '', price: Number(it.price || 0),
    imageUrl: it.imageUrl ?? null, qty: it.qty ?? 1, itemNote: it.itemNote || null,
    selectedOptions: (it.selectedOptions ?? []).map((o) => ({ optionName: o.optionName ?? '', priceModifier: Number(o.priceModifier || 0) })),
    selectedToppings: (it.selectedToppings ?? []).map((t) => ({ id: t.id ?? null, name: t.name ?? '', price: Number(t.price || 0) })),
  }))

  // ── Park the order (apartado) ─────────────────────────────────────────────
  const [isParking, setIsParking] = useState(false)

  const parkCurrentOrder = async () => {
    if (orderItems.length === 0 || isParking) return
    setIsParking(true)
    try {
      const orderId = `POS-${Date.now().toString(36).toUpperCase()}`
      const safeItems = safeItemsOf(orderItems)
      await addDoc(collection(db, 'parked_orders'), {
        orderId, items: safeItems, total: calcOrderTotal(safeItems),
        status: 'Nuevo', source: 'pos',
        customer: customer ? { id: customer.id, name: customer.name, phone: customer.phone ?? '' } : null,
        generalNote: generalNote || null,
        parkedAt: serverTimestamp(),
      })
      setOrderItems([]); setGeneralNote(''); setCustomer(null); setLoyaltyRedeemed(0)
      localStorage.removeItem('pos_draft_v1')
      setTicketTab('parked')
      flash('Pedido apartado')
    } catch (e) {
      console.error('Error al guardar orden:', e)
      flash('No se pudo apartar el pedido', 'danger')
    } finally {
      setIsParking(false)
    }
  }

  // ── Send a parked order to the kitchen (Pedidos) ──────────────────────────
  const sendToKitchen = async (parkedOrder) => {
    if (isSending) return
    setIsSending(parkedOrder.id)
    try {
      const safeItems = parkedOrder.items || []
      await addDoc(collection(db, 'orders'), {
        orderId: parkedOrder.orderId ?? `POS-${Date.now().toString(36).toUpperCase()}`,
        items: safeItems, total: calcOrderTotal(safeItems),
        status: 'Nuevo', source: 'pos',
        customerId: parkedOrder.customer?.id ?? null,
        customerName: parkedOrder.customer?.name ?? null,
        generalNote: parkedOrder.generalNote || null,
        loyaltyEarned: 0, loyaltyRedeemed: 0,
        createdAt: serverTimestamp(),
      })
      await deleteDoc(doc(db, 'parked_orders', parkedOrder.id))
      flash('Enviado a cocina')
    } catch (e) {
      console.error('Error enviando a pedidos:', e)
    } finally {
      setIsSending(null)
    }
  }

  const doResume = async (parkedOrder) => {
    setOrderItems((parkedOrder.items || []).map((it) => ({ ...it, cartItemId: uid(), itemNote: it.itemNote || '' })))
    setGeneralNote(parkedOrder.generalNote || '')
    setCustomer(parkedOrder.customer || null)
    setLoyaltyRedeemed(0)
    await deleteDoc(doc(db, 'parked_orders', parkedOrder.id))
    setTicketTab('active')
    setResumeTarget(null)
  }

  const resumeParkedOrder = (parkedOrder) => {
    if (orderItems.length > 0) { setResumeTarget(parkedOrder); return }
    doResume(parkedOrder)
  }

  const [deleteParkedId, setDeleteParkedId] = useState(null)
  const deleteParkedOrder = (id) => setDeleteParkedId(id)
  const confirmDeleteParked = async () => {
    await deleteDoc(doc(db, 'parked_orders', deleteParkedId))
    setDeleteParkedId(null)
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const displayedProducts = productSearch.trim()
    ? allProducts.filter((p) => normalize(p.name).includes(normalize(productSearch.trim())))
    : allProducts.filter((p) => p.section === activeSection)

  const subtotal = calcOrderTotal(orderItems)
  const loyaltyMax = customer ? Math.min(customer.loyaltyBalance || 0, subtotal) : 0
  const effectiveTotal = Math.max(0, subtotal - loyaltyRedeemed)
  const totalPaid = cashAmount + cardAmount + loyaltyRedeemed
  const change = Math.max(0, totalPaid - effectiveTotal)
  const canConfirmPayment = orderItems.length > 0 && totalPaid >= effectiveTotal - 0.005
  const itemCount = orderItems.reduce((s, it) => s + it.qty, 0)

  const toppingOverlayProduct = pendingBottomSheetResult ?? pendingToppingItem
  const toppingOverlayPrice = Number(toppingOverlayProduct?.price ?? 0) +
    (toppingOverlayProduct?.selectedOptions ?? []).reduce((s, o) => s + Number(o.priceModifier || 0), 0)

  // ── Build content string (kept for receipts and legacy readers) ───────────
  const buildContent = () => {
    const lines = ['Pedido POS', '', 'Items:',
      ...orderItems.map((it, i) => {
        const optTxt = it.selectedOptions?.length ? ` [${it.selectedOptions.map((o) => (o.priceModifier > 0 ? `${o.optionName} (+$${o.priceModifier})` : o.optionName)).join(', ')}]` : ''
        const topTxt = it.selectedToppings?.length ? ` [${it.selectedToppings.map((t) => t.name).join(', ')}]` : ''
        const noteTxt = it.itemNote ? ` (${it.itemNote})` : ''
        return `${i + 1}. ${it.qty} x ${it.name}${optTxt}${topTxt}${noteTxt} - ${formatMoney(itemLineTotal(it))}`
      }),
      '', `Total: ${formatMoney(effectiveTotal)}`,
    ]
    if (loyaltyRedeemed > 0) lines.push(`Saldo redimido: ${formatMoney(loyaltyRedeemed)}`)
    if (generalNote) lines.push('', `Notas: ${generalNote}`)
    if (customer) lines.push('', `Cliente: ${customer.name} (${customer.phone})`)
    return lines.join('\n')
  }

  // ── Submit payment ────────────────────────────────────────────────────────
  const handlePayment = async () => {
    if (!canConfirmPayment || isProcessing) return
    setIsProcessing(true)
    try {
      const orderId = `POS-${Date.now().toString(36).toUpperCase()}`
      const loyaltyEarned = customer ? Math.round(effectiveTotal * LOYALTY_RATE * 100) / 100 : 0
      const safeItems = safeItemsOf(orderItems)

      await addDoc(collection(db, 'orders'), {
        orderId, content: buildContent(), total: effectiveTotal,
        status: 'Nuevo', source: 'pos',
        paymentMethods: { cash: cashAmount, card: cardAmount, loyalty: loyaltyRedeemed },
        customerId: customer?.id ?? null, customerName: customer?.name ?? null,
        items: safeItems, generalNote: generalNote || null,
        loyaltyEarned, loyaltyRedeemed, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })

      // Register counters. cashSales records net cash kept in the drawer
      // (cash received minus change returned), not the gross amount handed over.
      await updateDoc(doc(db, 'register_sessions', todayKey()), {
        cashSales: increment(cashAmount - change),
        cardSales: increment(cardAmount),
        loyaltyRedemptions: increment(loyaltyRedeemed),
      })

      if (customer) {
        await updateDoc(doc(db, 'customers', customer.id), {
          loyaltyBalance: increment(loyaltyEarned - loyaltyRedeemed),
          visitCount: increment(1),
          lastVisit: serverTimestamp(),
        })
      }

      const savedChange = change
      const savedEarned = loyaltyEarned
      const savedCustomer = customer?.name ?? null
      setOrderItems([]); setGeneralNote(''); setLoyaltyRedeemed(0)
      setCashAmount(0); setCardAmount(0); setCustomer(null)
      setCustomerSearch(''); setIsPaymentOpen(false)
      localStorage.removeItem('pos_draft_v1')
      setOrderSuccess({ orderId, change: savedChange, earned: savedEarned, customer: savedCustomer })

      if (settings?.autoPrintOnPayment && settings?.printingEnabled) {
        const orderForPrint = {
          id: orderId, orderId, items: safeItems, total: effectiveTotal,
          paymentMethods: { cash: cashAmount, card: cardAmount, loyalty: loyaltyRedeemed },
          customerName: customer?.name ?? null, note: generalNote || null,
        }
        printReceipt(orderForPrint, settings).then((result) => {
          if (!result.success && result.reason !== 'disabled') flash(result.error || 'No se pudo imprimir el ticket', 'danger')
        })
      }
    } catch (e) {
      console.error('POS payment error:', e)
      flash('No se pudo registrar el cobro', 'danger')
    } finally {
      setIsProcessing(false)
    }
  }

  // ── Ticket parts ──────────────────────────────────────────────────────────
  const ticketTabs = (
    <Segmented
      size="sm"
      value={ticketTab}
      onChange={setTicketTab}
      options={[
        { value: 'active', label: 'Pedido actual', count: itemCount || undefined },
        { value: 'parked', label: 'Apartados', count: parkedOrders.length || undefined },
      ]}
    />
  )

  const customerSection = (
    <div className="border-b border-line px-4 py-3">
      {customer ? (
        <div className="flex items-center gap-3 rounded-2xl bg-accent-soft px-3 py-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-on-accent">
            {customer.name?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink">{customer.name}</p>
            <p className="tabular truncate text-xs text-accent-ink">Saldo {formatMoney(customer.loyaltyBalance || 0)} · {customer.visitCount || 0} visitas</p>
          </div>
          <IconButton size="sm" label="Quitar cliente" onClick={() => { setCustomer(null); setLoyaltyRedeemed(0) }}>
            <X size={16} />
          </IconButton>
        </div>
      ) : customerPanelOpen ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <SearchField value={customerSearch} onChange={(v) => { setCustomerSearch(v); setShowNewCustomer(false) }} icon={Search} placeholder="Nombre o teléfono" className="flex-1" />
            <IconButton label="Cerrar búsqueda" onClick={() => { setCustomerPanelOpen(false); setCustomerSearch('') }}><X size={18} /></IconButton>
          </div>
          {customerSearch.trim() && (
            <div className="overflow-hidden rounded-2xl border border-line">
              {isSearching ? (
                <p className="px-4 py-3 text-sm text-muted">Buscando…</p>
              ) : searchResults.length > 0 ? (
                searchResults.slice(0, 4).map((c) => (
                  <button key={c.id} type="button" onClick={() => selectCustomer(c)} className="w-full border-b border-line px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-surface-2">
                    <p className="text-sm font-semibold text-ink">{c.name}</p>
                    <p className="tabular text-xs text-subtle">{c.phone} · Saldo {formatMoney(c.loyaltyBalance || 0)}</p>
                  </button>
                ))
              ) : (
                <div className="flex items-center justify-between gap-2 px-4 py-3">
                  <p className="text-sm text-muted">No lo encontramos.</p>
                  <Button size="sm" variant="secondary" onClick={() => { setShowNewCustomer(true); setNewCustPhone(/^\d+$/.test(customerSearch.trim()) ? customerSearch.trim() : ''); setNewCustName(/^\d+$/.test(customerSearch.trim()) ? '' : customerSearch.trim()) }}>
                    <UserPlus size={14} /> Registrar
                  </Button>
                </div>
              )}
            </div>
          )}
          {showNewCustomer && (
            <div className="space-y-2 rounded-2xl bg-surface-2 p-3">
              <input type="text" autoComplete="off" placeholder="Nombre completo" aria-label="Nombre completo" value={newCustName} onChange={(e) => setNewCustName(e.target.value)} className={inputCls} />
              <input type="tel" inputMode="tel" autoComplete="off" placeholder="Teléfono" aria-label="Teléfono" value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} className={inputCls} />
              <Button block size="sm" onClick={saveNewCustomer} disabled={savingCust || !newCustName.trim() || !newCustPhone.trim()}>
                {savingCust ? 'Guardando…' : 'Guardar y vincular'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => setCustomerPanelOpen(true)} className="flex h-11 w-full items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-ink hover:text-ink">
          <User size={16} /> Vincular cliente para sumar saldo
        </button>
      )}
    </div>
  )

  const activeTicketContent = (
    <>
      {showDraftBanner && (
        <div className="mx-4 mt-3 flex items-center justify-between gap-2 rounded-xl bg-info-soft px-3 py-2 text-xs font-semibold text-info">
          Recuperamos el pedido que dejaste a medias.
          <button type="button" onClick={() => setShowDraftBanner(false)} aria-label="Ocultar aviso" className="inline-flex h-7 w-7 items-center justify-center rounded-full hover:bg-info/10"><X size={13} /></button>
        </div>
      )}
      {customerSection}

      <div className="flex-1 overflow-y-auto">
        {orderItems.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Pedido vacío" text="Toca un producto del catálogo para agregarlo." />
        ) : (
          <ul>
            {orderItems.map((item) => (
              <TicketItem key={item.cartItemId} item={item} onChangeQty={changeQty} onRemove={removeItem} onSetNote={setItemNote} />
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 border-t border-line px-4 pt-3 pb-4">
        <input type="text" placeholder="Nota general del pedido" aria-label="Nota general del pedido" value={generalNote} onChange={(e) => setGeneralNote(e.target.value)} className={inputCls} />
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">{itemCount} {itemCount === 1 ? 'producto' : 'productos'}</span>
          <span className="tabular font-display text-3xl font-bold text-ink">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={parkCurrentOrder} disabled={orderItems.length === 0 || isParking} aria-label="Apartar pedido">
            <Bookmark size={17} /> {isParking ? 'Apartando…' : 'Apartar'}
          </Button>
          <Button size="lg" className="flex-1" onClick={() => { setIsPaymentOpen(true); setIsTicketOpen(false) }} disabled={orderItems.length === 0}>
            Cobrar
          </Button>
        </div>
      </div>
    </>
  )

  const parkedTicketContent = (
    <div className="flex-1 overflow-y-auto">
      {parkedOrders.length === 0 ? (
        <EmptyState icon={Bookmark} title="Sin apartados" text="Aparta un pedido para cobrarlo después o mandarlo a cocina." />
      ) : (
        <ul>
          {parkedOrders.map((po) => (
            <ParkedOrderCard key={po.id} order={po} onResume={resumeParkedOrder} onDelete={deleteParkedOrder} onSend={sendToKitchen} isSending={isSending} />
          ))}
        </ul>
      )}
    </div>
  )

  if (registerLoading) {
    return <div className="grid h-full grid-cols-2 gap-3 p-6 md:grid-cols-4">{[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-40" />)}</div>
  }

  return (
    <RegisterOverlay>
      <div className="flex h-full overflow-hidden">
        {/* ── Catalog ─────────────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-3 px-4 pt-4 pb-3 md:px-6">
            <SearchField value={productSearch} onChange={setProductSearch} onClear={() => setProductSearch('')} icon={Search} clearIcon={X} placeholder="Buscar producto" />
            {!productSearch.trim() ? (
              <div className="-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-hide md:-mx-6 md:px-6">
                {catalogLoading
                  ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-9 w-28 shrink-0 rounded-full" />)
                  : sections.map((sec) => (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => setActiveSection(sec.name)}
                      className={cx(
                        'h-9 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap transition-colors',
                        activeSection === sec.name ? 'bg-primary text-on-primary' : 'bg-secondary text-muted hover:text-ink',
                      )}
                    >
                      {sec.name}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="text-sm text-muted">{displayedProducts.length} {displayedProducts.length === 1 ? 'resultado' : 'resultados'} para “{productSearch}”</p>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-28 md:px-6 lg:pb-6">
            {catalogLoading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
            ) : displayedProducts.length === 0 ? (
              <EmptyState icon={Package} title="Nada por aquí" text={productSearch.trim() ? 'Prueba con otro nombre.' : 'Esta sección no tiene productos activos.'} />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {displayedProducts.map((product) => {
                  const hasExtras = (product.optionGroups?.length || 0) + (product.toppingIds?.length || 0) > 0
                  const inTicket = orderItems.filter((it) => it.id === product.id).reduce((s, it) => s + it.qty, 0)
                  return (
                    <button
                      key={product.docId}
                      type="button"
                      onClick={() => addToOrder(product)}
                      className={cx(
                        'group relative flex flex-col overflow-hidden rounded-2xl border bg-surface p-2 text-left transition-[border-color,box-shadow,transform] duration-200 hover:shadow-soft active:scale-[0.98]',
                        inTicket ? 'border-primary' : 'border-line hover:border-line-strong',
                      )}
                    >
                      <ProductArt product={product} className="aspect-[4/3] w-full" rounded="rounded-xl" iconSize={34} />
                      {inTicket > 0 && (
                        <span className="tabular absolute top-3 right-3 flex h-7 min-w-7 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary shadow-soft">{inTicket}</span>
                      )}
                      <div className="px-1.5 pt-2.5 pb-1">
                        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{product.name}</p>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="tabular text-sm font-bold text-ink">{formatMoney(Number(product.price || 0))}</span>
                          {hasExtras && <SlidersHorizontal size={14} className="text-subtle" aria-label="Personalizable" />}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Ticket (desktop) ───────────────────────────────────────────── */}
        <aside className="hidden w-[380px] shrink-0 flex-col overflow-hidden border-l border-line bg-surface lg:flex xl:w-[420px]" aria-label="Ticket">
          <div className="shrink-0 border-b border-line px-4 py-3">{ticketTabs}</div>
          <div className="flex flex-1 flex-col overflow-hidden">
            {ticketTab === 'active' ? activeTicketContent : parkedTicketContent}
          </div>
        </aside>

        {/* ── Ticket (phones/tablets): floating button + sheet ─────────── */}
        {!isTicketOpen && (
          <div className="fixed inset-x-4 bottom-[84px] z-40 lg:hidden">
            <button
              type="button"
              onClick={() => setIsTicketOpen(true)}
              className="flex h-14 w-full items-center gap-3 rounded-full bg-primary pr-6 pl-2 text-on-primary shadow-pop active:scale-[0.99]"
            >
              <span className="tabular flex h-10 min-w-10 items-center justify-center rounded-full bg-accent px-2 text-sm font-bold text-on-accent">{itemCount || <ShoppingCart size={18} />}</span>
              <span className="text-sm font-semibold">{itemCount ? 'Ver ticket' : parkedOrders.length ? `Ticket vacío · ${parkedOrders.length} ${parkedOrders.length === 1 ? 'apartado' : 'apartados'}` : 'Ticket vacío'}</span>
              <span className="tabular ml-auto font-bold">{formatMoney(subtotal)}</span>
            </button>
          </div>
        )}

        <Dialog open={isTicketOpen} onClose={() => setIsTicketOpen(false)} title="Ticket" size="md">
          <div className="-mx-5 flex h-[70dvh] flex-col md:-mx-6">
            <div className="px-4 pb-3">{ticketTabs}</div>
            <div className="flex flex-1 flex-col overflow-hidden border-t border-line">
              {ticketTab === 'active' ? activeTicketContent : parkedTicketContent}
            </div>
          </div>
        </Dialog>

        {isPaymentOpen && (
          <PaymentModal
            customer={customer} loyaltyMax={loyaltyMax}
            cashAmount={cashAmount} setCashAmount={setCashAmount}
            cardAmount={cardAmount} setCardAmount={setCardAmount}
            loyaltyRedeemed={loyaltyRedeemed} setLoyaltyRedeemed={setLoyaltyRedeemed}
            effectiveTotal={effectiveTotal} change={change}
            canConfirm={canConfirmPayment} isProcessing={isProcessing}
            onConfirm={handlePayment} onClose={() => setIsPaymentOpen(false)}
          />
        )}

        <Dialog open={Boolean(orderSuccess)} onClose={() => setOrderSuccess(null)} hideClose size="sm" layer="z-[60]">
          {orderSuccess && (
            <div className="flex flex-col items-center pt-4 text-center">
              <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success-soft text-success animate-pop-in">
                <CheckCircle2 size={34} />
              </span>
              <h3 className="font-display text-2xl font-bold text-ink">Cobrado</h3>
              <p className="tabular text-sm text-muted">Pedido #{orderSuccess.orderId.slice(-4)} enviado a cocina</p>
              {orderSuccess.change > 0.005 && (
                <div className="mt-5 w-full rounded-2xl bg-primary px-5 py-4 text-on-primary">
                  <p className="text-sm opacity-75">Cambio a entregar</p>
                  <p className="tabular font-display text-4xl font-bold">{formatMoney(orderSuccess.change)}</p>
                </div>
              )}
              {orderSuccess.customer && orderSuccess.earned > 0 && (
                <p className="mt-3 text-sm text-muted">{orderSuccess.customer} ganó <span className="font-semibold text-ink">{formatMoney(orderSuccess.earned)}</span> de saldo.</p>
              )}
              <Button block size="lg" className="mt-6" onClick={() => setOrderSuccess(null)}>Siguiente cliente</Button>
            </div>
          )}
        </Dialog>

        <ConfirmDialog
          open={Boolean(resumeTarget)}
          title="¿Reemplazar el pedido actual?"
          text="Tienes productos en el ticket. Si retomas el apartado, el pedido actual se descarta."
          confirmLabel="Retomar apartado"
          onConfirm={() => doResume(resumeTarget)}
          onCancel={() => setResumeTarget(null)}
        />

        <ConfirmDialog
          open={Boolean(deleteParkedId)}
          title="¿Eliminar este apartado?"
          text="El pedido apartado se borra y no llega a cocina."
          onConfirm={confirmDeleteParked}
          onCancel={() => setDeleteParkedId(null)}
        />

        <BottomSheet
          isOpen={Boolean(bottomSheetProduct)}
          onClose={() => setBottomSheetProduct(null)}
          product={bottomSheetProduct}
          onConfirm={handleBottomSheetConfirm}
        />

        <ToppingsOverlay
          isOpen={Boolean(pendingToppingItem)}
          onClose={() => { setPendingToppingItem(null); setPendingBottomSheetResult(null) }}
          productName={toppingOverlayProduct?.name ?? ''}
          productPrice={toppingOverlayPrice}
          toppings={toppingOverlayProduct?.availableToppings ?? []}
          initialSelected={[]}
          onConfirm={handleToppingConfirm}
          confirmLabel="Agregar al pedido"
        />

        <Toast message={toast?.msg} tone={toast?.tone} icon={toast?.tone === 'danger' ? AlertCircle : CheckCircle2} position="bottom" />
      </div>
    </RegisterOverlay>
  )
}
