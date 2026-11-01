/* eslint-disable react/prop-types */
// Shared building blocks for the menu and the admin panel. Keeping buttons,
// inputs, badges and dialogs here is what keeps both apps visually consistent.
//
// Shape rule: interactive buttons are pills, containers are 16px (rounded-2xl),
// sheets and dialogs are 24px (rounded-3xl), inputs are 12px (rounded-xl).
//
// Layers: sticky bars z-30, floating cart z-40, sheets/overlays z-50,
// dialogs above sheets z-[60], toasts z-[70].
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const cx = (...parts) => parts.filter(Boolean).join(' ')
export { cx }

// ── Buttons ──────────────────────────────────────────────────────────────────

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-on-primary hover:opacity-90',
  accent: 'bg-accent text-on-accent hover:brightness-105',
  secondary: 'bg-secondary text-on-secondary hover:bg-line',
  outline: 'border border-line-strong bg-surface text-ink hover:bg-surface-2',
  'on-accent': 'border border-on-accent/30 text-on-accent hover:bg-on-accent/10',
  ghost: 'text-muted hover:bg-secondary hover:text-ink',
  danger: 'bg-danger text-on-primary hover:opacity-90',
  'danger-soft': 'bg-danger-soft text-danger hover:opacity-80',
}

const BUTTON_SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-6 text-base gap-2',
}

export const buttonCls = ({ variant = 'primary', size = 'md', block = false, className = '' } = {}) =>
  cx(
    'inline-flex shrink-0 items-center rounded-full font-semibold whitespace-nowrap',
    !className.includes('justify-') && 'justify-center',
    'transition-[background-color,opacity,filter,transform] duration-200 active:scale-[0.98]',
    'disabled:opacity-40 disabled:pointer-events-none select-none',
    BUTTON_VARIANTS[variant],
    BUTTON_SIZES[size],
    block && 'w-full',
    className,
  )

export const Button = ({ variant, size, block, className, type = 'button', ...props }) => (
  <button type={type} className={buttonCls({ variant, size, block, className })} {...props} />
)

export const IconButton = ({ label, className = '', variant = 'ghost', size = 'md', type = 'button', children, ...props }) => (
  <button
    type={type}
    aria-label={label}
    title={label}
    className={cx(
      'inline-flex shrink-0 items-center justify-center rounded-full transition-colors duration-200 active:scale-95',
      'disabled:opacity-40 disabled:pointer-events-none',
      size === 'sm' ? 'h-9 w-9' : 'h-11 w-11',
      BUTTON_VARIANTS[variant],
      className,
    )}
    {...props}
  >
    {children}
  </button>
)

// ── Form controls ────────────────────────────────────────────────────────────

export const inputCls = cx(
  'w-full min-h-11 rounded-xl border border-line-strong bg-surface px-3.5 text-base text-ink md:text-sm',
  'placeholder:text-subtle outline-none transition-colors',
  'focus:border-ink focus:ring-2 focus:ring-accent/40',
)

export const labelCls = 'block text-sm font-medium text-ink mb-1.5'

export const Field = ({ label, hint, error, htmlFor, children, className = '' }) => (
  <div className={className}>
    {label && <label htmlFor={htmlFor} className={labelCls}>{label}</label>}
    {children}
    {hint && !error && <p className="mt-1.5 text-xs text-subtle">{hint}</p>}
    {error && <p className="mt-1.5 text-xs font-medium text-danger">{error}</p>}
  </div>
)

export const Switch = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={cx(
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 disabled:opacity-40',
      checked ? 'bg-primary' : 'bg-line-strong',
    )}
  >
    <span
      className={cx(
        'inline-block h-5 w-5 rounded-full bg-surface shadow-soft transition-transform duration-200',
        checked ? 'translate-x-6' : 'translate-x-1',
      )}
    />
  </button>
)

// Pill tabs. `options` = [{ value, label, count? }]
export const Segmented = ({ options, value, onChange, className = '', size = 'md' }) => (
  <div className={cx('inline-flex items-center gap-1 rounded-full bg-secondary p-1', className)} role="tablist">
    {options.map((opt) => {
      const active = opt.value === value
      return (
        <button
          key={opt.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(opt.value)}
          className={cx(
            'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-200',
            size === 'sm' ? 'h-8 px-3 text-xs' : 'h-9 px-4 text-sm',
            active ? 'bg-surface text-ink shadow-soft' : 'text-muted hover:text-ink',
          )}
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className={cx('tabular rounded-full px-1.5 text-[11px]', active ? 'bg-primary text-on-primary' : 'bg-line text-muted')}>
              {opt.count}
            </span>
          )}
        </button>
      )
    })}
  </div>
)

// ── Surfaces ─────────────────────────────────────────────────────────────────

