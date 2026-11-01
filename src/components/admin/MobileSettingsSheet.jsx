/* eslint-disable react/prop-types */
// "Ajustes" sheet: bottom sheet on phones, dialog on desktop.
import { useState, useEffect } from 'react'
import { Check, KeyRound, MessageCircle, Printer } from 'lucide-react'
import { db, doc, setDoc, serverTimestamp } from '../../demo/store'
import { ADMIN_PIN } from '../../config/adminPin'
import { Button, Dialog, Field, inputCls } from '../ui'
import { PrinterSettings } from './SettingsChips'

const SETTINGS_REF = () => doc(db, 'settings', 'general')

const Section = ({ icon: Icon, title, text, children }) => (
  <section className="border-t border-line py-6 first:border-t-0 first:pt-2">
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-ink">
        <Icon size={17} />
      </span>
      <div>
        <h3 className="font-display font-semibold text-ink">{title}</h3>
        {text && <p className="text-sm text-muted">{text}</p>}
      </div>
    </div>
    {children}
  </section>
)

const onlyDigits = (v) => v.replace(/\D/g, '').slice(0, 4)

export const MobileSettingsSheet = ({ open, settings, onClose }) => {
  const activePin = settings?.adminPin || ADMIN_PIN

  // ── WhatsApp ────────────────────────────────────────────────────────────────
  const [phoneVal, setPhoneVal] = useState('')
  const [phoneSaved, setPhoneSaved] = useState(false)

  useEffect(() => {
    if (open) setPhoneVal(settings?.orderNotificationPhone || '')
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const savePhone = async () => {
    await setDoc(SETTINGS_REF(), { orderNotificationPhone: phoneVal.trim(), updatedAt: serverTimestamp() }, { merge: true })
    setPhoneSaved(true)
    setTimeout(() => setPhoneSaved(false), 1800)
  }

  // ── PIN ─────────────────────────────────────────────────────────────────────
  const [pinActual, setPinActual] = useState('')
  const [pinNuevo, setPinNuevo] = useState('')
  const [pinConfirm, setPinConfirm] = useState('')
  const [pinErrs, setPinErrs] = useState({})
  const [pinSaved, setPinSaved] = useState(false)

  const savePin = async () => {
    const errs = {}
    if (pinActual !== activePin) errs.actual = 'El PIN actual no coincide'
    if (pinNuevo.length !== 4) errs.nuevo = 'Debe tener 4 dígitos'
    if (pinNuevo !== pinConfirm) errs.confirm = 'Los PIN no coinciden'
    if (Object.keys(errs).length) { setPinErrs(errs); return }
    await setDoc(SETTINGS_REF(), { adminPin: pinNuevo, updatedAt: serverTimestamp() }, { merge: true })
    setPinSaved(true)
    setPinActual(''); setPinNuevo(''); setPinConfirm(''); setPinErrs({})
    setTimeout(() => setPinSaved(false), 2000)
  }

  const pinInput = (id, label, value, setValue, errKey) => (
    <Field label={label} htmlFor={id} error={pinErrs[errKey]}>
      <input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        value={value}
        onChange={(e) => { setValue(onlyDigits(e.target.value)); setPinErrs((p) => ({ ...p, [errKey]: undefined })) }}
        className={`${inputCls} tracking-[0.4em]`}
      />
    </Field>
  )

  return (
    <Dialog open={open} onClose={onClose} title="Ajustes" description="Se guardan solo en este navegador." size="lg">
      <Section icon={MessageCircle} title="WhatsApp para pedidos" text="Si lo llenas, el cliente puede mandar una copia de su pedido por WhatsApp.">
        <div className="flex gap-2">
          <input
            type="tel"
            inputMode="tel"
            aria-label="Número de WhatsApp"
            value={phoneVal}
            onChange={(e) => setPhoneVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') savePhone() }}
            placeholder="52 55 0000 0000"
            className={inputCls}
          />
          <Button onClick={savePhone} variant={phoneSaved ? 'secondary' : 'primary'}>
            {phoneSaved ? <><Check size={16} /> Guardado</> : 'Guardar'}
          </Button>
        </div>
      </Section>

      <Section icon={KeyRound} title="PIN del panel" text="Se pide al abrir pantallas con candado y al cambiar candados.">
        {pinSaved ? (
          <div className="flex items-center gap-2 rounded-2xl bg-success-soft px-4 py-3 text-sm font-semibold text-success">
            <Check size={16} /> PIN actualizado
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {pinInput('pin-actual', 'PIN actual', pinActual, setPinActual, 'actual')}
              {pinInput('pin-nuevo', 'Nuevo PIN', pinNuevo, setPinNuevo, 'nuevo')}
              {pinInput('pin-confirm', 'Confírmalo', pinConfirm, setPinConfirm, 'confirm')}
            </div>
            <Button variant="secondary" onClick={savePin} disabled={!pinActual || !pinNuevo || !pinConfirm}>Cambiar PIN</Button>
          </div>
        )}
      </Section>

      <Section icon={Printer} title="Impresora de tickets">
        {open && <PrinterSettings settings={settings} />}
      </Section>
    </Dialog>
  )
}
