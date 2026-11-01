import { BUSINESS_NAME } from '../../config/demo'
// usbPrinter.js — WebUSB ESC/POS path. No OS driver required; the browser
// writes raw ESC/POS bytes straight to the printer's USB bulk-out endpoint.
import { fmt } from './receiptContent'

// Common thermal-printer vendor IDs (Epson, Star Micronics, Bixolon, plus a
// couple of widely-cloned generic controllers). Widen this list if a client's
// printer isn't detected by the browser's device picker.
const VENDOR_IDS = [0x04b8, 0x0519, 0x1504, 0x0483, 0x1fc9]

const RASTER_WIDTH = 384 // dots — standard print width for 58/80mm ESC/POS printers

let usbDevice = null
let usbEndpointOut = null
let cachedLogoBytes = null
let logoLoadPromise = null

// Byte-for-byte Latin-1 mapping — preserves Spanish accented characters
// (á é í ó ú ñ ¿ ¡) once the printer's codepage is set to a Latin-1-compatible page.
const encodeLatin1 = (str) => {
  const bytes = []
  for (const ch of String(str)) {
    const code = ch.codePointAt(0)
    bytes.push(code <= 0xff ? code : 0x3f) // '?' fallback for anything outside Latin-1
  }
  return new Uint8Array(bytes)
}

const ESC = 0x1b
const GS = 0x1d
const CMD = {
  init: [ESC, 0x40],
  alignLeft: [ESC, 0x61, 0x00],
  alignCenter: [ESC, 0x61, 0x01],
  boldOn: [ESC, 0x45, 0x01],
  boldOff: [ESC, 0x45, 0x00],
  codepage: [ESC, 0x74, 0x10], // Latin-1-compatible codepage
  feed: (n) => [ESC, 0x64, n],
  cut: [GS, 0x56, 0x00],
}

const concatBytes = (chunks) => {
  const total = chunks.reduce((s, c) => s + c.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const c of chunks) { out.set(c, offset); offset += c.length }
  return out
}

const textLine = (str, { bold = false, center = false } = {}) => {
  const parts = []
  if (center) parts.push(new Uint8Array(CMD.alignCenter))
  if (bold) parts.push(new Uint8Array(CMD.boldOn))
  parts.push(encodeLatin1(`${str}\n`))
  if (bold) parts.push(new Uint8Array(CMD.boldOff))
  if (center) parts.push(new Uint8Array(CMD.alignLeft))
  return concatBytes(parts)
}

const twoColLine = (left, right, width = 32) => {
  const space = Math.max(1, width - left.length - right.length)
  return textLine(left + ' '.repeat(space) + right)
}

// ── Logo rasterization ──────────────────────────────────────────────────────
// Loads /logo.svg (same file used in the navbar), draws it onto an offscreen
// canvas, and converts it to a 1-bit ESC/POS raster image (GS v 0). Cached at
// module level after first successful load. Any failure (unsupported browser,
// network, canvas error) yields null and receipts fall back to text-only —
// this never blocks printing.
const rasterizeLogo = async () => {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  const loaded = new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
  })
  img.src = '/logo.svg'
  await loaded

  const size = 160
  const canvas = document.createElement('canvas')
  canvas.width = RASTER_WIDTH
  canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, (RASTER_WIDTH - size) / 2, 0, size, size)

  const { data } = ctx.getImageData(0, 0, RASTER_WIDTH, size)
  const widthBytes = RASTER_WIDTH / 8
  const raster = new Uint8Array(widthBytes * size)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < RASTER_WIDTH; x++) {
      const idx = (y * RASTER_WIDTH + x) * 4
      const luminance = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
      if (data[idx + 3] > 32 && luminance < 128) {
        raster[y * widthBytes + (x >> 3)] |= 0x80 >> (x % 8)
      }
    }
  }

  const header = new Uint8Array([
    GS, 0x76, 0x30, 0x00,
    widthBytes & 0xff, (widthBytes >> 8) & 0xff,
    size & 0xff, (size >> 8) & 0xff,
  ])
  return concatBytes([header, raster])
}

const loadLogoEscBytes = async () => {
  if (cachedLogoBytes !== null) return cachedLogoBytes
  if (!logoLoadPromise) logoLoadPromise = rasterizeLogo().catch(() => null)
  cachedLogoBytes = await logoLoadPromise
  logoLoadPromise = null
  return cachedLogoBytes
}

// ── ESC/POS document builder ────────────────────────────────────────────────