export const Card = ({ className = '', as: Tag = 'div', ...props }) => (
  <Tag
    className={cx(
      'rounded-2xl border',
      !/(^|\s)border-(?!t|b|l|r|x|y|dashed)/.test(className) && 'border-line',
      !/(^|\s)bg-/.test(className) && 'bg-surface',
      className,
    )}
    {...props}
  />
)

const BADGE_TONES = {
  neutral: 'bg-secondary text-muted',
  accent: 'bg-accent-soft text-accent-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  info: 'bg-info-soft text-info',
  ink: 'bg-primary text-on-primary',
  stamp: 'bg-accent text-on-accent',
}

export const Badge = ({ tone = 'neutral', className = '', children }) => (
  <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', BADGE_TONES[tone], className)}>
    {children}
  </span>
)

// Order lifecycle colors, shared by every screen that shows an order.
export const ORDER_STATUS_TONE = {
  nuevo: 'info',
  preparando: 'warning',
  listo: 'success',
  pagado: 'neutral',
}

export const StatusBadge = ({ status }) => (
  <Badge tone={ORDER_STATUS_TONE[status?.toLowerCase?.()] ?? 'info'}>{status || 'Nuevo'}</Badge>
)

export const EmptyState = ({ icon: Icon, title, text, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
    {Icon && (
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted">
        <Icon size={26} strokeWidth={1.75} />
      </div>
    )}
    <p className="font-display text-lg font-semibold text-ink">{title}</p>
    {text && <p className="mt-1 max-w-xs text-sm text-muted">{text}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
)

export const Skeleton = ({ className = '' }) => (
  <div className={cx('animate-pulse rounded-xl bg-secondary', className)} />
)

// ── Dialog / Sheet ───────────────────────────────────────────────────────────
// Bottom sheet on phones, centered dialog on md+. Closes on Escape and on
// backdrop tap. Locks body scroll while open.

export const useLockBodyScroll = (active) => {
  useEffect(() => {
    if (!active) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [active])
}

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  layer = 'z-50',
  hideClose = false,
}) => {
  const panelRef = useRef(null)
  useLockBodyScroll(open)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const width = { sm: 'md:max-w-sm', md: 'md:max-w-md', lg: 'md:max-w-lg', xl: 'md:max-w-2xl' }[size]

  return createPortal(
    <div className={cx('fixed inset-0 flex items-end justify-center md:items-center md:p-6', layer)} role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-scrim/50 backdrop-blur-[2px] animate-fade-in" onClick={onClose} />
      <div
        ref={panelRef}
        className={cx(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-pop',
          'animate-sheet-up md:animate-pop-in md:rounded-3xl',
          width,
        )}
      >
        <div className="flex justify-center pt-2.5 md:hidden" aria-hidden="true">
          <div className="h-1 w-10 rounded-full bg-line-strong" />
        </div>
        {(title || !hideClose) && (
          <div className="flex items-start justify-between gap-4 px-5 pt-3 pb-2 md:px-6 md:pt-5">
            <div className="min-w-0">
              {title && <h2 className="font-display text-xl font-semibold text-ink">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            {!hideClose && (
              <IconButton label="Cerrar" size="sm" onClick={onClose} className="-mr-1.5">
                <X size={18} />
              </IconButton>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-5 md:px-6">{children}</div>
        {footer && (
          <div className="border-t border-line bg-surface px-5 py-4 pb-safe md:px-6 md:pb-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}

export const ConfirmDialog = ({ open, title, text, confirmLabel = 'Eliminar', tone = 'danger', loading, onConfirm, onCancel }) => (
  <Dialog
    open={open}
    onClose={onCancel}
    title={title}
    size="sm"
    layer="z-[60]"
    footer={
      <div className="flex gap-2">
        <Button variant="secondary" block onClick={onCancel}>Cancelar</Button>
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} block disabled={loading} onClick={onConfirm}>
          {loading ? 'Un momento…' : confirmLabel}
        </Button>
      </div>
    }
  >
    <p className="text-sm text-muted">{text}</p>
  </Dialog>
)

// ── Toast ────────────────────────────────────────────────────────────────────

export const Toast = ({ message, icon: Icon, tone = 'ink', position = 'top' }) => {
  if (!message) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'pointer-events-none fixed left-1/2 z-[70] animate-toast-in',
        position === 'top' ? 'top-20' : 'bottom-28 md:bottom-8',
      )}
    >
      <div
        className={cx(
          'flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-pop whitespace-nowrap',
          tone === 'danger' ? 'bg-danger text-on-primary' : 'bg-primary text-on-primary',
        )}
      >
        {Icon && <Icon size={16} strokeWidth={2.25} />}
        {message}
      </div>
    </div>
  )
}
