import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useOutletContext } from 'react-router'
import PropTypes from 'prop-types'
import { Delete, Lock } from 'lucide-react'
import { db, doc, getDoc } from '../../demo/store'
// FALLBACK ONLY — the active PIN lives in settings/general.adminPin.
import { ADMIN_PIN } from '../../config/adminPin'
import { DEMO_PIN, BUSINESS_NAME } from '../../config/demo'
import { cx } from '../ui'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'cancel', '0', 'backspace']

// Shared PIN pad state: digits, shake on error, keyboard support on desktop.
const usePinPad = ({ active, onSuccess, onCancel }) => {
  const [digits, setDigits] = useState([])
  const [shaking, setShaking] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [activePin, setActivePin] = useState(ADMIN_PIN)

  // Fetch the current PIN every time the pad opens.
  useEffect(() => {
    if (!active) return
    setDigits([]); setShaking(false); setErrorMsg('')
    let alive = true
    getDoc(doc(db, 'settings', 'general'))
      .then((snap) => { if (alive && snap.exists() && snap.data().adminPin) setActivePin(snap.data().adminPin) })
      .catch(() => {})
    return () => { alive = false }
  }, [active])

  const handleKey = useCallback((key) => {
    if (shaking) return
    if (key === 'cancel') { onCancel(); return }
    if (key === 'backspace') { setDigits((p) => p.slice(0, -1)); setErrorMsg(''); return }
    setDigits((prev) => {
      if (prev.length >= 4) return prev
      const next = [...prev, key]
      if (next.length === 4) {
        if (next.join('') === activePin) {
          setTimeout(() => { setDigits([]); onSuccess() }, 0)
        } else {
          setShaking(true)
          setErrorMsg('Ese no es. Intenta de nuevo.')
          setTimeout(() => { setShaking(false); setDigits([]) }, 420)
        }
      } else {
        setErrorMsg('')
      }
      return next
    })
  }, [shaking, activePin, onSuccess, onCancel])

  useEffect(() => {
    if (!active) return
    const handler = (e) => {
      if (e.key === 'Escape') { onCancel(); return }
      if (!window.matchMedia('(pointer: fine)').matches) return
      if (e.key === 'Backspace') handleKey('backspace')
      else if (e.key >= '0' && e.key <= '9') handleKey(e.key)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [active, handleKey, onCancel])

  return { digits, shaking, errorMsg, handleKey, isDemoPin: activePin === DEMO_PIN }
}

const PinPad = ({ digits, shaking, errorMsg, handleKey, isDemoPin, compact }) => (
  <>
    <div className={cx('flex gap-3', shaking && 'animate-shake')} aria-label={`${digits.length} de 4 dígitos`}>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cx(
            'rounded-full transition-[transform,background-color] duration-150',
            compact ? 'h-3.5 w-3.5' : 'h-4 w-4',
            digits[i] !== undefined ? 'scale-110 bg-primary' : 'bg-line-strong',
          )}
        />
      ))}
    </div>
    <p className={cx('h-5 text-sm font-medium text-danger transition-opacity', errorMsg ? 'opacity-100' : 'opacity-0')} aria-live="polite">
      {errorMsg}
    </p>
    <div className="grid w-full grid-cols-3 gap-2.5">
      {KEYS.map((key) => {
        const isAction = key === 'cancel' || key === 'backspace'
        return (
          <button
            key={key}
            type="button"
            data-pin-key={key}
            onClick={() => handleKey(key)}
            aria-label={key === 'backspace' ? 'Borrar' : key === 'cancel' ? 'Cancelar' : key}
            disabled={!isAction && digits.length >= 4}
            className={cx(
              'flex items-center justify-center rounded-full font-display transition-[background-color,transform] duration-150 active:scale-95',
              compact ? 'h-14' : 'h-16',
              isAction ? 'text-sm font-semibold text-muted hover:bg-secondary' : 'bg-secondary text-2xl font-semibold text-ink hover:bg-line',
            )}
          >
            {key === 'backspace' ? <Delete size={22} /> : key === 'cancel' ? 'Cancelar' : key}
          </button>
        )
      })}
    </div>
    {isDemoPin && (
      <p className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent-ink">PIN de la demo: {DEMO_PIN}</p>
    )}
  </>
)