const buildEscPosReceipt = async (content, { isComanda = false } = {}) => {
  const chunks = [new Uint8Array(CMD.init), new Uint8Array(CMD.codepage)]

  if (!isComanda) {
    const logo = await loadLogoEscBytes()
    if (logo) {
      chunks.push(new Uint8Array(CMD.alignCenter), logo, new Uint8Array(CMD.alignLeft), new Uint8Array([0x0a]))
    }
  }

  chunks.push(textLine(content.businessName || BUSINESS_NAME, { bold: true, center: true }))
  chunks.push(textLine(isComanda ? 'COMANDA DE COCINA' : 'COMPROBANTE DE VENTA', { center: true }))
  chunks.push(textLine(content.createdAt.toLocaleString('es-MX')))
  if (content.orderId) chunks.push(textLine(`Pedido: #${content.orderId.slice(-8)}`))
  if (content.customerName) chunks.push(textLine(`Cliente: ${content.customerName}`))
  chunks.push(textLine('-'.repeat(32)))

  content.items.forEach((item) => {
    chunks.push(textLine(`${item.qty}x ${item.name}`))
    if (item.modifiersText) chunks.push(textLine(`  ${item.modifiersText}`))
    if (item.noteText) chunks.push(textLine(`  Nota: ${item.noteText}`))
    if (!isComanda) chunks.push(twoColLine('', `$${fmt(item.lineTotal)}`))
  })

  chunks.push(textLine('-'.repeat(32)))

  if (!isComanda) {
    chunks.push(twoColLine('Subtotal (sin IVA)', `$${fmt(content.subtotalSinIva)}`))
    chunks.push(twoColLine('IVA (16%)', `$${fmt(content.iva)}`))
    chunks.push(textLine(''.padEnd(32, ' ')))
    chunks.push(twoColLine('TOTAL', `$${fmt(content.total)}`, { bold: true }))
    if (content.paymentMethods.cash > 0) chunks.push(twoColLine('Efectivo', `$${fmt(content.paymentMethods.cash)}`))
    if (content.paymentMethods.card > 0) chunks.push(twoColLine('Tarjeta', `$${fmt(content.paymentMethods.card)}`))
    if (content.paymentMethods.loyalty > 0) chunks.push(twoColLine('Loyalty', `$${fmt(content.paymentMethods.loyalty)}`))
    if (content.loyaltyRedeemed > 0) chunks.push(twoColLine('Redimido', `$${fmt(content.loyaltyRedeemed)}`))
    if (content.loyaltyEarned > 0) chunks.push(twoColLine('Ganado', `$${fmt(content.loyaltyEarned)}`))
  }

  if (content.generalNote) chunks.push(textLine(`Notas: ${content.generalNote}`))

  if (!isComanda) {
    chunks.push(textLine(''))
    chunks.push(textLine(content.footerMessage, { center: true }))
  }

  chunks.push(new Uint8Array(CMD.feed(3)))
  chunks.push(new Uint8Array(CMD.cut))

  return concatBytes(chunks)
}

// ── Device connection ───────────────────────────────────────────────────────

const openUsbDevice = async (device) => {
  await device.open()
  if (!device.configuration) await device.selectConfiguration(1)
  const iface = device.configuration.interfaces.find((i) =>
    i.alternates.some((a) => a.endpoints.some((e) => e.direction === 'out'))
  )
  if (!iface) throw new Error('No se encontró una interfaz de impresión USB')
  await device.claimInterface(iface.interfaceNumber)
  const alt = iface.alternates.find((a) => a.endpoints.some((e) => e.direction === 'out'))
  const outEndpoint = alt.endpoints.find((e) => e.direction === 'out')
  usbDevice = device
  usbEndpointOut = outEndpoint.endpointNumber
}

export const isUsbPaired = () => usbDevice !== null

export const connectUsbPrinter = async () => {
  if (!navigator.usb) throw new Error('WebUSB no soportado en este navegador')
  const device = await navigator.usb.requestDevice({
    filters: VENDOR_IDS.map((vendorId) => ({ vendorId })),
  })
  await openUsbDevice(device)
}

// Auto-reconnects to a previously-authorized device without a user gesture.
export const reconnectUsbPrinter = async () => {
  if (!navigator.usb) return false
  try {
    const devices = await navigator.usb.getDevices()
    const known = devices.find((d) => VENDOR_IDS.includes(d.vendorId))
    if (!known) return false
    await openUsbDevice(known)
    return true
  } catch {
    return false
  }
}

export const forgetUsbPrinter = async () => {
  try { if (usbDevice) await usbDevice.close() } catch { /* device already gone */ }
  usbDevice = null
  usbEndpointOut = null
}

const withTimeout = (promise, ms, message) =>
  Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])

export const printViaUsb = async (content, { isComanda = false } = {}) => {
  try {
    if (!usbDevice) {
      const reconnected = await reconnectUsbPrinter()
      if (!reconnected) return { success: false, error: 'Impresora USB no vinculada' }
    }
    const bytes = await withTimeout(buildEscPosReceipt(content, { isComanda }), 8000, 'Tiempo de espera agotado al generar el ticket')
    await withTimeout(usbDevice.transferOut(usbEndpointOut, bytes), 8000, 'Tiempo de espera agotado al imprimir')
    return { success: true }
  } catch (err) {
    return { success: false, error: err?.message || 'Error al imprimir por USB' }
  }
}

export const printUsbTestPage = () => {
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
  return printViaUsb(content, { isComanda: false })
}
