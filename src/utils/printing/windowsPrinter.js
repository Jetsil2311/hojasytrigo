// windowsPrinter.js — browser print-dialog path. Works on any OS/printer with
// zero setup: renders the receipt as HTML in a hidden iframe sized for 80mm
// thermal paper and calls window.print().
import { fmt } from './receiptContent'

const escapeHtml = (str) =>
  String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

const itemsHtml = (items, { withPrices }) =>
  items
    .map(
      (item) => `
    <div class="item">
      <div class="item-row">
        <span>${item.qty}x ${escapeHtml(item.name)}</span>
        ${withPrices ? `<span>$${fmt(item.lineTotal)}</span>` : ''}
      </div>
      ${item.modifiersText ? `<div class="item-sub">${escapeHtml(item.modifiersText)}</div>` : ''}
      ${item.noteText ? `<div class="item-sub">Nota: ${escapeHtml(item.noteText)}</div>` : ''}
    </div>`
    )
    .join('')

const BASE_STYLE = `
  @page { size: 80mm auto; margin: 0; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; width: 72mm; margin: 0 auto; padding: 4mm 0; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .logo { display: block; margin: 0 auto 6px; max-width: 55mm; max-height: 20mm; object-fit: contain; }
  hr { border: none; border-top: 1px dashed #000; margin: 6px 0; }
  .item-row { display: flex; justify-content: space-between; gap: 8px; }
  .item-sub { padding-left: 8px; font-size: 11px; color: #333; }
  .totals-row { display: flex; justify-content: space-between; }
  .footer { margin-top: 8px; }
`

export const buildReceiptHtml = (content) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head><body>
  <img class="logo" src="/logo.svg" alt="">
  <p class="center bold">${escapeHtml(content.businessName)}</p>
  <p class="center">COMPROBANTE DE VENTA</p>
  <p>${content.createdAt.toLocaleString('es-MX')}</p>
  ${content.orderId ? `<p>Pedido: #${escapeHtml(content.orderId.slice(-8))}</p>` : ''}
  ${content.customerName ? `<p>Cliente: ${escapeHtml(content.customerName)}</p>` : ''}
  <hr>
  ${itemsHtml(content.items, { withPrices: true })}
  <hr>
  <div class="totals-row"><span>Subtotal (sin IVA)</span><span>$${fmt(content.subtotalSinIva)}</span></div>
  <div class="totals-row"><span>IVA (16%)</span><span>$${fmt(content.iva)}</span></div>
  <div class="totals-row bold"><span>TOTAL</span><span>$${fmt(content.total)}</span></div>
  ${content.paymentMethods.cash > 0 ? `<div class="totals-row"><span>Efectivo</span><span>$${fmt(content.paymentMethods.cash)}</span></div>` : ''}
  ${content.paymentMethods.card > 0 ? `<div class="totals-row"><span>Tarjeta</span><span>$${fmt(content.paymentMethods.card)}</span></div>` : ''}
  ${content.paymentMethods.loyalty > 0 ? `<div class="totals-row"><span>Loyalty</span><span>$${fmt(content.paymentMethods.loyalty)}</span></div>` : ''}
  ${content.loyaltyRedeemed > 0 ? `<div class="totals-row"><span>Redimido</span><span>$${fmt(content.loyaltyRedeemed)}</span></div>` : ''}
  ${content.loyaltyEarned > 0 ? `<div class="totals-row"><span>Ganado</span><span>$${fmt(content.loyaltyEarned)}</span></div>` : ''}
  ${content.generalNote ? `<p>Notas: ${escapeHtml(content.generalNote)}</p>` : ''}
  <p class="center footer">${escapeHtml(content.footerMessage)}</p>
</body></html>`

export const buildCommandaHtml = (content) => `<!doctype html><html><head><meta charset="utf-8"><style>${BASE_STYLE}</style></head><body>
  <p class="center bold">COMANDA DE COCINA</p>
  <p>${content.createdAt.toLocaleString('es-MX')}</p>
  ${content.orderId ? `<p>Pedido: #${escapeHtml(content.orderId.slice(-8))}</p>` : ''}
  ${content.customerName ? `<p>Cliente: ${escapeHtml(content.customerName)}</p>` : ''}
  <hr>
  ${itemsHtml(content.items, { withPrices: false })}
  ${content.generalNote ? `<hr><p>Notas: ${escapeHtml(content.generalNote)}</p>` : ''}
</body></html>`

const printHtmlViaIframe = (html) =>
  new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    let settled = false
    const finish = (fn, arg) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      setTimeout(() => iframe.remove(), 500)
      fn(arg)
    }

    const timer = setTimeout(() => finish(reject, new Error('Tiempo de espera agotado al imprimir')), 8000)

    iframe.onload = () => {
      try {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
        finish(resolve)
      } catch (err) {
        finish(reject, err)
      }
    }

    try {
      const doc = iframe.contentDocument
      doc.open()
      doc.write(html)
      doc.close()
    } catch (err) {
      finish(reject, err)
    }
  })

export const printViaWindows = async (content, { isComanda = false } = {}) => {
  try {
    const html = isComanda ? buildCommandaHtml(content) : buildReceiptHtml(content)
    await printHtmlViaIframe(html)
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message || 'Error al imprimir' }
  }
}

export const printWindowsTestPage = () => {
  const content = {
    businessName: 'Prueba de impresión',
    footerMessage: 'Ticket de prueba',
    orderId: 'TEST-0001',
    customerName: '',
    createdAt: new Date(),
    items: [{ name: 'Producto de prueba', qty: 1, unitPrice: 10, modifiersText: '', noteText: '', lineTotal: 10 }],
    generalNote: '',
    paymentMethods: { cash: 10 },
    loyaltyRedeemed: 0,
    loyaltyEarned: 0,
    subtotalSinIva: 8.62,
    iva: 1.38,
    total: 10,
  }
  return printViaWindows(content, { isComanda: false })
}
