const express = require('express')
const cors    = require('cors')
const { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } = require('node-thermal-printer')

const PRINTER_IP   = process.env.PRINTER_IP   || '192.168.1.100'
const PRINTER_PORT = process.env.PRINTER_PORT  || 9100
const PORT         = process.env.PORT          || 3001

const app = express()
app.use(cors())
app.use(express.json())

// ── Printer factory ───────────────────────────────────────────────────────────
function createPrinter() {
  return new ThermalPrinter({
    type:      PrinterTypes.EPSON,
    interface: `tcp://${PRINTER_IP}:${PRINTER_PORT}`,
    characterSet: CharacterSet.PC858_EURO,
    breakLine: BreakLine.WORD,
    removeSpecialCharacters: false,
    lineCharacter: '-',
    options: { timeout: 5000 },
  })
}

// ── Sequential print queue ────────────────────────────────────────────────────
let queue = Promise.resolve()

// ── Helpers ───────────────────────────────────────────────────────────────────
const DIVIDER = '--------------------------------'

function formatPrice(n) {
  const num = parseFloat(n)
  if (isNaN(num)) return '$0.00'
  return `$${num.toFixed(2)}`
}

function padLine(left, right, width = 32) {
  const gap = width - left.length - right.length
  return left + (gap > 0 ? ' '.repeat(gap) : ' ') + right
}

// ── Receipt print logic ───────────────────────────────────────────────────────
async function printReceiptJob(body) {
  const printer = createPrinter()
  const isConnected = await printer.isPrinterConnected()
  if (!isConnected) throw new Error('Printer not connected')

  const {
    businessName      = 'Nativa',
    items             = [],
    total             = 0,
    paymentMethods    = [],
    loyaltyRedeemed   = 0,
    orderNote         = '',
    orderId           = '',
    footerMessage     = 'Gracias por tu visita',
  } = body

  printer.alignCenter()
  printer.bold(true)
  printer.setTextSize(1, 1)
  printer.println(businessName)
  printer.bold(false)
  printer.setTextNormal()

  if (orderId) {
    printer.alignCenter()
    printer.println(`Pedido #${orderId}`)
  }

  printer.alignLeft()
  printer.drawLine()

  // Items
  for (const item of items) {
    const name  = item.name  || item.productName || 'Producto'
    const qty   = item.qty   || item.quantity    || 1
    const price = parseFloat(item.price || item.unitPrice || 0) * qty
    const left  = `${name} x${qty}`
    const right = formatPrice(price)
    printer.println(padLine(left, right))

    // Modifiers / options
    if (item.modifiers && item.modifiers.length) {
      for (const mod of item.modifiers) {
        const modLabel = typeof mod === 'string' ? mod : (mod.name || '')
        if (modLabel) printer.println(`  + ${modLabel}`)
      }
    }
  }

  printer.drawLine()

  // Subtotal
  const subtotal = parseFloat(total) + parseFloat(loyaltyRedeemed || 0)
  printer.println(padLine('Subtotal', formatPrice(subtotal)))

  // Loyalty
  if (parseFloat(loyaltyRedeemed) > 0) {
    printer.println(padLine('Puntos canjeados', `-${formatPrice(loyaltyRedeemed)}`))
  }

  // Total
  printer.bold(true)
  printer.setTextSize(1, 1)
  printer.println(padLine('TOTAL', formatPrice(total)))
  printer.bold(false)
  printer.setTextNormal()

  printer.drawLine()

  // Payment breakdown
  if (paymentMethods && paymentMethods.length) {
    for (const pm of paymentMethods) {
      const method = pm.method || pm.label || pm.type || 'Pago'
      const amount = pm.amount || 0
      printer.println(padLine(method, formatPrice(amount)))
    }
    printer.drawLine()
  }

  // Order note
  if (orderNote) {
    printer.alignCenter()
    printer.println(`Nota: ${orderNote}`)
    printer.alignLeft()
  }

  // Footer
  printer.alignCenter()
  printer.newLine()
  printer.println(footerMessage)
  printer.newLine()
  printer.cut()

  await printer.execute()
}

// ── Comanda print logic ───────────────────────────────────────────────────────
async function printCommandaJob(body) {
  const printer = createPrinter()
  const isConnected = await printer.isPrinterConnected()
  if (!isConnected) throw new Error('Printer not connected')

  const {
    items      = [],
    orderNote  = '',
    orderId    = '',
    customerName = '',
  } = body

  printer.alignCenter()
  printer.bold(true)
  printer.setTextSize(1, 1)
  printer.println('COMANDA')
  printer.setTextNormal()
  printer.bold(false)

  if (orderId)      printer.println(`Pedido #${orderId}`)
  if (customerName) printer.println(`Cliente: ${customerName}`)

  printer.alignLeft()
  printer.drawLine()

  for (const item of items) {
    const name = item.name  || item.productName || 'Producto'
    const qty  = item.qty   || item.quantity    || 1
    printer.bold(true)
    printer.println(`${qty}x  ${name}`)
    printer.bold(false)

    if (item.modifiers && item.modifiers.length) {
      for (const mod of item.modifiers) {
        const modLabel = typeof mod === 'string' ? mod : (mod.name || '')
        if (modLabel) printer.println(`    + ${modLabel}`)
      }
    }
  }

  printer.drawLine()

  if (orderNote) {
    printer.alignCenter()
    printer.println(`Nota: ${orderNote}`)
    printer.alignLeft()
  }

  printer.newLine()
  printer.cut()

  await printer.execute()
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.post('/print', (req, res) => {
  const body = req.body || {}
  const type = body.type || 'receipt'

  // Wrap into a promise so the caller can await the queued slot
  const taskPromise = new Promise((resolve, reject) => {
    queue = queue.then(async () => {
      try {
        if (type === 'comanda') {
          await printCommandaJob(body)
        } else {
          await printReceiptJob(body)
        }
        resolve()
      } catch (err) {
        reject(err)
      }
    }).catch(() => {})
  })

  taskPromise
    .then(() => res.json({ ok: true }))
    .catch(err => res.json({ ok: false, error: err.message || 'Print failed' }))
})

app.get('/health', (_req, res) => {
  res.json({ ok: true, printer: PRINTER_IP })
})

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Nativa print server running on port ${PORT}`)
  console.log(`Printer target: ${PRINTER_IP}:${PRINTER_PORT}`)
})
