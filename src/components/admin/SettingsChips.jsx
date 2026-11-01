/* eslint-disable react/prop-types */
// Printer settings panel (rendered inside the Ajustes sheet).
import { useState, useEffect } from 'react'
import { Check, Monitor, RefreshCcw, Usb, X } from 'lucide-react'
import { db, doc, setDoc, serverTimestamp } from '../../demo/store'
import { BUSINESS_NAME } from '../../config/demo'
import { Button, Field, Segmented, Switch, inputCls } from '../ui'
import {
  isUsbPaired, connectUsbPrinter, reconnectUsbPrinter, forgetUsbPrinter,
  printUsbTestPage, printWindowsTestPage,
} from '../../utils/printReceipt'

const SETTINGS_REF = () => doc(db, 'settings', 'general')

const saveField = async (field, value) => {
  try {
    await setDoc(SETTINGS_REF(), { [field]: value, updatedAt: serverTimestamp() }, { merge: true })
  } catch { /* keep local state; the next change will retry */ }
}

export const PrinterSettings = ({ settings }) => {
  const [printMethod, setPrintMethod] = useState(settings?.printMethod || 'windows')
  const [printingEnabled, setPrintingEnabled] = useState(settings?.printingEnabled ?? false)
  const [businessName, setBusinessName] = useState(settings?.receiptBusinessName || '')
  const [footerMsg, setFooterMsg] = useState(settings?.receiptFooterMessage || '')
  const [autoPrint, setAutoPrint] = useState(settings?.autoPrintOnPayment ?? false)
  const [usbPaired, setUsbPaired] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [testStatus, setTestStatus] = useState(null) // null | 'ok' | 'fail'
  const [testing, setTesting] = useState(false)
  const usbSupported = typeof navigator !== 'undefined' && 'usb' in navigator

  useEffect(() => {
    if (usbSupported) reconnectUsbPrinter().then(() => setUsbPaired(isUsbPaired())).catch(() => {})
  }, [usbSupported])

  const selectMethod = (method) => {
    setPrintMethod(method)
    saveField('printMethod', method)
  }

  const connectUsb = async () => {
    setConnecting(true)
    try {
      await connectUsbPrinter()
      setUsbPaired(isUsbPaired())
    } catch {
      // picker cancelled or device unsupported
    } finally {
      setConnecting(false)
    }
  }

  const testPrint = async () => {
    setTesting(true)
    setTestStatus(null)
    try {
      const result = printMethod === 'windows' ? await printWindowsTestPage() : await printUsbTestPage()
      setTestStatus(result.success ? 'ok' : 'fail')
    } catch {
      setTestStatus('fail')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">Imprimir tickets</p>
          <p className="text-xs text-muted">Activa la impresión desde el POS y Pedidos.</p>
        </div>
        <Switch
          label="Imprimir tickets"
          checked={printingEnabled}
          onChange={(v) => { setPrintingEnabled(v); saveField('printingEnabled', v) }}
        />
      </div>

      <div className={printingEnabled ? 'space-y-5' : 'pointer-events-none space-y-5 opacity-50'}>
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Método</p>
          <Segmented
            value={printMethod}
            onChange={selectMethod}
            options={[
              { value: 'windows', label: <span className="inline-flex items-center gap-1.5"><Monitor size={14} /> Diálogo del sistema</span> },
              { value: 'usb', label: <span className="inline-flex items-center gap-1.5"><Usb size={14} /> USB directo</span> },
            ]}
          />
        </div>

        {printMethod === 'usb' && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 p-4">
            <p className="text-sm text-muted">
              {!usbSupported ? 'Este navegador no soporta USB directo. Usa Chrome o Edge.' : usbPaired ? 'Impresora vinculada.' : 'Sin impresora vinculada.'}
            </p>
            {usbSupported && (usbPaired ? (
              <Button size="sm" variant="danger-soft" onClick={async () => { await forgetUsbPrinter(); setUsbPaired(false) }}>Desvincular</Button>
            ) : (
              <Button size="sm" variant="outline" onClick={connectUsb} disabled={connecting}>{connecting ? 'Buscando…' : 'Vincular'}</Button>
            ))}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre en el ticket" htmlFor="ticket-name">
            <input
              id="ticket-name"
              className={inputCls}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              onBlur={() => saveField('receiptBusinessName', businessName.trim())}
              placeholder={BUSINESS_NAME}
            />
          </Field>
          <Field label="Mensaje final" htmlFor="ticket-footer">
            <input
              id="ticket-footer"
              className={inputCls}
              value={footerMsg}
              onChange={(e) => setFooterMsg(e.target.value)}
              onBlur={() => saveField('receiptFooterMessage', footerMsg.trim())}
              placeholder="Gracias por tu visita"
            />
          </Field>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-ink">Imprimir al cobrar</p>
          <Switch
            label="Imprimir al cobrar"
            checked={autoPrint}
            onChange={(v) => { setAutoPrint(v); saveField('autoPrintOnPayment', v) }}
          />
        </div>

        <div className="flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={testPrint} disabled={testing}>
            {testing && <RefreshCcw size={14} className="animate-spin" />}
            {testing ? 'Imprimiendo…' : 'Imprimir prueba'}
          </Button>
          {testStatus === 'ok' && <span className="inline-flex items-center gap-1 text-sm font-semibold text-success"><Check size={15} /> Enviado</span>}
          {testStatus === 'fail' && <span className="inline-flex items-center gap-1 text-sm font-semibold text-danger"><X size={15} /> No se pudo imprimir</span>}
        </div>
      </div>
    </div>
  )
}