PinPad.propTypes = {
  digits: PropTypes.array.isRequired,
  shaking: PropTypes.bool,
  errorMsg: PropTypes.string,
  handleKey: PropTypes.func.isRequired,
  isDemoPin: PropTypes.bool,
  compact: PropTypes.bool,
}

// ─── PinGate ──────────────────────────────────────────────────────────────────
// Full-screen PIN pad in front of a locked screen.
export const PinGate = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false)
  const navigate = useNavigate()
  const overlayRef = useRef(null)
  const onSuccess = useCallback(() => setUnlocked(true), [])
  const onCancel = useCallback(() => navigate('/admin/pedidos'), [navigate])
  const pad = usePinPad({ active: !unlocked, onSuccess, onCancel })

  useEffect(() => {
    if (unlocked) return
    const t = setTimeout(() => overlayRef.current?.querySelector('button[data-pin-key]')?.focus(), 50)
    return () => clearTimeout(t)
  }, [unlocked])

  if (unlocked) return children

  return createPortal(
    <div ref={overlayRef} role="dialog" aria-modal="true" aria-label="Pantalla protegida" className="fixed inset-0 z-[60] flex items-center justify-center bg-bg p-6 animate-fade-in">
      <div className="flex w-full max-w-[300px] flex-col items-center gap-6">
        <div className="flex flex-col items-center text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-on-primary">
            <Lock size={24} />
          </span>
          <h1 className="font-display text-2xl font-bold text-ink">Esta pantalla tiene PIN</h1>
          <p className="mt-1 text-sm text-muted">{BUSINESS_NAME}. Ingresa los 4 dígitos.</p>
        </div>
        <PinPad {...pad} />
      </div>
    </div>,
    document.body
  )
}

PinGate.propTypes = { children: PropTypes.node.isRequired }

// ─── SmartPinGate ─────────────────────────────────────────────────────────────
// Wraps a route in PinGate only when that screen is locked in settings.
export const SmartPinGate = ({ routeKey, children }) => {
  const context = useOutletContext() || {}
  const isLocked = !!context.pinGateConfig?.[routeKey]
  if (isLocked) return <PinGate key={routeKey}>{children}</PinGate>
  return children
}

SmartPinGate.propTypes = {
  routeKey: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
}

// ─── PinPrompt ────────────────────────────────────────────────────────────────
// Compact PIN confirmation dialog before a sensitive action.
export const PinPrompt = ({ isOpen, onClose, onConfirm, actionLabel }) => {
  const overlayRef = useRef(null)
  const onSuccess = useCallback(() => { onConfirm(); onClose() }, [onConfirm, onClose])
  const pad = usePinPad({ active: isOpen, onSuccess, onCancel: onClose })

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => overlayRef.current?.querySelector('button[data-pin-key]')?.focus(), 50)
    return () => clearTimeout(t)
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="pointer-events-none absolute inset-0 bg-scrim/50 backdrop-blur-[2px] animate-fade-in" aria-hidden="true" />
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label="Confirmar con PIN"
        className="relative flex w-full max-w-[320px] flex-col items-center gap-4 rounded-3xl bg-surface p-6 shadow-pop animate-pop-in"
      >
        <div className="text-center">
          <p className="font-display text-lg font-bold text-ink">Confirma con tu PIN</p>
          {actionLabel && <p className="mt-0.5 text-sm text-muted">{actionLabel}</p>}
        </div>
        <PinPad {...pad} compact />
      </div>
    </div>,
    document.body
  )
}

PinPrompt.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  actionLabel: PropTypes.string,
}
