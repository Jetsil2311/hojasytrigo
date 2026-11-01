/* eslint-disable react/prop-types */
// Admin-only layout pieces shared across screens.
import { TrendingDown, TrendingUp } from 'lucide-react'
import { Card, cx } from '../ui'

export const StatCard = ({ label, value, hint, trend, icon: Icon, tone = 'default', loading }) => (
  <Card className={cx('flex flex-col gap-3 p-5', tone === 'ink' && 'border-primary bg-primary text-on-primary')}>
    <div className="flex items-center justify-between gap-2">
      <p className={cx('text-sm font-medium', tone === 'ink' ? 'opacity-75' : 'text-muted')}>{label}</p>
      {Icon && (
        <span className={cx('flex h-9 w-9 items-center justify-center rounded-xl', tone === 'ink' ? 'bg-accent text-on-accent' : 'bg-secondary text-ink')}>
          <Icon size={17} />
        </span>
      )}
    </div>
    <p className={cx('tabular font-display text-3xl font-bold tracking-tight', loading && 'opacity-30')}>{loading ? '…' : value}</p>
    {(trend !== undefined && trend !== null) || hint ? (
      <div className="flex items-center gap-2 text-xs font-medium">
        {trend !== undefined && trend !== null && (
          <span
            className={cx(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold',
              trend >= 0 ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger',
            )}
          >
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(0)}%
          </span>
        )}
        {hint && <span className={tone === 'ink' ? 'opacity-75' : 'text-subtle'}>{hint}</span>}
      </div>
    ) : null}
  </Card>
)

export const Panel = ({ title, action, children, className = '', bodyClassName = '' }) => (
  <Card className={cx('overflow-hidden', className)}>
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
        {title && <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>}
        {action}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </Card>
)

// Search input with leading icon.
export const SearchField = ({ value, onChange, placeholder, icon: Icon, onClear, clearIcon: ClearIcon, className = '' }) => (
  <div className={cx('relative', className)}>
    {Icon && <Icon size={17} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-subtle" />}
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-11 w-full rounded-full border border-line-strong bg-surface pr-10 pl-11 text-sm text-ink outline-none transition placeholder:text-subtle focus:border-ink focus:ring-2 focus:ring-accent/40 [&::-webkit-search-cancel-button]:hidden"
    />
    {value && onClear && ClearIcon && (
      <button type="button" onClick={onClear} aria-label="Borrar búsqueda" className="absolute top-1/2 right-1.5 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-subtle hover:bg-secondary hover:text-ink">
        <ClearIcon size={15} />
      </button>
    )}
  </div>
)

export const timeAgo = (date) => {
  if (!date) return ''
  const mins = Math.floor((Date.now() - date.getTime()) / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const h = Math.floor(mins / 60)
  if (h < 24) return `hace ${h} h`
  return date.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
}

export const shortOrderId = (order) => (order.orderId || order.id || '').slice(-4).toUpperCase()

export const itemsPreview = (order, max = 2) => {
  if (Array.isArray(order.items) && order.items.length) {
    const names = order.items.map((it) => `${it.qty > 1 ? `${it.qty}× ` : ''}${it.name}`)
    return names.slice(0, max).join(', ') + (names.length > max ? ` y ${names.length - max} más` : '')
  }
  const lines = (order.content || '').split('\n').filter((l) => /^\d+\./.test(l.trim()))
  return lines.map((l) => l.replace(/^\d+\.\s*/, '').split(' - ')[0]).slice(0, max).join(', ') || 'Sin detalle'
}
