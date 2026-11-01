/* eslint-disable react/prop-types */
// "How to try this demo" card shown on /menu and /admin. Prospective clients
// open the demo cold, so this spells out the three or four taps that show the
// whole flow. It collapses into a small pill; the choice is remembered per
// browser (convenience only, the page works without storage).
import { useState } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, ChevronDown, Lightbulb } from 'lucide-react'
import { cx } from './ui'

// Closed by default: only an explicit "open" choice is remembered.
const readCollapsed = (key) => {
  try { return localStorage.getItem(key) !== 'false' } catch { return true }
}

const writeCollapsed = (key, value) => {
  try { localStorage.setItem(key, String(value)) } catch { /* private mode: keep it in memory */ }
}

// steps: [{ title, text, to?, linkLabel?, newTab? }]
export const DemoGuide = ({ id, title, intro, steps, className = '' }) => {
  const storageKey = `demo_guide_${id}_closed`
  const [collapsed, setCollapsed] = useState(() => readCollapsed(storageKey))

  const toggle = () => {
    setCollapsed((v) => {
      writeCollapsed(storageKey, !v)
      return !v
    })
  }

  if (collapsed) {
    return (
      <div className={className}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded="false"
          className="inline-flex h-11 items-center gap-2 rounded-full border border-dashed border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-ink"
        >
          <Lightbulb size={16} className="text-accent-ink" />
          {title}
          <ChevronDown size={16} />
        </button>
      </div>
    )
  }

  return (
    <section aria-label={title} className={cx('rounded-3xl border border-line bg-surface p-5 shadow-soft md:p-6', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink">
            <Lightbulb size={19} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
            {intro && <p className="mt-0.5 text-sm leading-relaxed text-muted">{intro}</p>}
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-expanded="true"
          className="inline-flex h-11 shrink-0 items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-secondary hover:text-ink"
        >
          Ocultar
        </button>
      </div>

      <ol className={cx('mt-5 grid gap-3', steps.length >= 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-3')}>
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3 rounded-2xl bg-surface-2 p-4">
            <span className="tabular flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-ink">
              {i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{s.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-muted">{s.text}</p>
              {s.to && (
                <Link
                  to={s.to}
                  target={s.newTab ? '_blank' : undefined}
                  rel={s.newTab ? 'noopener noreferrer' : undefined}
                  className="mt-2 inline-flex min-h-8 items-center gap-1 text-sm font-semibold text-accent-ink underline-offset-4 hover:underline"
                >
                  {s.linkLabel}
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}
