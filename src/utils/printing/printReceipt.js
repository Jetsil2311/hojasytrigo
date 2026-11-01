// printReceipt.js — router. Delegates to the USB (ESC/POS) or Windows
// (print dialog) path based on settings.printMethod. Never throws — always
// resolves to { success: true } | { success: false, reason?, error? }.
import { buildReceiptContent, buildCommandaContent } from './receiptContent'
import { printViaUsb } from './usbPrinter'
import { printViaWindows } from './windowsPrinter'

export const printReceipt = async (order, settings = {}) => {
  if (!settings?.printingEnabled) return { success: false, reason: 'disabled' }
  const content = buildReceiptContent(order, settings)
  return settings.printMethod === 'windows'
    ? printViaWindows(content, { isComanda: false })
    : printViaUsb(content, { isComanda: false })
}

// Kitchen comandas always use the Windows dialog path — no USB pairing required.
export const printComanda = async (order, settings = {}) => {
  if (!settings?.printingEnabled) return { success: false, reason: 'disabled' }
  const content = buildCommandaContent(order)
  return printViaWindows(content, { isComanda: true })
}

export {
  isUsbPaired,
  connectUsbPrinter,
  reconnectUsbPrinter,
  forgetUsbPrinter,
  printUsbTestPage,
} from './usbPrinter'

export { printWindowsTestPage } from './windowsPrinter'
