import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * Cash-register style money input: digits flow in from the right ($0.00).
 * value:    number (pesos)
 * onChange: (number) => void
 * max:      optional cap in pesos (e.g. loyalty redemption)
 */
export const MoneyInput = ({ value = 0, onChange, max, className = '', inputClassName = '', ...rest }) => {
  const [cents, setCents] = useState(() => Math.round((value || 0) * 100))

  // Reset when the parent zeros out (form clear) or sets a value from outside.
  useEffect(() => {
    const next = Math.round((value || 0) * 100)
    setCents((c) => (c === next ? c : next))
  }, [value])

  const capCents = max !== undefined ? Math.round(max * 100) : 9_999_999

  const commit = (raw) => {
    const c = Math.max(0, Math.min(Math.round(raw), capCents))
    setCents(c)
    onChange(c / 100)
  }

  // Desktop: intercept keystrokes before the browser edits the text
  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault()
      commit(cents * 10 + parseInt(e.key, 10))
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      e.preventDefault()
      commit(Math.floor(cents / 10))
    }
  }

  // Mobile fallback: virtual keyboards don't reliably fire onKeyDown
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    commit(digits ? parseInt(digits, 10) : 0)
  }

  const handleFocus = (e) => {
    const len = e.target.value.length
    e.target.setSelectionRange(len, len)
  }

  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-semibold text-subtle select-none">$</span>
      <input
        {...rest}
        type="text"
        inputMode="numeric"
        value={(cents / 100).toFixed(2)}
        onKeyDown={handleKeyDown}
        onChange={handleChange}
        onFocus={handleFocus}
        className={`tabular w-full rounded-xl border border-line-strong bg-surface pr-4 pl-8 font-semibold text-ink outline-none transition focus:border-ink focus:ring-2 focus:ring-accent/40 ${inputClassName || 'h-12 text-base'}`}
      />
    </div>
  )
}

MoneyInput.propTypes = {
  value: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  max: PropTypes.number,
  className: PropTypes.string,
  inputClassName: PropTypes.string,
}
