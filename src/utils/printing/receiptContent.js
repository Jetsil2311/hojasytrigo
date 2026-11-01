import { BUSINESS_NAME } from '../../config/demo'
// receiptContent.js — normalizes Firestore order docs into a print-ready shape
// consumed by both the USB (ESC/POS) and Windows (print dialog) paths.

// NaN-safe money formatter — a malformed order doc should degrade gracefully
// instead of crashing the whole print job.
export const fmt = (n) => (isNaN(n) || n == null ? '0.00' : Number(n).toFixed(2))

const lineTotal = (item) => {
  const opts = (item.selectedOptions || []).reduce((s, o) => s + Number(o.priceModifier || 0), 0)
  const tops = (item.selectedToppings || []).reduce((s, t) => s + Number(t.price || 0), 0)
  return (Number(item.price || 0) + opts + tops) * Number(item.qty || 1)
}

const modifiersText = (item) => {
  const opts = (item.selectedOptions || []).map((o) => o.optionName).filter(Boolean)
  const tops = (item.selectedToppings || []).map((t) => t.name).filter(Boolean)
  return [...opts, ...tops].join(', ')
}

const normalizeItems = (items) =>
  (Array.isArray(items) ? items : []).map((it) => ({
    name: it.name || 'Producto',
    qty: Number(it.qty || 1),
    unitPrice: Number(it.price || 0),
    modifiersText: modifiersText(it),
    noteText: it.itemNote || '',
    lineTotal: lineTotal(it),
  }))

const toDate = (value) => {
  if (value instanceof Date) return value
  if (value?.toDate) return value.toDate()
  return new Date()
}

// IVA (16%) breakdown from a total that already includes tax. Rounding is
// corrected so subtotal + IVA always sum exactly back to the total.
const ivaBreakdown = (total) => {
  const safeTotal = isNaN(total) ? 0 : Number(total)
  const subtotalSinIva = Math.round((safeTotal / 1.16) * 100) / 100
  const ivaRaw = Math.round((safeTotal - subtotalSinIva) * 100) / 100
  const iva = Math.round((ivaRaw + (safeTotal - (subtotalSinIva + ivaRaw))) * 100) / 100
  return { subtotalSinIva, iva }
}

export const buildReceiptContent = (order, settings = {}) => {
  const total = Number(order.total ?? 0)
  const { subtotalSinIva, iva } = ivaBreakdown(total)
  return {
    businessName: settings.receiptBusinessName || BUSINESS_NAME,
    footerMessage: settings.receiptFooterMessage || 'Gracias por tu visita',
    orderId: order.orderId || order.id || '',
    customerName: order.customerName || order.customer?.name || '',
    createdAt: toDate(order.createdAt),
    items: normalizeItems(order.items),
    generalNote: order.generalNote || order.note || '',
    paymentMethods: order.paymentMethods || {},
    loyaltyRedeemed: Number(order.loyaltyRedeemed || 0),
    loyaltyEarned: Number(order.loyaltyEarned || 0),
    subtotalSinIva,
    iva,
    total,
  }
}

// Kitchen comanda — internal use only, no prices or payment details.
export const buildCommandaContent = (order) => ({
  orderId: order.orderId || order.id || '',
  customerName: order.customerName || order.customer?.name || '',
  createdAt: toDate(order.createdAt),
  items: normalizeItems(order.items).map(({ name, qty, modifiersText, noteText }) => ({ name, qty, modifiersText, noteText })),
  generalNote: order.generalNote || order.note || '',
})
